import { appendFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Chromium refuses a synchronous `WebAssembly.Instance` on the main thread once
// the buffer is larger than 8MB, and that is the instantiation `Language.load()`
// performs. Past it the grammar is unloadable in a standard browser rather than
// merely slower.
export const MAIN_THREAD_INSTANTIATE_LIMIT = 8 * 1024 * 1024;

// The gate sits below the limit rather than at it, for two reasons. An artifact
// that trips at the limit is already broken for every browser consumer, so the
// margin is what turns a shipped defect into a build failure on the commit that
// grows the parser. And Chromium reports the limit as "8MB" without saying
// whether it counts 8,000,000 or 8,388,608 bytes; a gate under both readings
// does not depend on resolving that.
export const HEADROOM_BYTES = 512 * 1024;
export const MAX_ARTIFACT_BYTES = MAIN_THREAD_INSTANTIATE_LIMIT - HEADROOM_BYTES;

// Grammar artifacts are written to `build/` by `pnpm build:wasm` and its
// consumers, and to `playground/dist/` by the playground build. Every match is
// checked, so a further dialect artifact is covered without editing this script.
export const SEARCH_ROOTS = ["build", join("playground", "dist")];

// `vendor/` holds `web-tree-sitter.wasm`, copied from the pinned runtime package
// rather than built here. Its size is not this repository's to control.
const EXCLUDED_DIRECTORIES = new Set(["vendor", "node_modules"]);

function bytes(value) {
  return value.toLocaleString("en-US");
}

function mib(value) {
  return `${(value / 1024 / 1024).toFixed(2)} MiB`;
}

function percentOfLimit(value) {
  return `${((value / MAIN_THREAD_INSTANTIATE_LIMIT) * 100).toFixed(1)}%`;
}

function displayName(path, base) {
  const name = relative(base, path);
  return name.startsWith("..") || isAbsolute(name) ? path : name;
}

function collect(directory, base) {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const found = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRECTORIES.has(entry.name)) {
        found.push(...collect(path, base));
      }
    } else if (entry.isFile() && entry.name.endsWith(".wasm")) {
      found.push({ name: displayName(path, base), size: statSync(path).size });
    }
  }
  return found;
}

export function findWasmArtifacts(base = root, searchRoots = SEARCH_ROOTS) {
  return searchRoots.flatMap((searchRoot) => collect(join(base, searchRoot), base));
}

export function describeArtifact(artifact) {
  return (
    `${artifact.name}: ${bytes(artifact.size)} bytes (${mib(artifact.size)}), ` +
    `${percentOfLimit(artifact.size)} of the ${mib(MAIN_THREAD_INSTANTIATE_LIMIT)} ` +
    "browser main-thread instantiation limit"
  );
}

export function summarizeArtifacts(artifacts) {
  return [
    "### Browser parser artifact size",
    "",
    `Gate ${bytes(MAX_ARTIFACT_BYTES)} bytes (${mib(MAX_ARTIFACT_BYTES)}), ` +
      `browser main-thread instantiation limit ${bytes(MAIN_THREAD_INSTANTIATE_LIMIT)} ` +
      `bytes (${mib(MAIN_THREAD_INSTANTIATE_LIMIT)}).`,
    "",
    "| Artifact | Bytes | Size | Of limit | Status |",
    "| --- | --- | --- | --- | --- |",
    ...artifacts.map(
      (artifact) =>
        `| \`${artifact.name}\` | ${bytes(artifact.size)} | ${mib(artifact.size)} | ` +
        `${percentOfLimit(artifact.size)} | ` +
        `${artifact.size > MAX_ARTIFACT_BYTES ? "over gate" : "ok"} |`,
    ),
    "",
  ].join("\n");
}

// Returns null when every artifact is loadable, otherwise the failure message.
// The message names the browser constraint rather than only the size, because a
// bare "file too large" is as unhelpful as the smoke-test timeout it replaces.
export function oversizedArtifactReport(artifacts) {
  const oversized = artifacts.filter((artifact) => artifact.size > MAX_ARTIFACT_BYTES);
  if (oversized.length === 0) {
    return null;
  }

  const lines = [
    "Browser parser artifact exceeds the size a standard browser can instantiate.",
    "",
  ];
  for (const artifact of oversized) {
    lines.push(
      `  ${artifact.name}`,
      `    size  ${bytes(artifact.size)} bytes (${mib(artifact.size)})`,
      `    gate  ${bytes(MAX_ARTIFACT_BYTES)} bytes (${mib(MAX_ARTIFACT_BYTES)})`,
      `    limit ${bytes(MAIN_THREAD_INSTANTIATE_LIMIT)} bytes ` +
        `(${mib(MAIN_THREAD_INSTANTIATE_LIMIT)})`,
      "",
    );
  }
  lines.push(
    "Chromium disallows a synchronous `WebAssembly.Instance` on the main thread when the",
    "buffer is larger than 8MB, which is the instantiation `Language.load()` performs:",
    "",
    "    WebAssembly.Instance is disallowed on the main thread, if the buffer size is",
    "    larger than 8MB. Use WebAssembly.instantiate() instead.",
    "",
    "Above that size the browser parser fails at `Language.load()`. Asset loading and",
    "`Parser.init()` still succeed, `parser.setLanguage()` and the first parse are never",
    "reached, and the grammar is unloadable in a standard browser rather than merely slower.",
    "",
    `The gate is ${bytes(HEADROOM_BYTES)} bytes below the limit so this fails while the`,
    "artifact is still loadable. Reduce the generated parser, or load the grammar through an",
    "asynchronous instantiation path that supports a larger artifact. Raising the gate would",
    "leave browser consumers with a parser they cannot load.",
  );
  return lines.join("\n");
}

function main() {
  const artifacts = findWasmArtifacts();

  if (artifacts.length === 0) {
    console.error(
      `No WebAssembly parser artifact found under ${SEARCH_ROOTS.join(" or ")}. ` +
        "Run `pnpm build:wasm` before checking artifact size.",
    );
    return 1;
  }

  // Reported on every run, not only on failure: a size in each build log makes
  // parser growth visible as a trend well before it reaches the gate.
  for (const artifact of artifacts) {
    console.log(describeArtifact(artifact));
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summarizeArtifacts(artifacts));
  }

  const failure = oversizedArtifactReport(artifacts);
  if (failure) {
    console.error(failure);
    return 1;
  }

  console.log(
    `Browser parser artifact size is within the ${bytes(MAX_ARTIFACT_BYTES)} byte ` +
      `(${mib(MAX_ARTIFACT_BYTES)}) gate.`,
  );
  return 0;
}

function isDirectInvocation() {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  // Both sides go through realpath: with a symlinked invocation path, comparing
  // the strings alone makes the gate silently pass without checking anything.
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return resolve(entry) === fileURLToPath(import.meta.url);
  }
}

if (isDirectInvocation()) {
  process.exitCode = main();
}
