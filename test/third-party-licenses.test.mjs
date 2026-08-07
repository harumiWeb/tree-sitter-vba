import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import {
  checkThirdPartyFixtureMetadata,
  parseInventoryEntries,
  validateThirdPartyFixtureMetadata,
} from "../scripts/check-third-party-licenses.mjs";

function createFixture({
  inventory = ["project-one"],
  licenseName = "LICENSE",
  source = `# Source

- Project: Project One
- Repository: https://example.com/project-one
- License: MIT
- Imported for parser fixture coverage.
- Modifications:
  - None
`,
} = {}) {
  const root = mkdtempSync(join(tmpdir(), "tree-sitter-vba-third-party-"));
  const thirdPartyDir = join(root, "examples", "third_party");
  mkdirSync(thirdPartyDir, { recursive: true });
  for (const project of inventory) {
    const projectDir = join(thirdPartyDir, project);
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(join(projectDir, licenseName), "MIT License\n");
    writeFileSync(join(projectDir, "SOURCE.md"), source);
  }
  writeFileSync(
    join(root, "THIRD_PARTY_LICENSE.md"),
    [
      "# Third-party fixture licenses",
      "",
      ...inventory.map((project) => `| \`${project}\` | Project | MIT | Acknowledgement | records |`),
      "",
    ].join("\n"),
  );
  return { root, thirdPartyDir, licenseDocument: join(root, "THIRD_PARTY_LICENSE.md") };
}

function withFixture(options, callback) {
  const fixture = createFixture(options);
  try {
    return callback(fixture);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
}

test("parseInventoryEntries extracts only code-formatted project rows", () => {
  assert.deepEqual(
    parseInventoryEntries([
      "| Directory | Project |",
      "| --- | --- |",
      "| `project-one` | Example |",
      "| `project-two` | Example |",
    ].join("\n")),
    ["project-one", "project-two"],
  );
});

test("validates a project with LICENSE and standard SOURCE.md metadata", () => {
  withFixture({}, ({ root }) => {
    assert.equal(checkThirdPartyFixtureMetadata({ root }), true);
    assert.deepEqual(validateThirdPartyFixtureMetadata({
      thirdPartyDir: join(root, "examples", "third_party"),
      licenseDocument: join(root, "THIRD_PARTY_LICENSE.md"),
    }), []);
  });
});

test("accepts LICENSE.txt as a license file", () => {
  withFixture({ licenseName: "LICENSE.txt" }, ({ root }) => {
    assert.equal(checkThirdPartyFixtureMetadata({ root }), true);
  });
});

test("reports missing, unexpected, and duplicate inventory entries", () => {
  withFixture({ inventory: ["project-one"] }, ({ root, licenseDocument }) => {
    writeFileSync(
      licenseDocument,
      "| `project-one` | Project |\n| `project-one` | Duplicate |\n| `project-two` | Stale |\n",
    );
    const errors = validateThirdPartyFixtureMetadata({
      thirdPartyDir: join(root, "examples", "third_party"),
      licenseDocument,
    });
    assert.ok(errors.some((error) => error.includes("Projects listed but not found")));
    assert.ok(errors.some((error) => error.includes("Duplicate project entries")));
  });
});

test("reports a project missing from the inventory", () => {
  withFixture({}, ({ root, licenseDocument }) => {
    writeFileSync(licenseDocument, "# Third-party fixture licenses\n");
    const errors = validateThirdPartyFixtureMetadata({
      thirdPartyDir: join(root, "examples", "third_party"),
      licenseDocument,
    });
    assert.ok(errors.some((error) => error.includes("Projects missing from THIRD_PARTY_LICENSE.md")));
  });
});

test("reports missing license and SOURCE.md files", () => {
  withFixture({}, ({ root, thirdPartyDir }) => {
    const projectDir = join(thirdPartyDir, "project-one");
    rmSync(join(projectDir, "LICENSE"));
    rmSync(join(projectDir, "SOURCE.md"));
    const errors = validateThirdPartyFixtureMetadata({
      thirdPartyDir,
      licenseDocument: join(root, "THIRD_PARTY_LICENSE.md"),
    });
    assert.ok(errors.some((error) => error.includes("missing LICENSE")));
    assert.ok(errors.some((error) => error.includes("missing SOURCE.md")));
  });
});

test("reports missing SOURCE.md metadata", () => {
  withFixture({ source: "# Source\n\n- Project: Project One\n" }, ({ root }) => {
    const errors = validateThirdPartyFixtureMetadata({
      thirdPartyDir: join(root, "examples", "third_party"),
      licenseDocument: join(root, "THIRD_PARTY_LICENSE.md"),
    });
    assert.ok(errors.some((error) => error.includes("Repository")));
    assert.ok(errors.some((error) => error.includes("License")));
    assert.ok(errors.some((error) => error.includes("fixture coverage statement")));
    assert.ok(errors.some((error) => error.includes("Modifications")));
  });
});
