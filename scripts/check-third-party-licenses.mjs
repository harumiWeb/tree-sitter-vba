import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = resolve(dirname(scriptPath), "..");

export const sourceMetadataRequirements = [
  {
    label: "Project",
    pattern: /^-\s+Project:\s+\S.*$/im,
  },
  {
    label: "Repository",
    pattern: /^-\s+Repository:\s+https?:\/\/\S+$/im,
  },
  {
    label: "License",
    pattern: /^-\s+License:\s+\S.*$/im,
  },
  {
    label: "fixture coverage statement",
    pattern: /Imported for parser fixture coverage\./i,
  },
  {
    label: "Modifications",
    pattern: /^-\s+Modifications:\s*$/im,
  },
];

export function discoverThirdPartyProjects(thirdPartyDir) {
  return readdirSync(thirdPartyDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();
}

export function parseInventoryEntries(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => /^\|\s*`([^`]+)`\s*\|/.exec(line)?.[1])
    .filter(Boolean);
}

function formatNames(names) {
  return names.length > 0 ? names.join(", ") : "(none)";
}

function findMissing(expected, actual) {
  const actualSet = new Set(actual);
  return expected.filter((name) => !actualSet.has(name));
}

function findUnexpected(expected, actual) {
  const expectedSet = new Set(expected);
  return actual.filter((name) => !expectedSet.has(name));
}

export function validateThirdPartyFixtureMetadata({
  thirdPartyDir,
  licenseDocument,
}) {
  const errors = [];

  if (!existsSync(licenseDocument)) {
    errors.push(`Missing third-party license inventory: ${licenseDocument}`);
  }

  const projects = discoverThirdPartyProjects(thirdPartyDir);
  let inventoryEntries = [];

  if (existsSync(licenseDocument)) {
    inventoryEntries = parseInventoryEntries(readFileSync(licenseDocument, "utf8"));
  }

  const missingInventoryEntries = findMissing(projects, inventoryEntries);
  const unexpectedInventoryEntries = findUnexpected(projects, inventoryEntries);
  const duplicateInventoryEntries = inventoryEntries.filter(
    (name, index) => inventoryEntries.indexOf(name) !== index,
  );

  if (missingInventoryEntries.length > 0) {
    errors.push(`Projects missing from THIRD_PARTY_LICENSE.md: ${formatNames(missingInventoryEntries)}`);
  }
  if (unexpectedInventoryEntries.length > 0) {
    errors.push(`Projects listed but not found under examples/third_party: ${formatNames(unexpectedInventoryEntries)}`);
  }
  if (duplicateInventoryEntries.length > 0) {
    errors.push(`Duplicate project entries in THIRD_PARTY_LICENSE.md: ${formatNames([...new Set(duplicateInventoryEntries)])}`);
  }

  for (const project of projects) {
    const projectDir = join(thirdPartyDir, project);
    const files = readdirSync(projectDir, { withFileTypes: true });
    const licenseFiles = files
      .filter((entry) => entry.isFile() && /^LICENSE(?:\..*)?$/i.test(entry.name))
      .map((entry) => entry.name);

    if (licenseFiles.length === 0) {
      errors.push(`${project}: missing LICENSE or LICENSE.* file at project root`);
    }

    const sourcePath = join(projectDir, "SOURCE.md");
    if (!existsSync(sourcePath)) {
      errors.push(`${project}: missing SOURCE.md at project root`);
      continue;
    }

    const source = readFileSync(sourcePath, "utf8");
    for (const requirement of sourceMetadataRequirements) {
      if (!requirement.pattern.test(source)) {
        errors.push(`${project}: SOURCE.md is missing ${requirement.label}`);
      }
    }

    if (!/^\s{2,}-\s+\S.*$/m.test(source.split(/^-\s+Modifications:\s*$/im)[1] ?? "")) {
      errors.push(`${project}: SOURCE.md Modifications must contain at least one bullet`);
    }
  }

  return errors;
}

export function checkThirdPartyFixtureMetadata({
  root = repositoryRoot,
} = {}) {
  const errors = validateThirdPartyFixtureMetadata({
    thirdPartyDir: join(root, "examples", "third_party"),
    licenseDocument: join(root, "THIRD_PARTY_LICENSE.md"),
  });

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`Third-party metadata error: ${error}`);
    }
    return false;
  }

  console.log(`Validated third-party metadata for ${discoverThirdPartyProjects(join(root, "examples", "third_party")).length} projects.`);
  return true;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(scriptPath);
if (isMain && !checkThirdPartyFixtureMetadata()) {
  process.exitCode = 1;
}
