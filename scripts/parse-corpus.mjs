import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Parse every VB6 corpus file (corpus/**/*.{bas,cls,frm,ctl}) with the vb6
// parser and report ERROR / MISSING node counts per failing file, totals, and
// the parse time of the largest file. This is the acceptance instrument for the
// VB6 grammar: the bar is zero ERROR and zero MISSING nodes across the corpus.
//
// Usage: node scripts/parse-corpus.mjs [--dialect vb6|vba] [--root <dir>] [--verbose] [--transcode] [--include-excluded]
//
// corpus/EXCLUDED.json lists files that VB6 itself would reject (an unclosed For, a
// Property closed by End Function, a truncated line). They stay in the corpus as real
// code but are reported separately and do not count against the grammar unless
// --include-excluded is given.
//
// --transcode: tree-sitter's API takes UTF-8 or UTF-16, and VB6 source is stored in a
// legacy code page (Windows-1252 mostly; GBK or Big5 for Chinese projects). Files that
// are not valid UTF-8 are decoded with the code page named in corpus/ENCODINGS.json
// (default windows-1252) and parsed from a UTF-8 temp copy. Without the flag the raw
// bytes are fed to the parser, which is how a consumer that skips transcoding sees them.
//
// MISSING nodes are counted as zero-width named leaves: the CLI prints them as ordinary
// nodes (`(identifier [r, c] - [r, c])`) and only names the first in its summary line.

const require = createRequire(import.meta.url);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = require.resolve("tree-sitter-cli/cli.js");

const args = process.argv.slice(2);
function flag(name, fallback) {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
}
const dialect = flag("--dialect", "vb6");
const root = resolve(flag("--root", join(repoRoot, "corpus")));
const verbose = args.includes("--verbose");
const transcode = args.includes("--transcode");
const includeExcluded = args.includes("--include-excluded");
const excludedPath = join(root, "EXCLUDED.json");
const excluded = existsSync(excludedPath) ? JSON.parse(readFileSync(excludedPath, "utf8")) : {};
delete excluded._comment;
const encodingsPath = join(root, "ENCODINGS.json");
const encodings = existsSync(encodingsPath) ? JSON.parse(readFileSync(encodingsPath, "utf8")) : {};
const scratch = transcode ? mkdtempSync(join(tmpdir(), "vb6-corpus-utf8-")) : null;
const utf8Strict = new TextDecoder("utf-8", { fatal: true });

function utf8Copy(file) {
  const bytes = readFileSync(file);
  try {
    utf8Strict.decode(bytes);
    return { path: file, encoding: "utf-8" };
  } catch {
    const project = relative(root, file).split(/[\\/]/)[0];
    const encoding = encodings[project] ?? "windows-1252";
    const text = new TextDecoder(encoding).decode(bytes);
    const copy = join(scratch, relative(root, file).replace(/[\\/]/g, "__"));
    writeFileSync(copy, text);
    return { path: copy, encoding };
  }
}

const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(bas|cls|frm|ctl)$/i.test(name)) files.push(path);
  }
}
walk(root);
files.sort();
if (files.length === 0) {
  console.error(`No corpus files under ${root}`);
  process.exit(1);
}

let errorNodes = 0;
let missingNodes = 0;
const transcoded = {};
const excludedFailures = [];
let failingFiles = 0;
let largest = { file: null, bytes: 0, ms: 0 };
const byExt = {};
const failures = [];

for (const file of files) {
  const bytes = statSync(file).size;
  const ext = file.split(".").pop().toLowerCase();
  byExt[ext] = (byExt[ext] ?? 0) + 1;
  let target = file;
  if (transcode) {
    const copy = utf8Copy(file);
    target = copy.path;
    if (copy.encoding !== "utf-8") transcoded[copy.encoding] = (transcoded[copy.encoding] ?? 0) + 1;
  }
  const started = process.hrtime.bigint();
  const result = spawnSync(process.execPath, [cli, "parse", target], {
    cwd: join(repoRoot, dialect),
    encoding: "utf8",
    env: { ...process.env, CC: "gcc", CXX: "g++" },
    maxBuffer: 64 * 1024 * 1024,
  });
  const wallMs = Number(process.hrtime.bigint() - started) / 1e6;
  const out = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const errors = (out.match(/\(ERROR\b/g) ?? []).length;
  const missing = (out.match(/\(\w+ \[(\d+), (\d+)\] - \[\1, \2\]\)/g) ?? []).length;
  if (bytes > largest.bytes) largest = { file, bytes, wallMs };
  const relPath = relative(root, file).replace(/\\/g, "/");
  if ((errors + missing > 0 || result.status !== 0) && excluded[relPath] && !includeExcluded) {
    excludedFailures.push({ file: relPath, reason: excluded[relPath] });
    continue;
  }
  if (errors + missing > 0 || result.status !== 0) {
    failingFiles++;
    errorNodes += errors;
    missingNodes += missing;
    const firstError = out.split(/\r?\n/).find((l) => /\((ERROR|MISSING)\b/.test(l))?.trim();
    failures.push({ file: relative(root, file), errors, missing, firstError, status: result.status });
  }
}

for (const f of failures) {
  console.log(`FAIL ${f.file}  ERROR=${f.errors} MISSING=${f.missing}${f.status ? ` exit=${f.status}` : ""}`);
  if (verbose && f.firstError) console.log(`     ${f.firstError}`);
}

console.log("");
console.log(`Corpus root: ${root}`);
console.log(`Dialect: ${dialect}`);
console.log(`Files: ${files.length} (${Object.entries(byExt).map(([k, v]) => `${k}=${v}`).join(", ")})`);
console.log(`Files with ERROR/MISSING: ${failingFiles}`);
if (excludedFailures.length > 0) {
  console.log(`Excluded (genuine syntax errors in the source, see EXCLUDED.json): ${excludedFailures.length}`);
  for (const e of excludedFailures) console.log(`  - ${e.file}: ${e.reason}`);
}
console.log(`ERROR nodes: ${errorNodes}   MISSING nodes (zero-width leaves): ${missingNodes}`);
if (transcode) {
  const parts = Object.entries(transcoded).map(([k, v]) => `${v} via ${k}`);
  console.log(`Transcoded to UTF-8: ${parts.length > 0 ? parts.join(", ") : "none needed"}`);
}
if (largest.file) {
  console.log(
    `Largest file: ${relative(root, largest.file)} (${largest.bytes} bytes), tree-sitter CLI wall time ${largest.wallMs.toFixed(0)} ms (process spawn included; see --time for parse-only)`,
  );
}
if (scratch) rmSync(scratch, { recursive: true, force: true });
process.exit(failingFiles === 0 ? 0 : 1);
