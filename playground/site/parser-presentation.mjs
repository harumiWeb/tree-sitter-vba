import { createSourcePositionIndex } from "./source-positions.mjs";

const capturePriorities = new Map([
  ["function.method.call", 100],
  ["function.call", 95],
  ["function", 90],
  ["variable.parameter", 85],
  ["property", 80],
  ["type", 75],
  ["constant.builtin", 70],
  ["constant", 65],
  ["string", 60],
  ["comment", 55],
  ["keyword", 50],
]);

function recoveryKind(node) {
  if (node.type === "ERROR") return "ERROR";
  if (node.type === "MISSING" || node.isMissing) return "MISSING";
  return null;
}

export function captureClassName(name) {
  return `ts-${name.replaceAll(".", "-")}`;
}

function positionsFor(sourceOrPositions) {
  return typeof sourceOrPositions === "string"
    ? createSourcePositionIndex(sourceOrPositions)
    : sourceOrPositions;
}

export function buildHighlightRanges(query, rootNode, sourceOrPositions) {
  const positions = positionsFor(sourceOrPositions);
  const rangesBySpan = new Map();

  for (const capture of query.captures(rootNode)) {
    const from = positions.byteOffsetToCodeUnitIndex(capture.node.startIndex);
    const to = positions.byteOffsetToCodeUnitIndex(capture.node.endIndex);
    if (from >= to) continue;

    const range = {
      from,
      to,
      capture: capture.name,
      className: captureClassName(capture.name),
      priority: capturePriorities.get(capture.name) ?? 0,
    };
    const key = `${from}:${to}`;
    const previous = rangesBySpan.get(key);
    if (!previous || range.priority > previous.priority) {
      rangesBySpan.set(key, range);
    }
  }

  return [...rangesBySpan.values()].sort(
    (left, right) => left.from - right.from || right.to - left.to || right.priority - left.priority,
  );
}

export function buildTreeModel(rootNode, sourceOrPositions) {
  const positions = positionsFor(sourceOrPositions);
  let nextKey = 0;

  function visit(node, fieldName, depth) {
    const start = positions.textPositionFromByteOffset(node.startIndex);
    const end = positions.textPositionFromByteOffset(node.endIndex);
    const model = {
      key: String(nextKey++),
      type: node.type,
      fieldName,
      depth,
      startIndex: start.index,
      endIndex: end.index,
      start,
      end,
      recovery: recoveryKind(node),
      children: [],
    };

    for (let index = 0; index < node.childCount; index += 1) {
      model.children.push(visit(node.child(index), node.fieldNameForChild(index), depth + 1));
    }
    return model;
  }

  return visit(rootNode, null, 0);
}

export function collectRecoveryNodes(node) {
  const recovery = [];
  const nodes = [node];

  while (nodes.length > 0) {
    const current = nodes.pop();
    if (current.recovery) recovery.push(current);
    nodes.push(...current.children);
  }

  return recovery.sort(
    (left, right) => left.startIndex - right.startIndex || left.endIndex - right.endIndex,
  );
}

export function collectNodeKeys(node) {
  const keys = [];
  const nodes = [node];

  while (nodes.length > 0) {
    const current = nodes.pop();
    keys.push(current.key);
    nodes.push(...current.children);
  }
  return keys;
}

export function initialExpandedNodeKeys(node) {
  return new Set([node.key, ...node.children.map((child) => child.key)]);
}

export function findSmallestContainingNode(node, from, to = from) {
  if (from < node.startIndex || to > node.endIndex) return null;

  if (from === to) {
    const missingNode = findMissingNodeAtPosition(node, from);
    if (missingNode) return missingNode;
  }

  return findSmallestContainingNonMissingNode(node, from, to);
}

function findSmallestContainingNonMissingNode(node, from, to) {
  for (const child of node.children) {
    if (from < child.startIndex || to > child.endIndex) continue;
    const match = findSmallestContainingNonMissingNode(child, from, to);
    if (match) return match;
  }
  return node;
}

function findMissingNodeAtPosition(node, position) {
  if (node.recovery === "MISSING" && node.startIndex === position && node.endIndex === position) {
    return node;
  }
  for (const child of node.children) {
    const match = findMissingNodeAtPosition(child, position);
    if (match) return match;
  }
  return null;
}

function formatNode(node, indentation) {
  const prefix = " ".repeat(indentation);
  const field = node.fieldName ? `${node.fieldName}: ` : "";
  const opener = `${prefix}${field}(${node.type}`;
  if (node.children.length === 0) return `${opener})`;

  return [
    opener,
    ...node.children.map((child) => formatNode(child, indentation + 2)),
    `${prefix})`,
  ].join("\n");
}

export function formatSExpression(node) {
  return formatNode(node, 0);
}

export function formatTreeText(node, prefix = "", isLast = true, isRoot = true) {
  const field = node.fieldName ? `${node.fieldName}: ` : "";
  const connector = isRoot ? "" : isLast ? "└─ " : "├─ ";
  const lines = [`${prefix}${connector}${field}${node.type}`];
  const childPrefix = isRoot ? "" : `${prefix}${isLast ? "   " : "│  "}`;

  node.children.forEach((child, index) => {
    lines.push(...formatTreeText(child, childPrefix, index === node.children.length - 1, false));
  });
  return lines;
}
