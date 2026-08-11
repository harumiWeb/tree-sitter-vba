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
https://github.com/harumiWeb/tree-sitter-vba/releases/download/<version>/tree-sitter-vba.wasm
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

The artifact is a syntax parser only. It does not add semantic analysis,
syntax highlighting, or browser UI behavior.
