import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Usage: node scripts/compare-cst.mjs --base <dir> [--out <dir>] [--allow <node-type>]... [--reuse]
//
// Parses every checked-in VBA example with two parsers and diffs the trees with
// positions stripped, so the diff is about structure and not about byte offsets.
// `--base` is the working directory whose tree-sitter.json selects the reference
// grammar: the root of a `main` checkout or worktree, or `<checkout>/vba` for a
// checkout that already has the dialect layout. The second parser is this
// repository's vba/.
//
// Clean-parse checks cannot see a CST regression: a bare call whose callee has
// been split into its own expression_statement still has zero ERROR nodes. This
// script exists because that is exactly what escaped the example suite once.
//
// Both grammars are named `vba`, so the CLI would compile them into the same
// cache slot and rebuild on every alternation. Each side gets its own
// TREE_SITTER_LIBDIR instead.
//
// `--allow <node-type>` names an intentional difference. Each differing file is
// split into hunks; a hunk that mentions an allowed node type on either side is
// explained, and a file whose every hunk is explained does not fail the run.
// `--reuse` skips parsing and re-reads the trees a previous run left in --out.

const require = createRequire(import.meta.url);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = require.resolve("tree-sitter-cli/cli.js");

const args = process.argv.slice(2);
let baseDir;
let outDir = join(tmpdir(), "tree-sitter-vba-cst-compare");
let reuse = false;
const allowed = [];
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--base") baseDir = resolve(args[++i]);
  else if (args[i] === "--out") outDir = resolve(args[++i]);
  else if (args[i] === "--allow") allowed.push(args[++i]);
  else if (args[i] === "--reuse") reuse = true;
  else {
    console.error(`Unknown argument: ${args[i]}`);
    process.exit(1);
  }
}
if (!baseDir) {
  console.error(
    "Usage: node scripts/compare-cst.mjs --base <dir> [--out <dir>] [--allow <node-type>]... [--reuse]",
  );
  process.exit(1);
}

const examplesRoot = join(repoRoot, "examples");
const ignoredSegments = new Set([".xlflow", "build", "broken"]);
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (ignoredSegments.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(bas|cls|frm)$/i.test(path)) files.push(path);
  }
}
walk(examplesRoot);
files.sort();

const sides = [
  { name: "base", cwd: baseDir, libdir: join(outDir, "lib-base") },
  { name: "head", cwd: join(repoRoot, "vba"), libdir: join(outDir, "lib-head") },
];

function parse(side, file) {
  const result = spawnSync(process.execPath, [cli, "parse", file], {
    cwd: side.cwd,
    encoding: "utf8",
    shell: false,
    env: { ...process.env, CC: "gcc", CXX: "g++", TREE_SITTER_LIBDIR: side.libdir },
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  return result.stdout ?? "";
}

// `(identifier [1, 4] - [1, 14])` -> `(identifier)`.
function stripPositions(tree) {
  return tree.replace(/ \[\d+, \d+\] - \[\d+, \d+\]/g, "");
}

// Myers diff on lines, returned as hunks of { base: [...], head: [...] }.
function diffHunks(a, b) {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const trace = [];
  let v = new Map([[1, 0]]);
  outer: for (let d = 0; d <= max; d += 1) {
    trace.push(v);
    const next = new Map();
    for (let k = -d; k <= d; k += 2) {
      let x;
      if (k === -d || (k !== d && v.get(k - 1) < v.get(k + 1))) x = v.get(k + 1);
      else x = v.get(k - 1) + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x += 1;
        y += 1;
      }
      next.set(k, x);
      if (x >= n && y >= m) {
        v = next;
        trace.push(v);
        break outer;
      }
    }
    v = next;
  }
  // Walk back to recover the edit script.
  const ops = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 2; d >= 0; d -= 1) {
    const prev = trace[d];
    const k = x - y;
    let prevK;
    if (k === -d || (k !== d && prev.get(k - 1) < prev.get(k + 1))) prevK = k + 1;
    else prevK = k - 1;
    const prevX = prev.get(prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      ops.push(["=", a[x - 1]]);
      x -= 1;
      y -= 1;
    }
    if (d > 0) {
      if (x === prevX) ops.push(["+", b[y - 1]]);
      else ops.push(["-", a[x - 1]]);
    }
    x = prevX;
    y = prevY;
  }
  ops.reverse();
  const hunks = [];
  let current = null;
  for (const [op, line] of ops) {
    if (op === "=") {
      current = null;
      continue;
    }
    if (!current) {
      current = { base: [], head: [] };
      hunks.push(current);
    }
    (op === "-" ? current.base : current.head).push(line);
  }
  return hunks;
}

const nodeTypes = (lines) =>
  [...new Set(lines.flatMap((l) => [...l.matchAll(/\((\w+)/g)].map((m) => m[1])))].sort();

if (!reuse) {
  for (const side of sides) {
    mkdirSync(join(outDir, side.name), { recursive: true });
    mkdirSync(side.libdir, { recursive: true });
    process.stderr.write(`Parsing ${files.length} files with the ${side.name} parser\n`);
    let done = 0;
    for (const file of files) {
      const rel = relative(examplesRoot, file);
      const out = join(outDir, side.name, `${rel}.txt`);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, stripPositions(parse(side, file)));
      done += 1;
      if (done % 100 === 0) process.stderr.write(`  ${side.name}: ${done}/${files.length}\n`);
    }
  }
}

let differing = 0;
let unexplained = 0;
const hunkTally = new Map();
for (const file of files) {
  const rel = relative(examplesRoot, file);
  const base = readFileSync(join(outDir, "base", `${rel}.txt`), "utf8").split("\n");
  const head = readFileSync(join(outDir, "head", `${rel}.txt`), "utf8").split("\n");
  if (base.join("\n") === head.join("\n")) continue;
  differing += 1;
  const hunks = diffHunks(base, head);
  let fileExplained = true;
  const summary = [];
  for (const hunk of hunks) {
    const types = nodeTypes([...hunk.base, ...hunk.head]);
    const explained = types.some((t) => allowed.includes(t));
    if (!explained) fileExplained = false;
    const key = `${nodeTypes(hunk.base).join(",") || "-"} -> ${nodeTypes(hunk.head).join(",") || "-"}`;
    hunkTally.set(key, (hunkTally.get(key) ?? 0) + 1);
    summary.push(`${explained ? "  ok  " : "  ??  "} ${key}`);
  }
  if (!fileExplained) unexplained += 1;
  console.log(`${fileExplained ? "allowed" : "DIFF   "} ${rel}  (${hunks.length} hunks)`);
  for (const line of summary) console.log(line);
}

console.log(`\nHunk shapes (base node types -> head node types):`);
for (const [key, count] of [...hunkTally.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(5)}  ${key}`);
}
console.log(
  `\n${files.length} files, ${differing} differ, ${unexplained} with hunks not covered by --allow`,
);
console.log(`Trees under ${outDir}`);
process.exit(unexplained > 0 ? 1 : 0);
