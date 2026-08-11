import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dist = join(root, "build", "browser-consumer");

test("browser consumer build is self-contained", () => {
  for (const file of [
    "index.html",
    "app.js",
    "recovery.mjs",
    "tree-sitter-vba.wasm",
    "vendor/web-tree-sitter.js",
    "vendor/web-tree-sitter.wasm",
  ]) {
    assert.equal(existsSync(join(dist, file)), true, `missing ${file}`);
  }

  const index = readFileSync(join(dist, "index.html"), "utf8");
  const app = readFileSync(join(dist, "app.js"), "utf8");
  assert.doesNotMatch(index, /(?:playground|node_modules|build[\\/]+wasm)/i);
  assert.doesNotMatch(app, /(?:playground|node_modules|build[\\/]wasm)/i);
  assert.doesNotMatch(app, /from\s+["']\.\/recovery\.mjs["']/);
  assert.match(app, /Parser\.init/);
  assert.match(app, /Language\.load/);
  assert.match(app, /tree\.delete\(\)/);
});
