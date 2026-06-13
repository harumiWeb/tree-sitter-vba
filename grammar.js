/**
 * @file Tree-sitter grammar for Visual Basic for Applications
 * @author harumiWeb
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "vba",

  extras: ($) => [/[ \t\f]/, $.comment],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$._expression, $._callable_expression],
    [$.argument_list, $.parenthesized_expression],
  ],

  rules: {
    source_file: ($) => repeat($._top_level_item),

    _top_level_item: ($) =>
      choice(
        $.newline,
        $.frm_version_statement,
        $.frm_begin_block,
        $.frm_property_statement,
        $.attribute_statement,
        $.option_statement,
        $.sub_declaration,
        $.function_declaration,
        $.property_declaration,
        $.const_declaration,
        $.variable_declaration,
      ),

    newline: (_) => /\r?\n/,

    comment: (_) => token(choice(seq("'", /.*/), seq(caseInsensitive("Rem"), /([ \t].*)?/))),

    frm_version_statement: ($) =>
      prec.right(seq(caseInsensitive("VERSION"), $.number_literal, optional($.identifier))),

    frm_begin_block: ($) =>
      seq(
        caseInsensitive("Begin"),
        field("type", $.member_expression),
        field("name", $.identifier),
        $.newline,
        repeat(choice($.newline, $.frm_property_statement, $.frm_begin_block)),
        caseInsensitive("End"),
      ),

    frm_property_statement: ($) =>
      seq(
        field("name", choice($.identifier, $.member_expression)),
        "=",
        field("value", $._frm_property_value),
      ),

    _frm_property_value: ($) =>
      choice($._literal, $.member_expression, $.identifier, $.frm_property_text),

    frm_property_text: (_) => token(/[A-Za-z_][^\r\n']*/),

    attribute_statement: ($) =>
      seq(
        caseInsensitive("Attribute"),
        field("name", $.identifier),
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

    sub_declaration: ($) =>
      seq(
        optional($.procedure_modifier),
        caseInsensitive("Sub"),
        field("name", $.identifier),
        optional($.parameter_list),
        $.newline,
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
        $.newline,
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
        $.newline,
        field("body", optional($.block)),
        caseInsensitive("End"),
        caseInsensitive("Property"),
      ),

    procedure_modifier: ($) => choice($.visibility, caseInsensitive("Static")),

    block: ($) => repeat1(choice($.newline, $._statement)),

    _statement: ($) =>
      choice(
        $.if_statement,
        $.select_statement,
        $.for_statement,
        $.for_each_statement,
        $.do_statement,
        $.with_statement,
        $.const_declaration,
        $.variable_declaration,
        $.set_statement,
        $.assignment_statement,
        $.call_statement,
        $.expression_statement,
      ),

    variable_declaration: ($) =>
      seq(
        choice(
          seq(optional($.visibility), choice(caseInsensitive("Dim"), caseInsensitive("Static"))),
          $.visibility,
        ),
        commaSep1($.variable_declarator),
      ),

    const_declaration: ($) =>
      seq(optional($.visibility), caseInsensitive("Const"), commaSep1($.const_declarator)),

    variable_declarator: ($) =>
      seq(field("name", $.identifier), optional($.as_type_clause), optional($.initializer)),

    const_declarator: ($) =>
      seq(
        field("name", $.identifier),
        optional($.as_type_clause),
        optional(seq("=", field("value", $._expression))),
      ),

    initializer: ($) => seq("=", field("value", $._expression)),

    parameter_list: ($) => seq("(", optional(commaSep1($.parameter)), ")"),

    parameter: ($) =>
      seq(
        repeat(
          choice(caseInsensitive("ByVal"), caseInsensitive("ByRef"), caseInsensitive("Optional")),
        ),
        optional(caseInsensitive("ParamArray")),
        field("name", $.identifier),
        optional($.as_type_clause),
        optional($.initializer),
      ),

    as_type_clause: ($) => seq(caseInsensitive("As"), field("type", $.type_expression)),

    type_expression: ($) =>
      choice(
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

    visibility: (_) =>
      choice(caseInsensitive("Public"), caseInsensitive("Private"), caseInsensitive("Friend")),

    if_statement: ($) =>
      seq(
        caseInsensitive("If"),
        field("condition", $._expression),
        caseInsensitive("Then"),
        $.newline,
        field("consequence", optional($.block)),
        repeat($.elseif_clause),
        optional($.else_clause),
        caseInsensitive("End"),
        caseInsensitive("If"),
      ),

    elseif_clause: ($) =>
      seq(
        caseInsensitive("ElseIf"),
        field("condition", $._expression),
        caseInsensitive("Then"),
        $.newline,
        field("body", optional($.block)),
      ),

    else_clause: ($) => seq(caseInsensitive("Else"), $.newline, field("body", optional($.block))),

    select_statement: ($) =>
      seq(
        caseInsensitive("Select"),
        caseInsensitive("Case"),
        field("value", $._expression),
        $.newline,
        repeat($.case_clause),
        caseInsensitive("End"),
        caseInsensitive("Select"),
      ),

    case_clause: ($) =>
      seq(
        caseInsensitive("Case"),
        choice(caseInsensitive("Else"), commaSep1($._expression)),
        $.newline,
        field("body", optional($.block)),
      ),

    for_statement: ($) =>
      prec.right(
        seq(
          caseInsensitive("For"),
          field("variable", $.identifier),
          "=",
          field("start", $._expression),
          caseInsensitive("To"),
          field("end", $._expression),
          optional(seq(caseInsensitive("Step"), field("step", $._expression))),
          $.newline,
          field("body", optional($.block)),
          caseInsensitive("Next"),
          optional(field("next_variable", $.identifier)),
        ),
      ),

    for_each_statement: ($) =>
      prec.right(
        seq(
          caseInsensitive("For"),
          caseInsensitive("Each"),
          field("variable", $.identifier),
          caseInsensitive("In"),
          field("collection", $._expression),
          $.newline,
          field("body", optional($.block)),
          caseInsensitive("Next"),
          optional(field("next_variable", $.identifier)),
        ),
      ),

    do_statement: ($) =>
      seq(
        caseInsensitive("Do"),
        optional($.do_condition),
        $.newline,
        field("body", optional($.block)),
        caseInsensitive("Loop"),
        optional($.do_condition),
      ),

    do_condition: ($) =>
      seq(
        choice(caseInsensitive("While"), caseInsensitive("Until")),
        field("condition", $._expression),
      ),

    with_statement: ($) =>
      seq(
        caseInsensitive("With"),
        field("value", $._expression),
        $.newline,
        field("body", optional($.block)),
        caseInsensitive("End"),
        caseInsensitive("With"),
      ),

    set_statement: ($) =>
      seq(
        caseInsensitive("Set"),
        field("left", $._assignable_expression),
        "=",
        field("right", $._expression),
      ),

    assignment_statement: ($) =>
      seq(field("left", $._assignable_expression), "=", field("right", $._expression)),

    call_statement: ($) =>
      prec.right(
        1,
        choice(
        seq(
          caseInsensitive("Call"),
          field("callee", $._callable_expression),
          optional($.argument_list),
        ),
        seq(field("callee", $._callable_expression), $.argument_list),
        field("callee", $.call_expression),
      ),
      ),

    expression_statement: ($) => $._expression,

    argument_list: ($) =>
      choice(seq("(", optional(commaSep1($._expression)), ")"), commaSep1($._expression)),

    _expression: ($) =>
      choice(
        $._literal,
        $.identifier,
        $.member_expression,
        $.call_expression,
        $.parenthesized_expression,
        $.binary_expression,
        $.unary_expression,
      ),

    _assignable_expression: ($) => choice($.identifier, $.member_expression, $.call_expression),

    _callable_expression: ($) => choice($.identifier, $.member_expression),

    call_expression: ($) =>
      prec(
        2,
        seq(
          field("function", $._callable_expression),
          seq("(", optional(commaSep1($._expression)), ")"),
        ),
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

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    binary_expression: ($) =>
      prec.left(
        1,
        seq(
          $._expression,
          choice(
            "+",
            "-",
            "*",
            "/",
            "\\",
            "&",
            "<>",
            "<",
            "<=",
            ">",
            ">=",
            caseInsensitive("And"),
            caseInsensitive("Or"),
          ),
          $._expression,
        ),
      ),

    unary_expression: ($) => prec(4, seq(choice("+", "-", caseInsensitive("Not")), $._expression)),

    _literal: ($) => choice($.string_literal, $.number_literal, $.boolean_literal),

    string_literal: (_) => token(seq('"', repeat(choice('""', /[^"]/)), '"')),

    number_literal: (_) => token(/\d+(\.\d+)?/),

    boolean_literal: (_) => choice(caseInsensitive("True"), caseInsensitive("False")),

    identifier: (_) => /[A-Za-z_][A-Za-z0-9_]*/,
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
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
