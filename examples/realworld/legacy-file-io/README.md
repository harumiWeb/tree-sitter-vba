# legacy-file-io

`legacy-file-io` is an xlflow fixture project for classic VBA file and line-number syntax.

## Fixture focus

- `Open ... For Output As #`
- `Print #`
- `Open ... For Input As #`
- `Input #`
- `Line Input #`
- `Close #`
- `Erase`
- numeric line labels with `Erl`

## How to run

1. In this folder, run `xlflow session start --json`.
2. Run `xlflow push --fast --session --no-save --json`.
3. Run `xlflow lint --json`.
4. Run `xlflow test --module TestLegacyFileIo --session --json`.
5. Run `xlflow run --headless --session --json`.

The default entry point writes the parsed file summaries into the first worksheet.

## Files

- `src/modules/LegacyFileIo.bas`
  Contains the file I/O and numbered error-handling fixture code.
- `src/modules/App.bas`
  Writes runtime results into the workbook.
- `src/modules/Tests/TestLegacyFileIo.bas`
  Smoke tests for the file I/O helpers.
