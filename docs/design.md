# DESIGN.md

This repository implements `tree-sitter-vba`, a Tree-sitter grammar for Visual Basic for Applications (VBA), including Excel VBA source files exported as `.bas`, `.cls`, and `.frm`.

The goal is to provide a robust parsing foundation for editor integration, syntax highlighting, folding, symbol extraction, and future LSP support. This grammar is not responsible for type checking, Excel object model resolution, COM reference resolution, or VBE-compatible compilation.

## Project Goals

Build a practical Tree-sitter grammar for VBA that can parse real-world exported VBA modules.

Primary targets:

- Standard modules: `.bas`
- Class modules: `.cls`
- UserForm modules: `.frm`
- Attribute lines emitted by VBE exports
- Common Excel VBA coding patterns

The grammar should support editor-facing use cases:

- Syntax highlighting
- Folding
- Tags / outline extraction
- Local symbol extraction
- Robust parsing of incomplete code
- Future use by `xlflow-lsp`

## Non-Goals

Do not implement these in this repository:

- VBA type checking
- Excel Object Model completion
- COM Type Library indexing
- VBE compile diagnostics
- Formatter behavior
- Full semantic analysis
- Runtime evaluation
- Macro execution
- xlflow bridge integration

Those belong in downstream projects such as `xlflow`, `xlflow-lsp`, or VSCode extensions.

## Development Principles

### 1. Test-driven grammar changes

Every grammar change must include or update Tree-sitter corpus tests.

Do not modify `grammar.js` without adding or updating a relevant file under:

```text
test/corpus/
```

Use small, focused test cases. Prefer many small tests over one large test.

### 2. Preserve existing behavior

Before changing grammar rules, run:

```bash
npm test
```

After changes, run:

```bash
npm test
```

Do not accept regressions unless the previous parse tree was clearly wrong and the corpus expectation is updated intentionally.

### 3. Prefer practical VBA coverage over theoretical completeness

This grammar should parse real exported VBA code reliably.

Prioritize:

- `Attribute VB_Name = "..."`
- `Option Explicit`
- `Sub`, `Function`, `Property Get/Let/Set`
- `Dim`, `Private`, `Public`, `Static`, `Const`
- `Type`, `Enum`
- `If`, `Select Case`, `For`, `For Each`, `Do`, `While`, `With`
- `On Error`
- `Declare PtrSafe`
- Comments
- Strings
- Line continuation with `_`
- Colon-separated statements
- Conditional compilation with `#If`, `#Else`, `#End If`

### 4. Keep syntax and semantics separate

The grammar should parse syntax only.

Do not try to determine whether:

- `Range` is an Excel object
- `Worksheet` is a valid type
- A member exists on an object
- A procedure call is valid
- A variable is declared
- A reference is missing

Those are semantic concerns.

### 5. Be tolerant of incomplete code

This grammar is intended for editor usage. It must handle partially written code as well as possible.

Prefer grammar structures that allow partial parse trees instead of failing completely.

Examples of incomplete code that should not catastrophically break parsing:

```vb
Sub Foo()
    Dim x As
End Sub
```

```vb
If x Then
```

```vb
Set ws =
```

### 6. Do not overfit to one corpus case

When fixing a parse failure, avoid creating a narrow rule that only works for the specific test.

Add neighboring tests when the construct is ambiguous.

For example, when changing call-expression parsing, test all of these:

```vb
Foo 1, 2
Call Foo(1, 2)
x = Foo(1, 2)
Foo (x)
Debug.Print x
```

### 7. Keep parse tree names stable

Node names are part of the downstream API.

Avoid renaming established nodes unless necessary.

Prefer clear snake_case node names, for example:

```text
sub_declaration
function_declaration
property_get_declaration
property_let_declaration
property_set_declaration
variable_declaration
const_declaration
type_declaration
enum_declaration
if_statement
select_statement
for_statement
with_statement
call_statement
assignment_statement
member_expression
qualified_member_expression
implicit_member_expression
argument_list
```

