# Minimal browser consumer

This example is the repository's external-consumer fixture. It loads the
standalone `tree-sitter-vba.wasm` release artifact with the supported
`web-tree-sitter@0.26.9` runtime, parses VBA entirely in the browser, displays
the concrete syntax tree, and counts `ERROR` and `MISSING` recovery nodes.

The normative contract is [docs/specs/wasm-artifact.md](../../docs/specs/wasm-artifact.md).
The fixture's local build creates equivalent static assets for testing; an
external project downloads the grammar Wasm from the GitHub Release and does
not compile the grammar or use this repository's generated-file layout.

## Build and run this example

From the repository root:

```text
pnpm test:browser-consumer
python -m http.server 8080 --directory build/browser-consumer
```

Open <http://localhost:8080/>. A static HTTP server is required because the
browser fetches the JavaScript and WebAssembly assets; opening `index.html`
directly with `file://` is not supported.

The generated directory is self-contained:

```text
build/browser-consumer/
├── app.js
├── index.html
├── recovery.mjs
├── tree-sitter-vba.wasm
└── vendor/
    ├── web-tree-sitter.js
    └── web-tree-sitter.wasm
```

## Use from another web project

Install the exact runtime version required by the artifact contract:

```text
npm install web-tree-sitter@0.26.9
```

Download the grammar artifact for the desired `tree-sitter-vba` release and
serve it from the same web application:

```text
https://github.com/harumiWeb/tree-sitter-vba/releases/download/v<version>/tree-sitter-vba.wasm
```

The minimal loading flow is:

```js
import { Language, Parser } from "web-tree-sitter";

await Parser.init({ locateFile: () => "/assets/web-tree-sitter.wasm" });
const language = await Language.load("/assets/tree-sitter-vba.wasm");
const parser = new Parser();
parser.setLanguage(language);

const tree = parser.parse("Sub Example()\nEnd Sub\n");
try {
  if (!tree) throw new Error("Parser did not return a syntax tree");
  console.log(tree.rootNode.toString());
} finally {
  tree?.delete();
  parser.delete();
}
```

The public release asset is the only grammar-specific file a downstream
project needs to obtain from this repository. The `web-tree-sitter` runtime
Wasm file is supplied by the matching npm package and should be copied or
served according to the consuming application's bundler. The consumer must
serve both Wasm files over HTTP and release each parsed `Tree` and `Parser`.
