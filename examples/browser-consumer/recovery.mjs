export function countRecoveryNodes(node) {
  let errorCount = 0;
  let missingCount = 0;

  function visit(current) {
    if (current.type === "ERROR") errorCount += 1;
    if (current.isMissing) missingCount += 1;

    for (const child of current.children) visit(child);
  }

  visit(node);
  return { errorCount, missingCount };
}
