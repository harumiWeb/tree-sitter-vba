# Browser WebAssembly Artifact Contract

This document defines the supported browser consumption contract for
`tree-sitter-vba`. It is the public interface for browser consumers; consumers
must not depend on generated-file layout or other repository internals.

## Supported artifact

| Contract item    | Supported value                                                    |
| ---------------- | ------------------------------------------------------------------ |
| Grammar artifact | `tree-sitter-vba.wasm`                                             |
| Grammar version  | The `tree-sitter-vba` release tag, `v<version>`                    |
| Generator        | `tree-sitter-cli@0.26.9` through `pnpm build:wasm`                 |
| Parser ABI       | Tree-sitter ABI 15                                                 |
| Browser runtime  | `web-tree-sitter@0.26.9`                                           |
| Runtime Wasm     | `web-tree-sitter.wasm` from the matching `web-tree-sitter` package |

The CLI and browser runtime versions above are exact pins for the current
artifact contract. If either toolchain version changes, the contract and its
release validation must be updated together.

The grammar artifact is a syntax parser only. It does not provide semantic
analysis, syntax highlighting, queries, or browser UI behavior.

## Generation contract

Maintainers can reproduce the artifact from a checkout with the locked
toolchain:

```text
pnpm install --frozen-lockfile
pnpm build:wasm
```

`pnpm build:wasm` runs `pnpm generate` with ABI 15 and writes the generated
artifact to:

```text
build/wasm/tree-sitter-vba.wasm
```

The `build/` directory, generated parser sources, and Wasm files are not
tracked in Git. The standalone browser artifact is not included in the npm
package. The build uses a temporary copy of generated parser sources so the
Wasm linker does not hold the repository's generated files open on Windows.

Downstream consumers do not need to run `tree-sitter generate`, invoke the
Wasm linker, or compile the grammar. They download the published artifact and
load it with the supported browser runtime. Local generation is only required
when developing or intentionally rebuilding the grammar.

## Release and versioning contract

The browser artifact is published as a GitHub Release asset. A release tag
must exactly match the version in `package.json`:

```text
tree-sitter-vba version 0.12.1 -> tag v0.12.1
```

Each matching release contains:

```text
tree-sitter-vba.wasm
tree-sitter-vba.wasm.sha256
```

The checksum verifies the exact bytes distributed for that release. The
canonical download URL is:

```text
https://github.com/harumiWeb/tree-sitter-vba/releases/download/v<version>/tree-sitter-vba.wasm
```

The artifact has no independent version. `v<version>` is both the
`tree-sitter-vba` release version and the version of the grammar Wasm asset.
A changed grammar, generator, or browser-runtime compatibility contract must
be released under a new `tree-sitter-vba` version rather than replacing an
artifact under another version's URL.

The release workflow is the canonical distribution path. It checks out the
version tag, installs the frozen dependencies, validates the tag against
`package.json`, builds and loads the artifact, creates its checksum, and
uploads both files to the matching GitHub Release.

## Consumer loading contract

A downstream web project should pin the supported runtime, copy or serve its
runtime Wasm file, download the grammar asset for the desired release, and
load both assets from its own static asset URLs:

```text
npm install web-tree-sitter@0.26.9
```

The runtime Wasm file belongs to the `web-tree-sitter` package. The grammar
Wasm file belongs to the `tree-sitter-vba` GitHub Release. A bundler may place
the files at different URLs, but it must provide those URLs to the loader:

```js
import { Language, Parser } from "web-tree-sitter";

const runtimeWasm = new URL("./assets/web-tree-sitter.wasm", import.meta.url);
const grammarWasm = new URL("./assets/tree-sitter-vba.wasm", import.meta.url);

await Parser.init({ locateFile: () => runtimeWasm.href });
const language = await Language.load(grammarWasm.href);
const parser = new Parser();
parser.setLanguage(language);

const tree = parser.parse("Sub Hello()\nEnd Sub\n");
try {
  if (!tree) throw new Error("Parser did not return a syntax tree");
  console.log(tree.rootNode.toString());
} finally {
  tree?.delete();
  parser.delete();
}
```

`Parser.init` must run before `Language.load`. Applications should release
every returned `Tree` and the `Parser` when they are no longer needed. A
static HTTP server is required; opening the page with `file://` is not a
supported loading environment.

The repository's [minimal browser consumer](../../examples/browser-consumer/README.md)
is a self-contained integration fixture. Its local build creates a static
directory with the same two runtime assets and the grammar asset, and its
Node and Chromium tests verify that the bundle does not depend on
`src/`, `build/wasm/`, `node_modules/`, or the playground source tree.

## Native and browser parser parity

The standalone Wasm parser is expected to preserve the native parser's
behavior. Representative parity fixtures cover clean parses, nested control
flow, multiline statements, procedure declarations, class and document
modules, UserForm source, conditional compilation, and known recovery cases.

Run the parity suite with:

```text
pnpm test:parity
```

The suite parses each fixture through both the native Node binding and
`web-tree-sitter`, then compares the root node type, `ERROR` / `MISSING`
counts, and a normalized CST containing node types, named status, missing
status, field names, and child order. Source positions are intentionally
excluded from the normalized CST. The normalizer also canonicalizes the
native runtime's `undefined` and the Wasm runtime's `null` representation for
an unassigned field; this is an API representation difference, not a parser
behavior difference.

There are currently no intentional parser-level platform-specific
differences. Any future exception must document the affected fixture, the
exact difference, the reason it is accepted, and the narrow comparison scope
before it is added to the suite.
