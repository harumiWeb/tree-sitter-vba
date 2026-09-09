import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Run the VBA corpus (vba/test/corpus) against the VB6 parser.
//
// The statement grammar is shared, so every VBA corpus case is a VB6 case too,
// except where the dialects diverge by design. Those cases are skipped by an
// input-content match and listed on stdout with the reason, so the skip list is
// itself the record of the CST delta between the two parsers.
//
// tree-sitter test only reads ./test/corpus, so the corpus files are copied to a
// temp grammar directory built around the generated vb6 parser.

const require = createRequire(import.meta.url);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = require.resolve("tree-sitter-cli/cli.js");
const env = { ...process.env, CC: "gcc", CXX: "g++" };

const divergences = [
  {
    // Error-recovery shape on deliberately invalid input. The vb6 parse tables
    // differ (no LongPtr/LongLong/PtrSafe states) and recover from the same
    // invalid `Dim x() As Long, ReDim y(5)` through a different path; both
    // dialects still report an ERROR node, which is all the input can promise.
    reason: "error-recovery tree on invalid input differs between the two parse tables; both contain ERROR",
    pattern: /^\s*Dim\s+\w+\(\)\s+As\s+\w+,\s*ReDim\b/im,
  },
  {
    reason: "PtrSafe is VBA7-only; VB6 reports it as an error",
    pattern: /\bptrsafe\b/i,
  },
  {
    reason: "LongPtr / LongLong are VBA7-only type keywords; VB6 lexes them as identifiers",
    pattern: /\blong(ptr|long)\b/i,
  },
  {
    reason: "DefLngPtr / DefLngLng are VBA7-only",
    pattern: /\bdeflng(ptr|lng)\b/i,
  },
  {
    reason: "VB6 renders the .frx offset as frm_blob_offset (bare hex), VBA keeps number_literal",
    pattern: /"\s*:\s*[0-9A-Fa-f]+\s*$/m,
  },
  {
    // The base cannot see the space before the dot and folds `Foo .Bar, x` (and the
    // `Foo a, , b, name:=v, name:=v` shape) into one opaque token; VB6's scanner
    // distinguishes a spaced dot, so these parse as a callee with real arguments.
    reason: "base emits an opaque _ambiguous_call_statement token; VB6 parses callee + arguments",
    pattern: /^\s*[A-Za-z_]\w*[ \t]+(\.[A-Za-z_]\w*[ \t]*,|[A-Za-z_]\w*[ \t]*,[ \t]*,[ \t]*\w+[ \t]*,[ \t]*\w+[ \t]*:=)/m,
  },
  {
    // Deliberately invalid input (`Foo; Bar`); VB6's split penalty on expression
    // statements changes the recovery tree. Both dialects still report ERROR.
    reason: "error-recovery tree on invalid `;` separators differs; both contain ERROR",
    pattern: /^\s*\w+;\s*\w+\s*$/m,
  },
  {
    // `x = "abc` with no closing quote. VB6 gives an assignment whose target is a
    // call-shaped expression dynamic precedence 1 (see assignment_statement), and
    // that reshapes recovery here: the base folds the next line into the broken
    // assignment's right-hand side, VB6 closes the damage at the line end and
    // parses the next line on its own. Both contain ERROR.
    reason: "error-recovery tree on an unterminated string differs; both contain ERROR",
    pattern: /^(?:[^"\r\n]*"[^"\r\n]*")*[^"\r\n]*"[^"\r\n]*$/m,
  },
  {
    // `For i = 1 To 2: For j = 1 To 2: v = j: Next j: v = i: Next i`. The base pins a
    // CST in which `Next i` is a call statement; VB6 restructured single_line_block so
    // multi-statement inline loops parse, and gives the outer loop its own Next.
    reason: "inline nested loops: VB6's single_line_block owns the trailing colon, so the outer loop closes correctly",
    pattern: /:\s*Next\s+\w+\s*:\s*[^\r\n]*:\s*Next\s+\w+/i,
  },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (name.endsWith(".txt")) out.push(path);
  }
  return out;
}

// A corpus file is a sequence of cases: a line of '=', the name, a line of '=',
// the input, a line of '-', the expected tree. Attributes (:skip, :error, ...)
// may follow the name line.
function splitCases(text) {
  const lines = text.split(/\r?\n/);
  const cases = [];
  let i = 0;
  while (i < lines.length) {
    if (!/^=+$/.test(lines[i])) {
      i++;
      continue;
    }
    const start = i;
    i++;
    const name = lines[i++];
    while (i < lines.length && !/^=+$/.test(lines[i])) i++;
    i++;
    const inputStart = i;
    while (i < lines.length && !/^-+$/.test(lines[i])) i++;
    const input = lines.slice(inputStart, i).join("\n");
    i++;
    while (i < lines.length && !/^=+$/.test(lines[i])) i++;
    cases.push({ name, input, text: lines.slice(start, i).join("\n") });
  }
  return cases;
}

const corpusDir = join(repoRoot, "vba", "test", "corpus");
const work = mkdtempSync(join(tmpdir(), "vb-shared-corpus-"));
const outCorpus = join(work, "test", "corpus");
let kept = 0;
const skipped = [];

for (const file of walk(corpusDir)) {
  const cases = splitCases(readFileSync(file, "utf8"));
  for (const c of cases) {
    const hit = divergences.find((d) => d.pattern.test(c.input));
    if (hit) skipped.push({ file: relative(repoRoot, file), name: c.name, reason: hit.reason });
    else kept++;
  }
  // Copy the file verbatim so the runner sees exactly what vba/test/corpus holds;
  // skipped cases are excluded by name below rather than by rewriting the file.
  const target = join(outCorpus, relative(corpusDir, file));
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(file, target);
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exclude = skipped.length > 0 ? ["-e", `^(${skipped.map((s) => escape(s.name)).join("|")})$`] : [];

// `tree-sitter test --lib-path` panics in CLI 0.26.9 when the working directory
// is not a grammar directory, so the temp dir is made into one: a single-grammar
// tree-sitter.json plus a copy of the generated vb6/src. Generate vb6 first.
cpSync(join(repoRoot, "vb6", "src"), join(work, "src"), { recursive: true });
writeFileSync(
  join(work, "tree-sitter.json"),
  JSON.stringify(
    {
      grammars: [{ name: "vb6", camelcase: "Vb6", scope: "source.vb6", path: ".", "file-types": ["bas", "cls", "frm", "ctl"] }],
      metadata: { version: "0.0.0", license: "MIT", description: "shared corpus runner" },
    },
    null,
    2,
  ),
);

console.log(`Shared corpus under vb6: running ${kept} cases, skipping ${skipped.length} by design:`);
for (const s of skipped) console.log(`  - ${s.file} :: ${s.name}  [${s.reason}]`);

const result = spawnSync(
  process.execPath,
  [cli, "test", ...exclude, ...process.argv.slice(2)],
  { cwd: work, stdio: "inherit", env },
);
rmSync(work, { recursive: true, force: true });
process.exit(result.status ?? 1);
