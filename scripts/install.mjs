import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (!existsSync("src/parser.c")) {
  console.log("Skipping native binding build: src/parser.c is generated during development.");
  process.exit(0);
}

const result = spawnSync("node-gyp-build", {
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
