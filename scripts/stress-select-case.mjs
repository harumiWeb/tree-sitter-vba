import { performance } from "node:perf_hooks";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Parser = require("tree-sitter");
const VBA = require("../");

const clauseCounts = [10, 50, 100, 500];

const parser = new Parser();
parser.setLanguage(VBA);

function buildSelectCase(clauseCount) {
  const clauses = Array.from(
    { length: clauseCount },
    (_, index) => `        Case ${index + 1}\n            result = ${index + 1}`,
  );

  return [
    "Sub StressSelectCase()",
    "    Dim result As Long",
    "    Select Case selector",
    ...clauses,
    "        Case Else",
    "            result = 0",
    "    End Select",
    "End Sub",
    "",
  ].join("\n");
}

function inspectTree(rootNode) {
  const counts = {
    errors: 0,
    missing: 0,
    selectStatements: 0,
    caseClauses: 0,
  };
  const nodes = [rootNode];

  while (nodes.length > 0) {
    const node = nodes.pop();

    if (node.type === "ERROR") {
      counts.errors += 1;
    }
    if (node.type === "MISSING" || node.isMissing) {
      counts.missing += 1;
    }
    if (node.type === "select_statement") {
      counts.selectStatements += 1;
    }
    if (node.type === "case_clause") {
      counts.caseClauses += 1;
    }

    for (let index = 0; index < node.childCount; index += 1) {
      nodes.push(node.child(index));
    }
  }

  return counts;
}

const failures = [];

for (const clauseCount of clauseCounts) {
  const source = buildSelectCase(clauseCount);
  const startedAt = performance.now();
  const tree = parser.parse(source);
  const elapsed = performance.now() - startedAt;
  const counts = inspectTree(tree.rootNode);
  const issues = [];

  if (tree.rootNode.hasError) {
    issues.push("root node reports recovery");
  }
  if (counts.errors > 0) {
    issues.push(`ERROR nodes: ${counts.errors}`);
  }
  if (counts.missing > 0) {
    issues.push(`MISSING nodes: ${counts.missing}`);
  }
  if (counts.selectStatements !== 1) {
    issues.push(`select_statement nodes: expected 1, received ${counts.selectStatements}`);
  }
  if (counts.caseClauses !== clauseCount + 1) {
    issues.push(`case_clause nodes: expected ${clauseCount + 1}, received ${counts.caseClauses}`);
  }

  const summary = `${clauseCount} clauses: ${elapsed.toFixed(2)} ms, ${counts.caseClauses} case_clause nodes`;
  if (issues.length > 0) {
    failures.push(`${summary}; ${issues.join("; ")}`);
  } else {
    console.log(`ok ${summary}`);
  }
}

if (failures.length > 0) {
  console.error("Select Case stress coverage failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
}
