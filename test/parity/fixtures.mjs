const cleanRecovery = { errorCount: 0, missingCount: 0 };

function corpus(path, caseName, category, expectedRecovery = cleanRecovery) {
  return {
    id: `${path}#${caseName}`,
    kind: "corpus",
    path,
    caseName,
    category,
    expectedRootType: "source_file",
    expectedRecovery,
  };
}

function example(path, category, expectedRecovery = cleanRecovery) {
  return {
    id: path,
    kind: "example",
    path,
    category,
    expectedRootType: "source_file",
    expectedRecovery,
  };
}

export const parityFixtures = [
  corpus("test/corpus/nested_control_flow.txt", "nested if for exit", "nested control flow"),
  corpus(
    "test/corpus/inline_control_equivalence.txt",
    "nested inline controls keep ownership",
    "nested control flow",
  ),
  corpus(
    "test/corpus/line_continuation.txt",
    "line continuation with trailing whitespace",
    "multiline statements",
  ),
  corpus("test/corpus/procedures.txt", "public sub", "procedure declarations"),
  corpus(
    "test/corpus/procedures.txt",
    "private function with parameters",
    "procedure declarations",
  ),
  corpus("test/corpus/procedures.txt", "property get", "procedure declarations"),
  corpus("test/corpus/procedures.txt", "property let", "procedure declarations"),
  corpus("test/corpus/procedures.txt", "property set", "procedure declarations"),
  corpus(
    "test/corpus/conditional_procedure_headers.txt",
    "conditional function header with branch-local declarations",
    "conditional compilation",
  ),
  corpus(
    "test/corpus/conditional_procedure_headers.txt",
    "conditional sub header",
    "conditional compilation",
  ),
  corpus(
    "test/corpus/conditional_procedure_headers.txt",
    "conditional property header",
    "conditional compilation",
  ),
  corpus("test/corpus/preprocessor.txt", "preprocessor if declare", "conditional compilation"),
  corpus(
    "test/corpus/preprocessor.txt",
    "preprocessor statements in procedure",
    "conditional compilation",
  ),
  corpus("test/corpus/preprocessor.txt", "preprocessor elseif declare", "conditional compilation"),
  corpus(
    "test/corpus/frm_realworld.txt",
    "guid begin block with blob reference",
    "UserForm and document source",
  ),
  corpus("test/corpus/frm_realworld.txt", "begin property block", "UserForm and document source"),
  corpus("test/corpus/frm_realworld.txt", "class begin block", "class and document source"),
  corpus(
    "test/corpus/recovery.txt",
    "incomplete call keeps following statement",
    "known recovery",
    { errorCount: 0, missingCount: 1 },
  ),
  corpus("test/corpus/recovery.txt", "unterminated string keeps procedure body", "known recovery", {
    errorCount: 1,
    missingCount: 0,
  }),
  example("examples/basic.bas", "clean exported module"),
  example("examples/class.cls", "class module"),
  example("examples/userform.frm", "UserForm module"),
  example("examples/realworld/calendar-pick/src/workbook/ThisWorkbook.bas", "document module"),
  example("examples/realworld/calendar-pick/src/workbook/Sheet1.bas", "document module"),
];
