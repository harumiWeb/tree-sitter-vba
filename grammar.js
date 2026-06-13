/**
 * @file Tree-sitter grammar for Visual Basic for Applications
 * @author harumiWeb
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "vba",

  extras: ($) => [/[ \t\f]/, $.line_continuation, $.comment],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$._expression, $._callable_expression],
    [$._assignable_expression, $._callable_expression],
    [$._argument, $.parenthesized_expression],
    [$._condition_expression, $.parenthesized_expression],
    [$._argument_sequence],
    [$.member_expression],
    [$.type_expression, $.dotted_type_expression, $.member_expression],
    [$.block],
    [$.elseif_clause],
    [$.else_clause],
    [$.case_clause],
  ],

  rules: {
    source_file: ($) => repeat($._top_level_item),

    _top_level_item: ($) =>
      choice(
        $.newline,
        $.frm_version_statement,
        $.frm_begin_block,
        $.frm_begin_property_block,
        $.frm_property_statement,
        $.preprocessor_const,
        $.preprocessor_if,
        $.attribute_statement,
        $.option_statement,
        $.implements_statement,
        $.type_declaration,
        $.enum_declaration,
        $.declare_statement,
        $.sub_declaration,
        $.function_declaration,
        $.property_declaration,
        $.event_declaration,
        $.const_declaration,
        $.variable_declaration,
      ),

    newline: (_) => /\r?\n/,

    _statement_separator: ($) => choice($.newline, ":"),

    line_continuation: (_) => token(seq("_", /\r?\n/)),

    comment: (_) => token(choice(seq("'", /.*/), seq(caseInsensitive("Rem"), /([ \t].*)?/))),

    frm_version_statement: ($) =>
      prec.right(seq(caseInsensitive("VERSION"), $.number_literal, optional($.identifier))),

    frm_begin_block: ($) =>
      seq(
        caseInsensitive("Begin"),
        optional(field("type", choice($.member_expression, $.guid_literal))),
        optional(field("name", $.identifier)),
        $._statement_separator,
        repeat(
          choice(
            $.newline,
            $.frm_property_statement,
            $.frm_begin_block,
            $.frm_begin_property_block,
          ),
        ),
        caseInsensitive("End"),
      ),

    frm_begin_property_block: ($) =>
      seq(
        caseInsensitive("BeginProperty"),
        field("name", $.identifier),
        $._statement_separator,
        repeat(choice($.newline, $.frm_property_statement, $.frm_begin_property_block)),
        caseInsensitive("EndProperty"),
      ),

    frm_property_statement: ($) =>
      seq(
        field("name", choice($.identifier, $.member_expression)),
        "=",
        field("value", $._frm_property_value),
      ),

    _frm_property_value: ($) =>
      choice(
        $.frm_blob_reference,
        $.frm_quoted_property_text,
        $._literal,
        $.member_expression,
        $.identifier,
        $.frm_property_text,
      ),

    frm_property_text: (_) => token(/[A-Za-z_][^\r\n']*/),

    frm_quoted_property_text: (_) => token(seq('"', /[^"\r\n]+/)),

    frm_blob_reference: ($) => seq($.string_literal, ":", $.number_literal),

    attribute_statement: ($) =>
      seq(
        caseInsensitive("Attribute"),
        field("name", choice($.identifier, $.member_expression)),
        "=",
        field("value", $._literal),
      ),

    option_statement: ($) =>
      seq(
        caseInsensitive("Option"),
        choice(
          caseInsensitive("Explicit"),
          seq(caseInsensitive("Private"), caseInsensitive("Module")),
          seq(
            caseInsensitive("Compare"),
            choice(caseInsensitive("Binary"), caseInsensitive("Text"), caseInsensitive("Database")),
          ),
          seq(caseInsensitive("Base"), $.number_literal),
        ),
      ),

    implements_statement: ($) =>
      seq(caseInsensitive("Implements"), field("type", $.type_expression)),

    type_declaration: ($) =>
      seq(
        optional($.visibility),
        caseInsensitive("Type"),
        field("name", $.identifier),
        $._statement_separator,
        repeat(choice($.newline, $.type_member, $.type_preprocessor_if)),
        caseInsensitive("End"),
        caseInsensitive("Type"),
      ),

    type_member: ($) =>
      seq(field("name", $.identifier), optional($.array_bounds), $.as_type_clause),

    type_preprocessor_if: ($) =>
      seq(
        caseInsensitive("#If"),
        field("condition", $._condition_expression),
        caseInsensitive("Then"),
        $.newline,
        field("body", optional($.type_preprocessor_block)),
        repeat($.type_preprocessor_elseif),
        optional($.type_preprocessor_else),
        caseInsensitive("#End"),
        caseInsensitive("If"),
      ),

    type_preprocessor_block: ($) =>
      repeat1(choice($.newline, $.type_member, $.type_preprocessor_if)),

    type_preprocessor_elseif: ($) =>
      seq(
        caseInsensitive("#ElseIf"),
        field("condition", $._condition_expression),
        caseInsensitive("Then"),
        $.newline,
        field("body", optional($.type_preprocessor_block)),
      ),

    type_preprocessor_else: ($) =>
      seq(caseInsensitive("#Else"), $.newline, field("body", optional($.type_preprocessor_block))),

    enum_declaration: ($) =>
      seq(
        optional($.visibility),
        caseInsensitive("Enum"),
        field("name", $.identifier),
        $._statement_separator,
        repeat(choice($.newline, $.enum_member, $.preprocessor_if)),
        caseInsensitive("End"),
        caseInsensitive("Enum"),
      ),

    enum_member: ($) =>
      seq(field("name", $.identifier), optional(seq("=", field("value", $._expression)))),

    declare_statement: ($) =>
      prec.right(
        seq(
          optional($.visibility),
          caseInsensitive("Declare"),
          optional(caseInsensitive("PtrSafe")),
          field("kind", choice(caseInsensitive("Function"), caseInsensitive("Sub"))),
          field("name", $.identifier),
          caseInsensitive("Lib"),
          field("library", $.string_literal),
          optional(seq(caseInsensitive("Alias"), field("alias", $.string_literal))),
          optional($.parameter_list),
          optional($.as_type_clause),
        ),
      ),

    preprocessor_const: ($) =>
      seq(
        caseInsensitive("#Const"),
        field("name", $.identifier),
        "=",
        field("value", $._expression),
      ),

    preprocessor_if: ($) =>
      seq(
        caseInsensitive("#If"),
        field("condition", $._condition_expression),
        caseInsensitive("Then"),
        $.newline,
        field("body", optional($.preprocessor_block)),
        repeat($.preprocessor_elseif),
        optional($.preprocessor_else),
        caseInsensitive("#End"),
        caseInsensitive("If"),
      ),

    preprocessor_block: ($) => repeat1(choice($._preprocessor_item)),

    _preprocessor_item: ($) =>
      choice(
        $.newline,
        $._statement,
        $.declare_statement,
        $.type_declaration,
        $.enum_declaration,
        $.sub_declaration,
        $.function_declaration,
        $.property_declaration,
        $.event_declaration,
      ),

    preprocessor_elseif: ($) =>
      seq(
        caseInsensitive("#ElseIf"),
        field("condition", $._condition_expression),
        caseInsensitive("Then"),
        $.newline,
        field("body", optional($.preprocessor_block)),
      ),

    preprocessor_else: ($) =>
      seq(caseInsensitive("#Else"), $.newline, field("body", optional($.preprocessor_block))),

    sub_declaration: ($) =>
      seq(
        optional($.procedure_modifier),
        caseInsensitive("Sub"),
        field("name", $.identifier),
        optional($.parameter_list),
        $._statement_separator,
        field("body", optional($.block)),
        caseInsensitive("End"),
        caseInsensitive("Sub"),
      ),

    function_declaration: ($) =>
      seq(
        optional($.procedure_modifier),
        caseInsensitive("Function"),
        field("name", $.identifier),
        optional($.parameter_list),
        optional($.as_type_clause),
        $._statement_separator,
        field("body", optional($.block)),
        caseInsensitive("End"),
        caseInsensitive("Function"),
      ),

    property_declaration: ($) =>
      seq(
        optional($.procedure_modifier),
        caseInsensitive("Property"),
        field(
          "accessor",
          choice(caseInsensitive("Get"), caseInsensitive("Let"), caseInsensitive("Set")),
        ),
        field("name", $.identifier),
        optional($.parameter_list),
        optional($.as_type_clause),
        $._statement_separator,
        field("body", optional($.block)),
        caseInsensitive("End"),
        caseInsensitive("Property"),
      ),

    event_declaration: ($) =>
      prec.right(
        seq(
          optional($.visibility),
          caseInsensitive("Event"),
          field("name", $.identifier),
          optional($.parameter_list),
        ),
      ),

    procedure_modifier: ($) => choice($.visibility, caseInsensitive("Static")),

    block: ($) => repeat1(choice($._statement_separator, $._statement)),

    _statement: ($) =>
      choice(
        $.single_line_if_statement,
        $.if_statement,
        $.select_statement,
        $.for_statement,
        $.for_each_statement,
        $.do_statement,
        $.while_statement,
        $.with_statement,
        $.on_error_statement,
        $.resume_statement,
        $.goto_statement,
        $.label_statement,
        $.line_number_statement,
        $.exit_statement,
        $.end_statement,
        $.redim_statement,
        $.erase_statement,
        $.open_statement,
        $.input_statement,
        $.line_input_statement,
        $.print_statement,
        $.close_statement,
        $.preprocessor_const,
        $.preprocessor_if,
        $.const_declaration,
        $.variable_declaration,
        $.set_statement,
        $.assignment_statement,
        $.call_statement,
        $.expression_statement,
      ),

    variable_declaration: ($) =>
      choice(
        seq($.visibility, caseInsensitive("WithEvents"), commaSep1($.variable_declarator)),
        seq(
          choice(
            seq(optional($.visibility), choice(caseInsensitive("Dim"), caseInsensitive("Static"))),
            $.visibility,
          ),
          commaSep1($.variable_declarator),
        ),
      ),

    const_declaration: ($) =>
      seq(optional($.visibility), caseInsensitive("Const"), commaSep1($.const_declarator)),

    variable_declarator: ($) =>
      choice(
        prec.right(
          1,
          seq(
            field("name", $.identifier),
            $.array_bounds,
            optional($.as_type_clause),
            optional($.initializer),
          ),
        ),
        seq(field("name", $.identifier), optional($.as_type_clause), optional($.initializer)),
      ),

    const_declarator: ($) =>
      seq(
        field("name", $.identifier),
        optional($.as_type_clause),
        optional(seq("=", field("value", $._expression))),
      ),

    initializer: ($) => seq("=", field("value", choice($.comparison_expression, $._expression))),

    parameter_list: ($) => seq("(", optional(commaSep1($.parameter)), ")"),

    parameter: ($) =>
      seq(
        repeat(
          choice(caseInsensitive("ByVal"), caseInsensitive("ByRef"), caseInsensitive("Optional")),
        ),
        optional(caseInsensitive("ParamArray")),
        field("name", $.identifier),
        optional($.array_bounds),
        optional($.as_type_clause),
        optional($.initializer),
      ),

    as_type_clause: ($) =>
      prec.right(
        seq(
          caseInsensitive("As"),
          optional(caseInsensitive("New")),
          field("type", $.type_expression),
          optional($.fixed_string_length),
          optional($.array_bounds),
        ),
      ),

    fixed_string_length: ($) => seq("*", field("length", $._expression)),

    array_bounds: ($) => seq("(", optional(commaSep1($.array_bound)), ")"),

    array_bound: ($) =>
      choice(
        seq(field("lower", $._expression), caseInsensitive("To"), field("upper", $._expression)),
        $._expression,
      ),

    type_expression: ($) =>
      prec(
        4,
        choice(
          $.dotted_type_expression,
          $.identifier,
          caseInsensitive("String"),
          caseInsensitive("Boolean"),
          caseInsensitive("Byte"),
          caseInsensitive("Integer"),
          caseInsensitive("Long"),
          caseInsensitive("LongLong"),
          caseInsensitive("LongPtr"),
          caseInsensitive("Single"),
          caseInsensitive("Double"),
          caseInsensitive("Currency"),
          caseInsensitive("Date"),
          caseInsensitive("Variant"),
          caseInsensitive("Object"),
        ),
      ),

    dotted_type_expression: ($) => prec(5, seq($.identifier, repeat1(seq(".", $.identifier)))),

    visibility: (_) =>
      choice(caseInsensitive("Public"), caseInsensitive("Private"), caseInsensitive("Friend")),

    if_statement: ($) =>
      seq(
        optional(field("start_line", $.line_number_prefix)),
        caseInsensitive("If"),
        field("condition", $._condition_expression),
        caseInsensitive("Then"),
        $.newline,
        field("consequence", optional($.block)),
        repeat($.elseif_clause),
        optional($.else_clause),
        optional(field("end_line", $.line_number_prefix)),
        caseInsensitive("End"),
        caseInsensitive("If"),
      ),

    single_line_if_statement: ($) =>
      prec.right(
        seq(
          caseInsensitive("If"),
          field("condition", $._condition_expression),
          caseInsensitive("Then"),
          optional(":"),
          field("consequence", $._single_line_statement),
          optional(seq(caseInsensitive("Else"), field("alternative", $._single_line_statement))),
        ),
      ),

    _single_line_statement: ($) =>
      choice(
        $.exit_statement,
        $.on_error_statement,
        $.resume_statement,
        $.goto_statement,
        $.redim_statement,
        $.erase_statement,
        $.open_statement,
        $.input_statement,
        $.line_input_statement,
        $.print_statement,
        $.close_statement,
        $.set_statement,
        $.assignment_statement,
        $.call_statement,
        $.expression_statement,
      ),

    elseif_clause: ($) =>
      seq(
        optional(field("line", $.line_number_prefix)),
        caseInsensitive("ElseIf"),
        field("condition", $._condition_expression),
        caseInsensitive("Then"),
        $.newline,
        field("body", optional($.block)),
      ),

    else_clause: ($) =>
      seq(
        optional(field("line", $.line_number_prefix)),
        caseInsensitive("Else"),
        $.newline,
        field("body", optional($.block)),
      ),

    select_statement: ($) =>
      seq(
        optional(field("start_line", $.line_number_prefix)),
        caseInsensitive("Select"),
        caseInsensitive("Case"),
        field("value", $._expression),
        $.newline,
        repeat(choice($.newline, $.case_clause)),
        optional(field("end_line", $.line_number_prefix)),
        caseInsensitive("End"),
        caseInsensitive("Select"),
      ),

    case_clause: ($) =>
      seq(
        optional(field("line", $.line_number_prefix)),
        caseInsensitive("Case"),
        choice(caseInsensitive("Else"), commaSep1($.case_expression)),
        $._statement_separator,
        field("body", optional($.block)),
      ),

    case_expression: ($) =>
      choice(
        seq(caseInsensitive("Is"), choice("<", "<=", ">", ">=", "=", "<>"), $._expression),
        seq($._expression, caseInsensitive("To"), $._expression),
        $._expression,
      ),

    for_statement: ($) =>
      prec.right(
        seq(
          optional(field("start_line", $.line_number_prefix)),
          caseInsensitive("For"),
          field("variable", $.identifier),
          "=",
          field("start", $._expression),
          caseInsensitive("To"),
          field("end", $._expression),
          optional(seq(caseInsensitive("Step"), field("step", $._expression))),
          $.newline,
          field("body", optional($.block)),
          optional(field("end_line", $.line_number_prefix)),
          caseInsensitive("Next"),
          optional(field("next_variable", $.identifier)),
        ),
      ),

    for_each_statement: ($) =>
      prec.right(
        seq(
          optional(field("start_line", $.line_number_prefix)),
          caseInsensitive("For"),
          caseInsensitive("Each"),
          field("variable", $.identifier),
          caseInsensitive("In"),
          field("collection", $._expression),
          $.newline,
          field("body", optional($.block)),
          optional(field("end_line", $.line_number_prefix)),
          caseInsensitive("Next"),
          optional(field("next_variable", $.identifier)),
        ),
      ),

    do_statement: ($) =>
      prec.right(
        seq(
          optional(field("start_line", $.line_number_prefix)),
          caseInsensitive("Do"),
          optional($.do_condition),
          $.newline,
          field("body", optional($.block)),
          optional(field("end_line", $.line_number_prefix)),
          caseInsensitive("Loop"),
          optional($.do_condition),
        ),
      ),

    do_condition: ($) =>
      seq(
        choice(caseInsensitive("While"), caseInsensitive("Until")),
        field("condition", $._condition_expression),
      ),

    while_statement: ($) =>
      seq(
        optional(field("start_line", $.line_number_prefix)),
        caseInsensitive("While"),
        field("condition", $._condition_expression),
        $.newline,
        field("body", optional($.block)),
        optional(field("end_line", $.line_number_prefix)),
        caseInsensitive("Wend"),
      ),

    with_statement: ($) =>
      seq(
        optional(field("start_line", $.line_number_prefix)),
        caseInsensitive("With"),
        field("value", $._expression),
        $.newline,
        field("body", optional($.block)),
        optional(field("end_line", $.line_number_prefix)),
        caseInsensitive("End"),
        caseInsensitive("With"),
      ),

    exit_statement: ($) =>
      seq(
        caseInsensitive("Exit"),
        choice(
          caseInsensitive("Sub"),
          caseInsensitive("Function"),
          caseInsensitive("Property"),
          caseInsensitive("For"),
          caseInsensitive("Do"),
        ),
      ),

    end_statement: (_) => token(/[Ee][Nn][Dd][ \t]*(?:\r?\n|:)/),

    on_error_statement: ($) =>
      seq(
        caseInsensitive("On"),
        caseInsensitive("Error"),
        choice(
          seq(caseInsensitive("GoTo"), field("target", choice($.identifier, lineNumber($)))),
          seq(caseInsensitive("Resume"), caseInsensitive("Next")),
        ),
      ),

    resume_statement: ($) =>
      prec.right(
        seq(
          caseInsensitive("Resume"),
          optional(
            choice(caseInsensitive("Next"), field("target", choice($.identifier, lineNumber($)))),
          ),
        ),
      ),

    goto_statement: ($) =>
      seq(caseInsensitive("GoTo"), field("target", choice($.identifier, lineNumber($)))),

    label_statement: ($) => prec(5, seq(field("name", choice($.identifier, lineNumber($))), ":")),

    line_number_prefix: ($) => prec.dynamic(1, prec(6, seq(lineNumber($), optional(":")))),

    line_number_statement: ($) =>
      prec.right(5, seq(field("number", lineNumber($)), field("statement", $._numbered_statement))),

    _numbered_statement: ($) =>
      choice(
        $.single_line_if_statement,
        $.on_error_statement,
        $.resume_statement,
        $.goto_statement,
        $.exit_statement,
        $.redim_statement,
        $.const_declaration,
        $.variable_declaration,
        $.set_statement,
        $.assignment_statement,
        $.call_statement,
        $.expression_statement,
      ),

    redim_statement: ($) =>
      seq(
        caseInsensitive("ReDim"),
        optional(caseInsensitive("Preserve")),
        commaSep1($.redim_declarator),
      ),

    redim_declarator: ($) =>
      prec(4, seq(field("name", choice($.identifier, $.member_expression)), $.array_bounds)),

    erase_statement: ($) =>
      prec.right(
        seq(caseInsensitive("Erase"), commaSep1(field("target", $._assignable_expression))),
      ),

    open_statement: ($) =>
      seq(
        caseInsensitive("Open"),
        field("path", $._expression),
        caseInsensitive("For"),
        field("mode", $.file_mode),
        optional(seq(caseInsensitive("Access"), field("access", $.file_access))),
        optional(seq(caseInsensitive("Lock"), field("lock", $.file_lock))),
        caseInsensitive("As"),
        field("number", $.file_number),
        optional(seq(caseInsensitive("Len"), "=", field("record_length", $._expression))),
      ),

    file_mode: (_) =>
      choice(
        caseInsensitive("Append"),
        caseInsensitive("Binary"),
        caseInsensitive("Input"),
        caseInsensitive("Output"),
        caseInsensitive("Random"),
      ),

    file_access: (_) =>
      choice(
        caseInsensitive("Read"),
        caseInsensitive("Write"),
        seq(caseInsensitive("Read"), caseInsensitive("Write")),
      ),

    file_lock: (_) =>
      choice(
        caseInsensitive("Read"),
        caseInsensitive("Write"),
        seq(caseInsensitive("Read"), caseInsensitive("Write")),
        caseInsensitive("Shared"),
      ),

    file_number: ($) => prec(1, choice($.file_number_literal, $._expression)),

    input_statement: ($) =>
      seq(
        caseInsensitive("Input"),
        field("number", $.file_number),
        ",",
        commaSep1(field("target", $._callable_expression)),
      ),

    line_input_statement: ($) =>
      prec(
        1,
        seq(
          caseInsensitive("Line"),
          caseInsensitive("Input"),
          field("number", $.file_number),
          ",",
          field(
            "target",
            choice($._callable_expression, alias(caseInsensitive("Line"), $.identifier)),
          ),
        ),
      ),

    print_statement: ($) =>
      prec.right(
        seq(
          caseInsensitive("Print"),
          field("number", $.file_number),
          optional(seq(",", optional($.print_argument_sequence))),
        ),
      ),

    print_argument_sequence: ($) =>
      seq($._expression, repeat(seq(choice(",", ";"), $._expression))),

    close_statement: ($) =>
      prec.right(seq(caseInsensitive("Close"), optional(commaSep1($.file_number)))),

    set_statement: ($) =>
      seq(
        caseInsensitive("Set"),
        field("left", $._assignable_expression),
        "=",
        field("right", choice($.comparison_expression, $._expression)),
      ),

    assignment_statement: ($) =>
      seq(
        field("left", $._assignable_expression),
        "=",
        field("right", choice($.logical_value_expression, $.comparison_expression, $._expression)),
      ),

    call_statement: ($) =>
      prec.right(
        1,
        choice(
          seq(
            caseInsensitive("Call"),
            field("callee", choice($.identifier, $.member_expression)),
            optional($.argument_list),
          ),
          field("callee", $._callable_expression),
          seq(field("callee", $._callable_expression), $.argument_list),
          field("callee", $.call_expression),
        ),
      ),

    expression_statement: ($) => $._expression,

    argument_list: ($) =>
      choice(seq("(", optional($._argument_sequence), ")"), $._unparenthesized_argument_sequence),

    _argument_sequence: ($) =>
      choice(
        prec(1, commaSep1($._argument)),
        prec.right(seq(optional($._argument), repeat1(seq(",", optional($._argument))))),
      ),

    _unparenthesized_argument_sequence: ($) =>
      choice(prec(2, $._omitted_argument_sequence), commaSep1($._argument)),

    _omitted_argument_sequence: ($) =>
      prec.right(
        choice(
          seq(",", optional($._argument), repeat(seq(",", optional($._argument)))),
          seq(
            $._argument,
            repeat(seq(",", $._argument)),
            ",",
            ",",
            optional($._argument),
            repeat(seq(",", optional($._argument))),
          ),
        ),
      ),

    _argument: ($) =>
      choice($.byval_argument, $.named_argument, $.comparison_expression, $._expression),

    named_argument: ($) => seq(field("name", $.identifier), ":=", field("value", $._expression)),

    byval_argument: ($) =>
      seq(caseInsensitive("ByVal"), field("value", choice($.comparison_expression, $._expression))),

    _condition_expression: ($) =>
      choice(
        $.condition_binary_expression,
        $.comparison_expression,
        $.parenthesized_condition_expression,
        $._expression,
      ),

    _expression: ($) =>
      choice(
        $._literal,
        $.file_number_literal,
        $.call_expression,
        $.member_expression,
        alias(caseInsensitive("Line"), $.identifier),
        $.identifier,
        $.new_expression,
        $.addressof_expression,
        $.type_of_expression,
        $.parenthesized_expression,
        $.binary_expression,
        $.unary_expression,
      ),

    comparison_expression: ($) => prec.left(7, seq($._expression, "=", $._expression)),

    logical_value_expression: ($) =>
      choice(
        prec.left(
          5,
          seq(
            choice($.comparison_expression, $._expression),
            caseInsensitive("And"),
            $.comparison_expression,
          ),
        ),
        prec.left(5, seq($.comparison_expression, caseInsensitive("And"), $._expression)),
        prec.left(
          4,
          seq(
            choice($.comparison_expression, $._expression),
            caseInsensitive("Or"),
            $.comparison_expression,
          ),
        ),
        prec.left(4, seq($.comparison_expression, caseInsensitive("Or"), $._expression)),
      ),

    condition_binary_expression: ($) =>
      choice(
        prec.left(5, seq($._condition_expression, caseInsensitive("And"), $._condition_expression)),
        prec.left(4, seq($._condition_expression, caseInsensitive("Or"), $._condition_expression)),
      ),

    parenthesized_condition_expression: ($) =>
      prec.dynamic(1, seq("(", $._condition_expression, ")")),

    _assignable_expression: ($) =>
      choice(
        $.identifier,
        $.member_expression,
        $.call_expression,
        alias(caseInsensitive("Line"), $.identifier),
      ),

    _callable_expression: ($) => choice($.identifier, $.member_expression),

    call_expression: ($) =>
      prec(
        2,
        choice(
          seq(
            field("function", $._callable_expression),
            seq("(", optional($._argument_sequence), ")"),
          ),
          seq(field("function", $.call_expression), seq("(", optional($._argument_sequence), ")")),
        ),
      ),

    new_expression: ($) =>
      prec(
        4,
        seq(caseInsensitive("New"), field("type", choice($.member_expression, $.identifier))),
      ),

    addressof_expression: ($) => seq(caseInsensitive("AddressOf"), field("target", $.identifier)),

    type_of_expression: ($) =>
      seq(
        caseInsensitive("TypeOf"),
        field("value", $._expression),
        caseInsensitive("Is"),
        field("type", $.type_expression),
      ),

    member_expression: ($) =>
      prec.left(
        3,
        choice(
          seq(
            field("object", choice($.identifier, $.call_expression, $.member_expression)),
            ".",
            field("property", $.identifier),
          ),
          seq(".", field("property", $.identifier)),
        ),
      ),

    parenthesized_expression: ($) =>
      seq("(", choice($._expression, $.comparison_expression, $.condition_binary_expression), ")"),

    binary_expression: ($) =>
      choice(
        prec.right(14, seq($._expression, "^", $._expression)),
        prec.left(12, seq($._expression, choice("*", "/"), $._expression)),
        prec.left(11, seq($._expression, "\\", $._expression)),
        prec.left(10, seq($._expression, caseInsensitive("Mod"), $._expression)),
        prec.left(9, seq($._expression, choice("+", "-"), $._expression)),
        prec.left(8, seq($._expression, "&", $._expression)),
        prec.left(
          7,
          seq(
            $._expression,
            choice("<>", "<", "<=", ">", ">=", caseInsensitive("Is"), caseInsensitive("Like")),
            $._expression,
          ),
        ),
        prec.left(5, seq($._expression, caseInsensitive("And"), $._expression)),
        prec.left(4, seq($._expression, caseInsensitive("Or"), $._expression)),
        prec.left(3, seq($._expression, caseInsensitive("Xor"), $._expression)),
        prec.left(2, seq($._expression, caseInsensitive("Eqv"), $._expression)),
        prec.left(1, seq($._expression, caseInsensitive("Imp"), $._expression)),
      ),

    unary_expression: ($) =>
      choice(
        prec(13, seq(choice("+", "-"), $._expression)),
        prec(6, seq(caseInsensitive("Not"), $._expression)),
      ),

    _literal: ($) =>
      choice(
        $.string_literal,
        $.number_literal,
        $.boolean_literal,
        $.nothing_literal,
        $.null_literal,
        $.empty_literal,
        $.date_literal,
      ),

    string_literal: (_) => token(seq('"', repeat(choice('""', /[^"\r\n]/)), '"')),

    number_literal: (_) => token(choice(/-?&[Hh][0-9A-Fa-f]+[&]?/, /-?\d+(\.\d+)?[$%&!#@^]?/)),

    boolean_literal: (_) => choice(caseInsensitive("True"), caseInsensitive("False")),

    nothing_literal: (_) => caseInsensitive("Nothing"),

    null_literal: (_) => caseInsensitive("Null"),

    empty_literal: (_) => caseInsensitive("Empty"),

    date_literal: (_) => token(/#[^#\r\n]+#/),

    guid_literal: (_) => token(/\{[0-9A-Fa-f-]+\}/),

    file_number_literal: ($) => seq("#", field("number", $._expression)),

    identifier: (_) =>
      token(
        choice(
          /[A-Za-z_\u00C0-\u{10FFFF}][A-Za-z0-9_\u00C0-\u{10FFFF}]*[$%&!#]?/u,
          /\[[^\]\r\n]+\]/,
        ),
      ),
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function lineNumber($) {
  return prec(1, alias($.number_literal, $.line_number_literal));
}

function caseInsensitive(keyword) {
  return new RegExp(
    keyword
      .split("")
      .map((char) => {
        if (/[a-zA-Z]/.test(char)) {
          return `[${char.toLowerCase()}${char.toUpperCase()}]`;
        }
        return char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join(""),
  );
}
