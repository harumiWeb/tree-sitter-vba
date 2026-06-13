# tree-sitter-vba

Tree-sitter grammar for Visual Basic for Applications (VBA).

This project aims to provide a practical parsing foundation for editor integration, syntax highlighting, folding, symbol extraction, and future LSP support for exported VBA source files such as `.bas`, `.cls`, and `.frm`.

## Status

This project is in an early bootstrap phase.

The grammar is not production-ready yet. The initial goal is to parse common exported VBA modules well enough for:

- syntax highlighting
- procedure-level folding
- tags / outline extraction
- basic symbol extraction
- future integration with `xlflow-lsp`

The grammar currently focuses on a small subset of VBA:

- `Attribute` statements
- `Option` statements
- `Sub`
- `Function`
- `Property Get/Let/Set`
- basic `Dim`, `Static`, and `Const` declarations
- simple assignments
- simple calls
- comments
- string, number, and boolean literals

Unsupported or incomplete areas include:

- full expression precedence
- member access such as `ws.Range("A1").Value`
- `Debug.Print`
- `If`, `Select Case`, `For`, `Do`, `With`
- `Type` and `Enum`
- conditional compilation
- `Declare PtrSafe`
- exported `.frm` designer metadata
- semantic analysis
- type checking
- Excel Object Model resolution

## Development

Install dependencies:

```bash
pnpm install
```

Generate the parser:

```bash
pnpm generate
```

Run corpus tests:

```bash
pnpm test
```

Parse example files:

```bash
pnpm parse:examples
```

## Testing

Tree-sitter grammar behavior is tested with corpus files under:

```text
test/corpus/
```

Each corpus test contains a VBA snippet and the expected parse tree.

Example:

```txt
==================
public sub
==================

Public Sub Main()
End Sub

---

(source_file
  (sub_declaration
    (visibility)
    name: (identifier)
    (parameter_list)
    body: (block)))
```

When changing `grammar.js`, always add or update corpus tests.

Do not weaken existing corpus tests just to make a grammar change pass.

## Design Principles

This grammar handles syntax only.

It does not perform:

- type checking
- Excel Object Model completion
- COM Type Library indexing
- VBE compile diagnostics
- macro execution
- formatting
- LSP server behavior

Those belong in downstream tools such as `xlflow`, `xlflow-lsp`, or editor extensions.

## File Types

The intended file types are:

- `.bas`
- `.cls`
- `.frm`

Support for `.frm` designer metadata is planned but not complete yet.

---

## 追加で入れるなら: `tree-sitter.json`

今回のリストにはありませんが、入れておくのを推奨します。

```json
{
  "grammars": [
    {
      "name": "vba",
      "camelcase": "Vba",
      "scope": "source.vba",
      "path": ".",
      "file-types": ["bas", "cls", "frm"],
      "injection-regex": "^vba$"
    }
  ],
  "metadata": {
    "version": "0.1.0",
    "license": "MIT",
    "description": "Tree-sitter grammar for Visual Basic for Applications",
    "authors": [
      {
        "name": "harumiWeb"
      }
    ],
    "links": {
      "repository": "https://github.com/harumiWeb/tree-sitter-vba"
    }
  },
  "bindings": {
    "c": true,
    "node": true,
    "rust": false,
    "go": false,
    "python": false,
    "swift": false,
    "zig": false
  }
}
```

## Background

This project is a tree-sitter for VBA developed for the Excel VBA development tool xlflow (https://github.com/harumiWeb/xlflow). The goal is to provide a robust and accurate parser for VBA code that can be used for syntax highlighting, code analysis, and other editor features in xlflow and potentially other tools.

## Status

This project is in an early bootstrap phase.

The grammar is not production-ready yet. The initial goal is to parse common exported `.bas`, `.cls`, and `.frm` files for syntax highlighting, folding, and symbol extraction.

## Roadmap

### Milestone 1: Basic module parsing

- Attributes
- Options
- Procedures
- Declarations
- Basic control flow
- Comments and strings

### Milestone 2: Practical VBA parsing

- Calls
- Assignments
- Member access
- Line continuations
- Colon-separated statements
- Type and Enum blocks
- Property Get/Let/Set

### Milestone 3: Excel VBA compatibility

- `.frm` UserForm exports
- Conditional compilation
- Declare PtrSafe
- WithEvents
- Event procedures
- Common Excel VBA idioms

### Milestone 4: Editor integration

- highlights.scm
- folds.scm
- tags.scm
- locals.scm
- VSCode integration
- Neovim/Helix/Zed compatibility where possible

### Milestone 5: Downstream xlflow integration

- Symbol extraction
- LSP frontend
- xlflow lint improvements
- xlflow fmt support
- Workbook/UserForm-aware completion via xlflow
