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

  conflicts: ($) => [],

  rules: {
    source_file: ($) => repeat($._top_level_item),

    _top_level_item: ($) =>
      choice(
        $.newline,
        $.attribute_statement,
        $.option_statement,
        $.sub_declaration,
        $.function_declaration,
        $.property_declaration,
        $.variable_declaration,
        $.const_declaration,
      ),

    newline: (_) => /\r?\n/,

    comment: (_) => token(choice(seq("'", /.*/), seq(choice("Rem", "rem", "REM"), /[ \t].*/))),

    attribute_statement: ($) =>
      seq(
        caseInsensitive("Attribute"),
        field("name", $.identifier),
        "=",
        field("value", $._literal),
        optional($.newline),
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
        optional($.newline),
      ),

    sub_declaration: ($) =>
      seq(
        optional($.visibility),
        caseInsensitive("Sub"),
        field("name", $.identifier),
        optional($.parameter_list),
        optional($.newline),
        field("body", $.block),
        caseInsensitive("End"),
        caseInsensitive("Sub"),
        optional($.newline),
      ),

    function_declaration: ($) =>
      seq(
        optional($.visibility),
        caseInsensitive("Function"),
        field("name", $.identifier),
        optional($.parameter_list),
        optional($.as_type_clause),
        optional($.newline),
        field("body", $.block),
        caseInsensitive("End"),
        caseInsensitive("Function"),
        optional($.newline),
      ),

    property_declaration: ($) =>
      seq(
        optional($.visibility),
        caseInsensitive("Property"),
        field(
          "accessor",
          choice(caseInsensitive("Get"), caseInsensitive("Let"), caseInsensitive("Set")),
        ),
        field("name", $.identifier),
        optional($.parameter_list),
        optional($.as_type_clause),
        optional($.newline),
        field("body", $.block),
        caseInsensitive("End"),
        caseInsensitive("Property"),
        optional($.newline),
      ),

    block: ($) =>
      repeat(
        choice(
          $.newline,
          $.variable_declaration,
          $.const_declaration,
          $.assignment_statement,
          $.call_statement,
          $.expression_statement,
        ),
      ),

    variable_declaration: ($) =>
      seq(
        optional($.visibility),
        choice(caseInsensitive("Dim"), caseInsensitive("Static")),
        commaSep1($.variable_declarator),
        optional($.newline),
      ),

    const_declaration: ($) =>
      seq(
        optional($.visibility),
        caseInsensitive("Const"),
        commaSep1($.const_declarator),
        optional($.newline),
      ),

    variable_declarator: ($) => seq(field("name", $.identifier), optional($.as_type_clause)),

    const_declarator: ($) =>
      seq(
        field("name", $.identifier),
        optional($.as_type_clause),
        optional(seq("=", field("value", $._expression))),
      ),

    parameter_list: ($) => seq("(", optional(commaSep1($.parameter)), ")"),

    parameter: ($) =>
      seq(
        optional(
          choice(
            caseInsensitive("ByVal"),
            caseInsensitive("ByRef"),
            caseInsensitive("Optional"),
            caseInsensitive("ParamArray"),
          ),
        ),
        field("name", $.identifier),
        optional($.as_type_clause),
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

    assignment_statement: ($) =>
      seq(field("left", $.identifier), "=", field("right", $._expression), optional($.newline)),

    call_statement: ($) =>
      seq(
        optional(caseInsensitive("Call")),
        field("callee", $.identifier),
        optional($.argument_list),
        optional($.newline),
      ),

    expression_statement: ($) => seq($._expression, optional($.newline)),

    argument_list: ($) =>
      choice(seq("(", optional(commaSep1($._expression)), ")"), commaSep1($._expression)),

    _expression: ($) => choice($._literal, $.identifier, $.binary_expression),

    binary_expression: ($) =>
      prec.left(1, seq($._expression, choice("+", "-", "*", "/", "&"), $._expression)),

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
