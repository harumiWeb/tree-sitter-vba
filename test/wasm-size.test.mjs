import assert from "node:assert/strict";
import { closeSync, ftruncateSync, mkdirSync, mkdtempSync, openSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  describeArtifact,
  findWasmArtifacts,
  MAIN_THREAD_INSTANTIATE_LIMIT,
  MAX_ARTIFACT_BYTES,
  oversizedArtifactReport,
  summarizeArtifacts,
} from "../scripts/check-wasm-size.mjs";

// Sparse files: the gate reads `statSync().size`, so a multi-megabyte artifact
// costs nothing to fake and the fixtures stay in temporary directories.
function createArtifact(path, size) {
  mkdirSync(join(path, ".."), { recursive: true });
  const handle = openSync(path, "w");
  try {
    ftruncateSync(handle, size);
  } finally {
    closeSync(handle);
  }
}

function withFixtureRoot(run) {
  const root = mkdtempSync(join(tmpdir(), "tree-sitter-vba-wasm-size-"));
  try {
    return run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("gate is below the browser main-thread instantiation limit", () => {
  assert.ok(
    MAX_ARTIFACT_BYTES < MAIN_THREAD_INSTANTIATE_LIMIT,
    "an artifact at the limit is already unloadable, so the gate must trip before it",
  );
  assert.ok(
    MAX_ARTIFACT_BYTES < 8_000_000,
    "Chromium reports the limit as 8MB without stating its unit, so the gate must hold " +
      "whether that means 8,000,000 or 8,388,608 bytes",
  );
});

test("an artifact at the gate is accepted", () => {
  assert.equal(
    oversizedArtifactReport([{ name: "tree-sitter-vba.wasm", size: MAX_ARTIFACT_BYTES }]),
    null,
  );
});

test("an artifact over the gate fails and names the browser constraint", () => {
  const report = oversizedArtifactReport([
    { name: "build/wasm/tree-sitter-vba.wasm", size: MAX_ARTIFACT_BYTES + 1 },
  ]);

  assert.ok(report, "an oversized artifact must produce a failure report");
  // The message, not just the exit code, is the deliverable: an unloadable
  // artifact previously surfaced as an unrelated browser-test timeout.
  assert.match(report, /build\/wasm\/tree-sitter-vba\.wasm/);
  assert.match(report, /7,864,321 bytes/);
  assert.match(report, /WebAssembly\.Instance is disallowed on the main thread/);
  assert.match(report, /Language\.load\(\)/);
});

test("every oversized artifact is reported, not only the first", () => {
  const report = oversizedArtifactReport([
    { name: "one.wasm", size: MAX_ARTIFACT_BYTES + 1 },
    { name: "two.wasm", size: MAIN_THREAD_INSTANTIATE_LIMIT * 2 },
  ]);

  assert.match(report, /one\.wasm/);
  assert.match(report, /two\.wasm/);
});

test("a size is reported for an artifact that passes", () => {
  const line = describeArtifact({ name: "tree-sitter-vba.wasm", size: 7_469_289 });

  assert.match(line, /7,469,289 bytes/);
  assert.match(line, /89\.0% of the 8\.00 MiB/);
});

test("the job summary marks which artifact is over the gate", () => {
  const summary = summarizeArtifacts([
    { name: "small.wasm", size: 1024 },
    { name: "large.wasm", size: MAX_ARTIFACT_BYTES + 1 },
  ]);

  assert.match(summary, /\| `small\.wasm` \|.*\| ok \|/);
  assert.match(summary, /\| `large\.wasm` \|.*\| over gate \|/);
});

test("discovery finds nested artifacts and skips the vendored runtime", () => {
  withFixtureRoot((root) => {
    createArtifact(join(root, "build", "wasm", "tree-sitter-vba.wasm"), 2048);
    createArtifact(join(root, "build", "browser-consumer", "tree-sitter-vba.wasm"), 4096);
    createArtifact(join(root, "playground", "dist", "tree-sitter-vba.wasm"), 8192);
    // Owned by the pinned `web-tree-sitter` package rather than this grammar.
    createArtifact(
      join(root, "build", "browser-consumer", "vendor", "web-tree-sitter.wasm"),
      MAIN_THREAD_INSTANTIATE_LIMIT * 2,
    );

    const names = findWasmArtifacts(root).map((artifact) => artifact.name);

    assert.equal(names.length, 3);
    assert.ok(!names.some((name) => name.includes("vendor")));
  });
});

test("discovery ignores a search root that has not been built", () => {
  withFixtureRoot((root) => {
    assert.deepEqual(findWasmArtifacts(root), []);
  });
});
