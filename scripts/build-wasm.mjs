import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultOutput = join(root, "build", "wasm", "tree-sitter-vba.wasm");

export function buildWasm(outputPath = defaultOutput) {
  const parserSource = join(root, "src");
  const parserOutput = resolve(outputPath);

  if (!existsSync(parserSource)) {
    throw new Error(`Missing generated parser source directory: ${parserSource}`);
  }

  mkdirSync(dirname(parserOutput), { recursive: true });

  const cli = require.resolve("tree-sitter-cli/cli.js");
  const wasmBuildRoot = mkdtempSync(join(tmpdir(), "tree-sitter-vba-wasm-"));

  try {
    // Build from a temporary parser copy. On Windows, the Wasm linker can retain
    // a mapped source file briefly, so compiling the generated source in place
    // can prevent the next `tree-sitter generate` invocation from replacing it.
    cpSync(parserSource, join(wasmBuildRoot, "src"), { recursive: true });

    const result = spawnSync(
      process.execPath,
      [cli, "build", "--wasm", "--output", parserOutput, wasmBuildRoot],
      {
        cwd: root,
        stdio: "inherit",
        shell: false,
      },
    );

    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(`tree-sitter Wasm build failed with exit code ${result.status ?? "unknown"}`);
    }
  } finally {
    rmSync(wasmBuildRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }

  console.log(`Built WebAssembly parser at ${parserOutput}`);
  return parserOutput;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const outputPath = process.argv[2] ? resolve(root, process.argv[2]) : defaultOutput;
    buildWasm(outputPath);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
