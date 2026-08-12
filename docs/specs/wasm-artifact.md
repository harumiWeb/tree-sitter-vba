# WebAssembly Parser Artifact

## Build contract

The standalone browser parser is generated with the pinned Tree-sitter CLI and
the generated parser sources:

```text
pnpm install --frozen-lockfile
pnpm build:wasm
```

The command generates `src/**` with ABI 15 and writes the browser-compatible
parser to:

```text
build/wasm/tree-sitter-vba.wasm
```

The `build/` directory and Wasm files are generated artifacts. They are not
tracked in Git or included in the npm package. The build copies generated
parser sources to a temporary directory so native source files are not held
open by the Wasm linker on Windows.

## Release distribution

Every `v*` tag must match the version in `package.json`. The release workflow
builds and tests the artifact, then attaches these files to the matching GitHub
Release:

```text
tree-sitter-vba.wasm
tree-sitter-vba.wasm.sha256
```

If the Release does not exist, the workflow creates it with generated notes.
The checksum file verifies the exact bytes distributed for that release.
The direct download URL is:

```text
https://github.com/harumiWeb/tree-sitter-vba/releases/download/v<version>/tree-sitter-vba.wasm
```

## Consumer loading

Consumers use the matching `web-tree-sitter` runtime (`0.26.9` for the current
artifact) to load the release asset:

```js
import { Language, Parser } from "web-tree-sitter";

await Parser.init();
const language = await Language.load("./tree-sitter-vba.wasm");
const parser = new Parser();
parser.setLanguage(language);

const tree = parser.parse("Sub Hello()\nEnd Sub\n");
console.log(tree.rootNode.toString());

tree.delete();
parser.delete();
```

The repository also provides a self-contained minimal consumer fixture in
[`examples/browser-consumer`](../../examples/browser-consumer/README.md). Its
build output places the grammar Wasm and the matching `web-tree-sitter` runtime
under one static directory so it can be served by any ordinary HTTP server.
The fixture reports the syntax tree and counts `ERROR` and `MISSING` nodes; it
does not add semantic analysis.

The artifact is a syntax parser only. It does not add semantic analysis,
syntax highlighting, or browser UI behavior.

## Native and browser parser parity

The standalone Wasm parser is expected to preserve the native parser's behavior.
Representative parity fixtures cover clean parses, nested control flow,
multiline statements, procedure declarations, class and document modules,
UserForm source, conditional compilation, and known recovery cases.

Run the parity suite with:

```text
pnpm test:parity
```

The suite parses each fixture through both the native Node binding and
`web-tree-sitter`, then compares the root node type, `ERROR` / `MISSING`
counts, and a normalized CST containing node types, named status, missing
status, field names, and child order. Source positions are intentionally
excluded from the normalized CST. The normalizer also canonicalizes the native
runtime's `undefined` and the Wasm runtime's `null` representation for an
unassigned field; this is an API representation difference, not a parser
behavior difference.

There are currently no intentional parser-level platform-specific differences.
Any future exception must document the affected fixture, the exact difference,
the reason it is accepted, and the narrow comparison scope before it is added
to the suite.
