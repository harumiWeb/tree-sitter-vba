import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const playgroundRoot = join(root, "playground");
const siteRoot = join(playgroundRoot, "site");
const examplesRoot = join(playgroundRoot, "examples");
const queriesRoot = join(root, "queries");
const distRoot = join(playgroundRoot, "dist");
const vendorRoot = join(distRoot, "vendor");

for (const requiredPath of [siteRoot, examplesRoot, queriesRoot]) {
  if (!existsSync(requiredPath)) {
    console.error(`Missing playground source directory: ${requiredPath}`);
    process.exit(1);
  }
}

rmSync(distRoot, { recursive: true, force: true });
mkdirSync(vendorRoot, { recursive: true });
cpSync(siteRoot, distRoot, {
  recursive: true,
  filter: (source) => !source.endsWith(".mjs"),
});
cpSync(examplesRoot, join(distRoot, "examples"), { recursive: true });
mkdirSync(join(distRoot, "queries"), { recursive: true });
cpSync(join(queriesRoot, "highlights.scm"), join(distRoot, "queries", "highlights.scm"));

const webTreeSitterRoot = dirname(require.resolve("web-tree-sitter"));
cpSync(join(webTreeSitterRoot, "web-tree-sitter.js"), join(vendorRoot, "web-tree-sitter.js"));
cpSync(
  require.resolve("web-tree-sitter/web-tree-sitter.wasm"),
  join(vendorRoot, "web-tree-sitter.wasm"),
);

const cli = require.resolve("tree-sitter-cli/cli.js");
const parserOutput = join(distRoot, "tree-sitter-vba.wasm");
const wasmBuildRoot = mkdtempSync(join(tmpdir(), "tree-sitter-vba-wasm-"));
let buildExitCode = 0;

try {
  // Build from a temporary parser copy. On Windows, the Wasm linker can retain
  // a mapped source file briefly, so compiling the generated source in place
  // can prevent the next `tree-sitter generate` invocation from replacing it.
  cpSync(join(root, "src"), join(wasmBuildRoot, "src"), { recursive: true });
  const build = spawnSync(
    process.execPath,
    [cli, "build", "--wasm", "--output", parserOutput, wasmBuildRoot],
    {
      cwd: root,
      stdio: "inherit",
      shell: false,
    },
  );

  if (build.status !== 0 || build.error) {
    if (build.error) {
      console.error(build.error.message);
    }
    buildExitCode = build.status ?? 1;
  }
} finally {
  rmSync(wasmBuildRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}

if (buildExitCode !== 0) {
  process.exit(buildExitCode);
}

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const revision = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: root,
  encoding: "utf8",
  shell: process.platform === "win32",
});
const commit = revision.status === 0 ? revision.stdout.trim() : "unknown";

writeFileSync(
  join(distRoot, "version.json"),
  `${JSON.stringify({ version: packageJson.version, commit }, null, 2)}\n`,
);
writeFileSync(join(distRoot, ".nojekyll"), "");

await build({
  entryPoints: [join(siteRoot, "app.js")],
  outfile: join(distRoot, "app.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  external: ["./vendor/web-tree-sitter.js"],
});

console.log(`Built playground assets in ${distRoot}`);
