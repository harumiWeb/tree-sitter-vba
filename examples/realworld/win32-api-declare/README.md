# win32-api-declare

`win32-api-declare` is an xlflow fixture project for practical Windows API VBA syntax.

## Fixture focus

- `#If VBA7 Then` / `#Else` conditional compilation
- `Declare PtrSafe Function`
- `Alias`
- multi-line declare parameter lists
- Win32-style string buffer calls

## How to run

1. In this folder, run `xlflow session start --json`.
2. Run `xlflow push --fast --session --no-save --json`.
3. Run `xlflow lint --json`.
4. Run `xlflow test --module TestWin32Api --session --json`.
5. Run `xlflow run --headless --session --json`.

The default entry point writes a small diagnostics table to the first worksheet.

## Files

- `src/modules/Win32Api.bas`
  Contains the declare statements and small wrappers used by the fixture.
- `src/modules/App.bas`
  Writes the runtime results into the workbook.
- `src/modules/Tests/TestWin32Api.bas`
  Smoke tests for compile and basic runtime behavior.