`member_expression` is a hidden supertype for member access. Concrete syntax
trees expose `qualified_member_expression` for member access with an object
child, such as `obj.Property` and `obj!Field`, and `implicit_member_expression`
for leading-dot or leading-bang access, such as `.Property` and `!Field`.

Declaration node shapes should expose syntactic metadata structurally for
downstream symbol indexers, linters, formatters, and LSP-style tools. Prefer
dedicated declaration nodes such as `property_get_declaration`,
`property_let_declaration`, `property_set_declaration`,
`declare_sub_statement`, and `declare_function_statement` over requiring
consumers to inspect raw signature text. Use stable fields such as `visibility`,
`name`, `parameters`, `type`, `initializer`, `passing_mode`, and
`default_value` where the syntax provides those values.

### 8. Keep queries in sync

When adding new grammar nodes, update queries when appropriate:

```text
queries/highlights.scm
queries/folds.scm
queries/tags.scm
queries/locals.scm
```

At minimum, new declarations should be reflected in highlights and tags.

### 9. Do not implement a formatter here

Do not add formatting logic to this repository.

The grammar may preserve enough structure for a formatter later, but formatting belongs in a separate layer.

### 10. Document unsupported syntax

If a VBA construct is intentionally unsupported or only partially supported, document it in `README.md`.

Do not silently ignore important limitations.

## Required Commands

Use these commands during development:

```bash
npm install
npm test
npx tree-sitter generate
npx tree-sitter test
npx tree-sitter parse examples/basic.bas
```

A task is not complete until `npm test` passes.

## Suggested Corpus Layout

Use these files for focused tests:

```text
test/corpus/attributes.txt
test/corpus/options.txt
test/corpus/declarations.txt
test/corpus/procedures.txt
test/corpus/properties.txt
test/corpus/types_enums.txt
test/corpus/control_flow.txt
test/corpus/loops.txt
test/corpus/expressions.txt
test/corpus/calls.txt
test/corpus/comments.txt
test/corpus/line_continuation.txt
test/corpus/colon_statements.txt
test/corpus/preprocessor.txt
test/corpus/forms.txt
```

## Initial Milestone

The first milestone is not full VBA support.

The first milestone is:

- Parse basic `.bas`, `.cls`, and `.frm` files
- Recognize top-level declarations
- Recognize procedures
- Recognize common control-flow blocks
- Support comments, strings, attributes, and line continuations
- Provide usable highlighting and folding queries
- Pass all corpus tests

## Implementation Guidance

Start with broad but stable grammar rules.

Recommended implementation order:

1. Comments, strings, identifiers, numbers
2. Source file structure
3. Attribute lines
4. Option statements
5. Procedure declarations
6. Variable and constant declarations
7. Type and Enum declarations
8. Basic statements
9. Control-flow blocks
10. Expressions
11. Calls and member access
12. Preprocessor directives
13. Query files

Avoid starting with expression parsing. VBA expression and call syntax is ambiguous and should be added after the module/procedure structure is stable.

## Ambiguous VBA Constructs

Be careful with these constructs:

```vb
Foo 1, 2
Call Foo(1, 2)
x = Foo(1, 2)
Foo (x)
```

```vb
If x Then y = 1 Else y = 2
```

```vb
Dim x As Long: x = 1
```

```vb
Debug.Print _
    "hello"
```

```vb
#If VBA7 Then
    Private Declare PtrSafe Function Foo Lib "kernel32" () As Long
#Else
    Private Declare Function Foo Lib "kernel32" () As Long
#End If
```

Do not assume these are trivial. Add tests before changing related grammar.

## Review Checklist

Before finishing a task, confirm:

- `npm test` passes
- New grammar behavior has corpus coverage
- Existing corpus tests were not weakened unnecessarily
- Query files were updated if new nodes were added
- README limitations were updated if applicable
- No semantic analysis was added to the grammar
