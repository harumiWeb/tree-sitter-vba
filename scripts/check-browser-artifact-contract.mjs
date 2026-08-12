import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const treeSitterJson = JSON.parse(readFileSync(join(root, "tree-sitter.json"), "utf8"));
const lockfile = readFileSync(join(root, "pnpm-lock.yaml"), "utf8");
const specification = readFileSync(join(root, "docs", "specs", "wasm-artifact.md"), "utf8");
const releaseWorkflow = readFileSync(
  join(root, ".github", "workflows", "release-wasm.yml"),
  "utf8",
);

function fail(message) {
  throw new Error(`Browser artifact contract violation: ${message}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertEqual(actual, expected, description) {
  if (actual !== expected) {
    fail(`${description} (${JSON.stringify(actual)} !== ${JSON.stringify(expected)})`);
  }
}

function assertIncludes(text, expected, description) {
  if (!text.includes(expected)) {
    fail(`${description} is missing ${JSON.stringify(expected)}`);
  }
}

function assertLockfileImporterVersion(name, version) {
  const pattern = new RegExp(
    `${escapeRegExp(name)}:\\r?\\n\\s+specifier: ${escapeRegExp(version)}\\r?\\n\\s+version: ${escapeRegExp(version)}(?:\\r?\\n|$)`,
  );
  if (!pattern.test(lockfile)) {
    fail(`pnpm-lock.yaml does not pin the importer entry for ${name}@${version}`);
  }
}

function assertLockfilePackageVersion(name, version) {
  const pattern = new RegExp(`${escapeRegExp(name)}@${escapeRegExp(version)}:`);
  if (!pattern.test(lockfile)) {
    fail(`pnpm-lock.yaml does not contain ${name}@${version}`);
  }
}

const cliVersion = packageJson.devDependencies?.["tree-sitter-cli"];
const runtimeVersion = packageJson.devDependencies?.["web-tree-sitter"];
const abiMatch = packageJson.scripts?.generate?.match(/--abi\s+(\d+)/);
const abi = abiMatch?.[1];

if (
  !/^\d+\.\d+\.\d+$/.test(cliVersion ?? "") ||
  !/^\d+\.\d+\.\d+$/.test(runtimeVersion ?? "") ||
  !abi
) {
  fail("package.json must define exact browser generator, runtime, and ABI versions");
}

assertEqual(packageJson.name, "tree-sitter-vba", "package name");
assertEqual(
  treeSitterJson.metadata?.version,
  packageJson.version,
  "tree-sitter.json metadata version",
);
assertIncludes(packageJson.scripts["build:wasm"], "pnpm generate", "build:wasm generation step");
assertIncludes(packageJson.scripts["build:wasm"], "scripts/build-wasm.mjs", "build:wasm builder");
assertIncludes(packageJson.files.join("\n"), "src/**", "npm parser source inclusion");
if (packageJson.files.some((entry) => /(?:^|[\\/])build(?:[\\/]|$)|\.wasm$/i.test(entry))) {
  fail("npm package file list must not publish the standalone browser artifact");
}

assertLockfileImporterVersion("tree-sitter-cli", cliVersion);
assertLockfileImporterVersion("web-tree-sitter", runtimeVersion);
assertLockfilePackageVersion("tree-sitter-cli", cliVersion);
assertLockfilePackageVersion("web-tree-sitter", runtimeVersion);

for (const [value, description] of [
  ["tree-sitter-vba.wasm", "artifact name"],
  ["pnpm install --frozen-lockfile", "reproducible install command"],
  [`tree-sitter-cli@${cliVersion}`, "generator version"],
  [`web-tree-sitter@${runtimeVersion}`, "browser runtime version"],
  [`Tree-sitter ABI ${abi}`, "parser ABI"],
  ["releases/download/v<version>/tree-sitter-vba.wasm", "release URL"],
  ["Parser.init", "runtime initialization procedure"],
  ["Language.load", "grammar loading procedure"],
  ["tree.delete()", "tree cleanup procedure"],
  ["parser.delete()", "parser cleanup procedure"],
]) {
  assertIncludes(specification, value, description);
}

for (const [value, description] of [
  ["pnpm test:wasm", "release artifact loading test"],
  ["sha256sum build/wasm/tree-sitter-vba.wasm", "release checksum"],
  ["tree-sitter-vba.wasm.sha256", "checksum asset"],
  ["gh release upload", "GitHub Release upload"],
]) {
  assertIncludes(releaseWorkflow, value, description);
}

console.log(
  `Browser artifact contract is consistent for tree-sitter-vba@${packageJson.version}, ` +
    `tree-sitter-cli@${cliVersion}, web-tree-sitter@${runtimeVersion}, ABI ${abi}.`,
);
