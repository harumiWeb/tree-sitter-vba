#!/usr/bin/env node
// Reconstruct the VB6 acceptance corpus from upstream repositories.
//
// The corpus is not vendored. corpus/MANIFEST.md pins every project to a full
// commit SHA and records its licence; corpus/FILES.tsv lists every file. This
// script clones each project at its pinned SHA and copies exactly those paths,
// so the set is byte-identical to the one the acceptance numbers were measured
// against, without redistributing anyone else's source.
//
//   node scripts/fetch-corpus.mjs [--only <owner__repo>] [--jobs N]

import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = new URL("..", import.meta.url).pathname;
const CORPUS = join(ROOT, "corpus");

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const jobs = args.includes("--jobs") ? Number(args[args.indexOf("--jobs") + 1]) : 4;

async function projects() {
  const rows = (await readFile(join(CORPUS, "MANIFEST.md"), "utf8"))
    .split("\n")
    .filter((l) => l.startsWith("|") && !l.includes("---"));
  const header = rows[0].slice(1, -1).split("|").map((c) => c.trim());
  const col = (n) => header.indexOf(n);
  return rows.slice(1).map((r) => {
    const c = r.slice(1, -1).split("|").map((x) => x.trim());
    return { name: c[col("Project")], url: c[col("URL")], sha: c[col("Commit SHA (full)")] };
  });
}

async function fileList() {
  const byProject = new Map();
  const text = await readFile(join(CORPUS, "FILES.tsv"), "utf8");
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const [project, path] = line.split("\t");
    if (!byProject.has(project)) byProject.set(project, []);
    byProject.get(project).push(path);
  }
  return byProject;
}

async function fetchOne(project, paths) {
  const tmp = await mkdtemp(join(tmpdir(), "vb6-corpus-"));
  try {
    await run("git", ["init", "--quiet"], { cwd: tmp });
    await run("git", ["remote", "add", "origin", project.url], { cwd: tmp });
    await run("git", ["fetch", "--quiet", "--depth", "1", "origin", project.sha], { cwd: tmp });
    await run("git", ["checkout", "--quiet", "FETCH_HEAD"], { cwd: tmp });

    const dest = join(CORPUS, project.name);
    let copied = 0;
    for (const path of paths) {
      const target = join(dest, path);
      await mkdir(dirname(target), { recursive: true });
      // Copy raw bytes. Most files are Windows-1252 with CRLF and must not be
      // re-encoded; the parser's caller transcodes to UTF-8 at read time.
      await copyFile(join(tmp, path), target);
      copied += 1;
    }
    for (const name of ["LICENSE", "LICENSE.txt", "LICENSE.md", "COPYING"]) {
      try {
        await copyFile(join(tmp, name), join(dest, "LICENSE"));
        break;
      } catch {}
    }
    return { project: project.name, copied, expected: paths.length };
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

const all = await projects();
const files = await fileList();
const wanted = only ? all.filter((p) => p.name === only) : all;
if (!wanted.length) {
  console.error(only ? `no such project: ${only}` : "manifest has no projects");
  process.exit(1);
}

const results = [];
const queue = [...wanted];
await Promise.all(
  Array.from({ length: Math.min(jobs, queue.length) }, async () => {
    for (let p = queue.shift(); p; p = queue.shift()) {
      try {
        const r = await fetchOne(p, files.get(p.name) ?? []);
        results.push(r);
        const short = r.copied === r.expected ? "" : `  SHORT ${r.copied}/${r.expected}`;
        console.log(`${r.project}  ${r.copied} file(s)${short}`);
      } catch (e) {
        results.push({ project: p.name, copied: 0, expected: (files.get(p.name) ?? []).length, error: e.message });
        console.error(`${p.name}  FAILED: ${e.message.split("\n")[0]}`);
      }
    }
  }),
);

const copied = results.reduce((n, r) => n + r.copied, 0);
const expected = results.reduce((n, r) => n + r.expected, 0);
const failed = results.filter((r) => r.error || r.copied !== r.expected);
console.log(`\n${copied} of ${expected} file(s) across ${results.length} project(s)`);
if (failed.length) {
  console.error(`${failed.length} project(s) incomplete — upstream may have rewritten history`);
  process.exit(1);
}
