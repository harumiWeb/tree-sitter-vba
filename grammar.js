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

  // Keep the permissive identifier vocabulary globally, but reserve
  // declaration keywords where a variable declarator name is expected.
  reserved: {
    global: (_) => [],
    variable_declarator: ($) => [$._dim_keyword, $._redim_keyword],
  },

  supertypes: ($) => [$.member_expression],

  conflicts: ($) => [
    [$._primary_expression, $._callable_expression],
    [$._expression, $._comparison_operand],
    [$._comparison_operand, $.unary_expression],
    [$._argument, $.parenthesized_expression],
    [$._condition_expression, $.parenthesized_expression],
    [$._argument_sequence],
    [$.block],
    [$.case_clause],
    [$.property_get_declaration, $._property_header],
    [$.property_let_declaration, $._property_header],
    [$.property_set_declaration, $._property_header],
    [$._statement, $._multiline_for_tail],
    [$._inline_statement, $.shared_next_for_body],
    [$.goto_statement],
    [$._statement_separator, $._conditional_sub_headers],
    [$._statement_separator, $._conditional_function_headers],
    [$._print_output_expression, $._primary_expression],
    [$._unparenthesized_print_output_expression, $._callable_expression],
    [$._unparenthesized_print_output_expression, $._primary_expression],
    [$._unparenthesized_print_output_expression, $._expression],
    [$._unparenthesized_print_output_expression, $._print_output_call_operand],
  ],

  rules: {
    source_file: ($) => repeat($._top_level_item),

    _top_level_item: ($) =>
      choice(
        $.newline,
        $.line_number_top_level_item,
        $.frm_version_statement,
        $.frm_begin_block,
        $.frm_begin_property_block,
        $.frm_property_statement,
        $.preprocessor_const,
        $.preprocessor_if,
        $.attribute_statement,
        $.option_statement,
        $.implements_statement,
        $.def_type_statement,
        $.type_declaration,
        $.enum_declaration,
        $.declare_sub_statement,
        $.declare_function_statement,
        $.conditional_sub_declaration,
        $.conditional_function_declaration,
        $.conditional_property_declaration,
        $.sub_declaration,
        $.function_declaration,
        $.property_get_declaration,
        $.property_let_declaration,
        $.property_set_declaration,
        $.event_declaration,
        $.const_declaration,
        $.variable_declaration,
      ),

    newline: (_) => /\r?\n/,

    _statement_separator: ($) => choice($.newline, ":"),

    line_continuation: (_) => token(seq("_", /[ \t]*\r?\n/)),

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
        field(
          "name",
          choice($.identifier, alias(caseInsensitive("Name"), $.identifier), $.member_expression),
        ),
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
        field("name", $._attribute_name),
        "=",
        field("value", $._literal),
      ),

    // VBE export attributes can target procedures named with a contextual
    // keyword. Keep their identifiers local to Attribute syntax so ordinary
    // statement parsing remains unchanged.
    _attribute_name: ($) =>
      choice(
        $._attribute_identifier,
        alias($._attribute_member_expression, $.qualified_member_expression),
      ),

    _attribute_member_expression: ($) =>
      prec.left(
        3,
        seq(
          field("receiver", $._attribute_identifier),
          repeat1(
            seq(field("operator", choice(".", "!")), field("member", $._attribute_identifier)),
          ),
        ),
      ),

    _attribute_identifier: ($) =>
      choice(
        $.identifier,
        alias(caseInsensitive("Load"), $.identifier),
        alias(caseInsensitive("Name"), $.identifier),
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
      seq(caseInsensitive("Implements"), field("name", $.type_expression)),

    type_declaration: ($) =>
      seq(
        optional(field("visibility", $.visibility)),
        caseInsensitive("Type"),
        field("name", $.identifier),
        $._statement_separator,
        repeat(choice($._statement_separator, $.type_member, $.type_preprocessor_if)),
        caseInsensitive("End"),
        caseInsensitive("Type"),
      ),

    type_member: ($) =>
      seq(
        field("name", $.identifier),
        optional(field("bounds", $.array_bounds)),
        field("type", $.as_type_clause),
      ),

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
        optional(field("visibility", $.visibility)),
        caseInsensitive("Enum"),
        field("name", $.identifier),
        $._statement_separator,
        repeat(choice($._statement_separator, $.enum_member, $.preprocessor_if)),
        caseInsensitive("End"),
        caseInsensitive("Enum"),
      ),

    enum_member: ($) =>
      seq(field("name", $.identifier), optional(seq("=", field("value", $._expression)))),

    declare_sub_statement: ($) =>
      prec.right(
        seq(
          optional(field("visibility", $.visibility)),
          caseInsensitive("Declare"),
          optional(field("ptrsafe_modifier", $.ptrsafe_modifier)),
          caseInsensitive("Sub"),
          field("name", $.identifier),
          caseInsensitive("Lib"),
          field("library", $.string_literal),
          optional(seq(caseInsensitive("Alias"), field("alias", $.string_literal))),
          optional(field("parameters", $.parameter_list)),
        ),
      ),

    declare_function_statement: ($) =>
      prec.right(
        seq(
          optional(field("visibility", $.visibility)),
          caseInsensitive("Declare"),
          optional(field("ptrsafe_modifier", $.ptrsafe_modifier)),
          caseInsensitive("Function"),
          field("name", $.identifier),
          caseInsensitive("Lib"),
          field("library", $.string_literal),
          optional(seq(caseInsensitive("Alias"), field("alias", $.string_literal))),
          optional(field("parameters", $.parameter_list)),
          optional(field("type", $.as_type_clause)),
        ),
      ),

    preprocessor_const: ($) =>
      seq(
        caseInsensitive("#Const"),
        field("name", $.identifier),
        "=",
        field("value", choice($.comparison_expression, $._expression)),
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
        $.declare_sub_statement,
        $.declare_function_statement,
        $.type_declaration,
        $.enum_declaration,
        $.conditional_sub_declaration,
        $.conditional_function_declaration,
        $.conditional_property_declaration,
        $.sub_declaration,
        $.function_declaration,
        $.property_get_declaration,
        $.property_let_declaration,
        $.property_set_declaration,
        $.event_declaration,
        ":",
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
        $._sub_header,
        $._statement_separator,
        optional($._procedure_attributes),
        field("body", optional($.block)),
        field("end", $.end_sub_statement),
      ),

    function_declaration: ($) =>
      seq(
        $._function_header,
        $._statement_separator,
        optional($._procedure_attributes),
        field("body", optional($.block)),
        field("end", $.end_function_statement),
      ),

    property_get_declaration: ($) =>
      seq(
        $._property_get_header,
        $._statement_separator,
        optional($._procedure_attributes),
        field("body", optional($.block)),
        field("end", $.end_property_statement),
      ),

    property_let_declaration: ($) =>
      seq(
        $._property_let_header,
        $._statement_separator,
        optional($._procedure_attributes),
        field("body", optional($.block)),
        field("end", $.end_property_statement),
      ),

    property_set_declaration: ($) =>
      seq(
        $._property_set_header,
        $._statement_separator,
        optional($._procedure_attributes),
        field("body", optional($.block)),
        field("end", $.end_property_statement),
      ),

    _sub_header: ($) =>
      seq(
        optional($._procedure_modifier),
        caseInsensitive("Sub"),
        field("name", $.identifier),
        optional(field("parameters", $.parameter_list)),
      ),

    _function_header: ($) =>
      seq(
        optional($._procedure_modifier),
        caseInsensitive("Function"),
        field("name", $.identifier),
        optional(field("parameters", $.parameter_list)),
        optional(field("type", $.as_type_clause)),
      ),

    _property_header: ($) =>
      choice($._property_get_header, $._property_let_header, $._property_set_header),

    _property_get_header: ($) =>
      seq(
        optional($._procedure_modifier),
        caseInsensitive("Property"),
        field("accessor", $.get_accessor),
        field("name", $.identifier),
        optional(field("parameters", $.parameter_list)),
        optional(field("type", $.as_type_clause)),
      ),

    _property_let_header: ($) =>
      seq(
        optional($._procedure_modifier),
        caseInsensitive("Property"),
        field("accessor", $.let_accessor),
        field("name", $.identifier),
        optional(field("parameters", $.parameter_list)),
        optional(field("type", $.as_type_clause)),
      ),

    _property_set_header: ($) =>
      seq(
        optional($._procedure_modifier),
        caseInsensitive("Property"),
        field("accessor", $.set_accessor),
        field("name", $.identifier),
        optional(field("parameters", $.parameter_list)),
        optional(field("type", $.as_type_clause)),
      ),

    conditional_sub_declaration: ($) =>
      seq(
        $._conditional_sub_headers,
        $.newline,
        field("body", optional($.block)),
        caseInsensitive("End"),
        caseInsensitive("Sub"),
      ),

    conditional_function_declaration: ($) =>
      seq(
        $._conditional_function_headers,
        $.newline,
        field("body", optional($.block)),
        caseInsensitive("End"),
        caseInsensitive("Function"),
      ),

    conditional_property_declaration: ($) =>
      seq(
        $._conditional_property_headers,
        $.newline,
        field("body", optional($.block)),
        caseInsensitive("End"),
        caseInsensitive("Property"),
      ),

    _conditional_sub_headers: ($) =>
      seq(
        caseInsensitive("#If"),
        field("condition", $._condition_expression),
        caseInsensitive("Then"),
        $.newline,
        field("consequence", $._sub_header),
        $.newline,
        field("consequence_body", optional($.conditional_branch_body)),
        repeat(
          seq(
            caseInsensitive("#ElseIf"),
            field("condition", $._condition_expression),
            caseInsensitive("Then"),
            $.newline,
            field("alternative", $._sub_header),
            $.newline,
            field("alternative_body", optional($.conditional_branch_body)),
          ),
        ),
        optional(
          seq(
            caseInsensitive("#Else"),
            $.newline,
            field("alternative", $._sub_header),
            $.newline,
            field("alternative_body", optional($.conditional_branch_body)),
          ),
        ),
        caseInsensitive("#End"),
        caseInsensitive("If"),
      ),

    _conditional_function_headers: ($) =>
      seq(
        caseInsensitive("#If"),
        field("condition", $._condition_expression),
        caseInsensitive("Then"),
        $.newline,
        field("consequence", $._function_header),
        $.newline,
        field("consequence_body", optional($.conditional_branch_body)),
        repeat(
          seq(
            caseInsensitive("#ElseIf"),
            field("condition", $._condition_expression),
            caseInsensitive("Then"),
            $.newline,
            field("alternative", $._function_header),
            $.newline,
            field("alternative_body", optional($.conditional_branch_body)),
          ),
        ),
        optional(
          seq(
            caseInsensitive("#Else"),
            $.newline,
            field("alternative", $._function_header),
            $.newline,
            field("alternative_body", optional($.conditional_branch_body)),
          ),
        ),
        caseInsensitive("#End"),
        caseInsensitive("If"),
      ),

    _conditional_property_headers: ($) =>
      seq(
        caseInsensitive("#If"),
        field("condition", $._condition_expression),
        caseInsensitive("Then"),
        $.newline,
        field("consequence", $._property_header),
        $.newline,
        field("consequence_body", optional($.conditional_branch_body)),
        repeat(
          seq(
            caseInsensitive("#ElseIf"),
            field("condition", $._condition_expression),
            caseInsensitive("Then"),
            $.newline,
            field("alternative", $._property_header),
            $.newline,
            field("alternative_body", optional($.conditional_branch_body)),
          ),
        ),
        optional(
          seq(
            caseInsensitive("#Else"),
            $.newline,
            field("alternative", $._property_header),
            $.newline,
            field("alternative_body", optional($.conditional_branch_body)),
          ),
        ),
        caseInsensitive("#End"),
        caseInsensitive("If"),
      ),

    event_declaration: ($) =>
      prec.right(
        seq(
          optional(field("visibility", $.visibility)),
          caseInsensitive("Event"),
          field("name", $.identifier),
          optional(field("parameters", $.parameter_list)),
        ),
      ),

    _procedure_modifier: ($) =>
      choice(
        seq(field("visibility", $.visibility), optional(field("modifiers", $.static_modifier))),
        field("modifiers", $.static_modifier),
      ),

    _procedure_attributes: ($) => repeat1(seq($.attribute_statement, $.newline)),

    end_sub_statement: ($) => seq(caseInsensitive("End"), caseInsensitive("Sub")),

    end_function_statement: ($) => seq(caseInsensitive("End"), caseInsensitive("Function")),

    end_property_statement: ($) => seq(caseInsensitive("End"), caseInsensitive("Property")),

    static_modifier: (_) => caseInsensitive("Static"),

    _dim_keyword: (_) => caseInsensitive("Dim"),

    _redim_keyword: (_) => caseInsensitive("ReDim"),

    with_events_modifier: (_) => caseInsensitive("WithEvents"),

    ptrsafe_modifier: (_) => caseInsensitive("PtrSafe"),

    byval_modifier: (_) => caseInsensitive("ByVal"),

    byref_modifier: (_) => caseInsensitive("ByRef"),

    optional_modifier: (_) => caseInsensitive("Optional"),

    paramarray_modifier: (_) => caseInsensitive("ParamArray"),

    get_accessor: (_) => caseInsensitive("Get"),

    let_accessor: (_) => caseInsensitive("Let"),

    set_accessor: (_) => caseInsensitive("Set"),

    block: ($) => repeat1(choice($._statement_separator, $._statement)),

    conditional_branch_body: ($) =>
      seq($._statement, repeat(choice($._statement_separator, $._statement))),

    _statement: ($) =>
      choice(
        $.single_line_if_statement,
        $.if_statement,
        $.elseif_fragment,
        $.else_fragment,
        $.end_if_fragment,
        $.select_statement,
        $.for_statement,
        alias($._inline_for_statement, $.for_statement),
        $.for_each_statement,
        alias($._inline_for_each_statement, $.for_each_statement),
        $.do_statement,
        alias($._inline_do_statement, $.do_statement),
        $.while_statement,
        $.with_statement,
        alias($._inline_with_statement, $.with_statement),
        $.on_goto_statement,
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
        $.write_statement,
        $.debug_print_statement,
        $.close_statement,
        $.get_statement,
        $.put_statement,
        $.lock_statement,
        $.unlock_statement,
        $.seek_statement,
        $.reset_statement,
        $.raise_event_statement,
        $.name_statement,
        $.stop_statement,
        $.beep_statement,
        $.load_statement,
        $.unload_statement,
        $.preprocessor_const,
        $.preprocessor_if,
        $.def_type_statement,
        $.const_declaration,
        $.variable_declaration,
        $.set_statement,
        $.assignment_statement,
        $.call_statement,
        $.expression_statement,
      ),

    variable_declaration: ($) =>
      choice(
        seq(
          field("visibility", $.visibility),
          field("with_events_modifier", $.with_events_modifier),
          commaSep1($.variable_declarator),
        ),
        seq(
          choice(
            seq(
              optional(field("visibility", $.visibility)),
              choice($._dim_keyword, field("static_modifier", $.static_modifier)),
            ),
            field("visibility", $.visibility),
          ),
          commaSep1($.variable_declarator),
        ),
      ),

    const_declaration: ($) =>
      seq(
        optional(field("visibility", $.visibility)),
        caseInsensitive("Const"),
        commaSep1($.const_declarator),
      ),

    variable_declarator: ($) =>
      choice(
        prec.right(
          1,
          seq(
            field("name", reserved("variable_declarator", $.identifier)),
            field("bounds", $.array_bounds),
            optional(field("type", $.as_type_clause)),
            optional(field("initializer", $.initializer)),
          ),
        ),
        seq(
          field("name", reserved("variable_declarator", $.identifier)),
          optional(field("type", $.as_type_clause)),
          optional(field("initializer", $.initializer)),
        ),
      ),

    const_declarator: ($) =>
      seq(
        field("name", $.identifier),
        optional(field("type", $.as_type_clause)),
        optional(field("initializer", $.initializer)),
      ),

    initializer: ($) => seq("=", field("value", choice($.comparison_expression, $._expression))),

    parameter_list: ($) => seq("(", optional(commaSep1($.parameter)), ")"),

    parameter: ($) =>
      seq(
        optional(field("optional_modifier", $.optional_modifier)),
        optional(field("passing_mode", choice($.byval_modifier, $.byref_modifier))),
        optional(field("paramarray_modifier", $.paramarray_modifier)),
        field("name", $.identifier),
        optional(field("bounds", $.array_bounds)),
        optional(field("type", $.as_type_clause)),
        optional(field("default_value", $.initializer)),
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

    dotted_type_expression: ($) =>
      prec(
        5,
        seq(
          $.identifier,
          repeat1(seq(".", choice($.identifier, alias(caseInsensitive("Line"), $.identifier)))),
        ),
      ),

    visibility: (_) =>
      choice(caseInsensitive("Public"), caseInsensitive("Private"), caseInsensitive("Friend")),

    if_statement: ($) =>
      prec.right(
        seq(
          optional(field("start_line", $.line_number_prefix)),
          caseInsensitive("If"),
          field("condition", $._condition_expression),
          caseInsensitive("Then"),
        ),
      ),

    elseif_fragment: ($) =>
      prec.right(
        seq(
          optional(field("start_line", $.line_number_prefix)),
          caseInsensitive("ElseIf"),
          field("condition", $._condition_expression),
          caseInsensitive("Then"),
        ),
      ),

    else_fragment: ($) =>
      prec.right(seq(optional(field("start_line", $.line_number_prefix)), caseInsensitive("Else"))),

    end_if_fragment: ($) =>
      prec.right(
        seq(
          optional(field("start_line", $.line_number_prefix)),
          caseInsensitive("End"),
          caseInsensitive("If"),
        ),
      ),

    single_line_if_statement: ($) =>
      prec.right(
        seq(
          caseInsensitive("If"),
          field("condition", $._condition_expression),
          caseInsensitive("Then"),
          optional(":"),
          field("consequence", choice($.inline_statement_sequence, $._inline_statement)),
          optional(
            seq(
              caseInsensitive("Else"),
              field("alternative", choice($.inline_statement_sequence, $._inline_statement)),
            ),
          ),
        ),
      ),

    inline_statement_sequence: ($) =>
      prec.left(seq($._inline_statement, repeat1(seq(":", $._inline_statement)))),

    _inline_statement: ($) =>
      choice(
        $.single_line_if_statement,
        $.for_statement,
        alias($._inline_for_statement, $.for_statement),
        $.for_each_statement,
        alias($._inline_for_each_statement, $.for_each_statement),
        $.do_statement,
        alias($._inline_do_statement, $.do_statement),
        $.while_statement,
        $.with_statement,
        alias($._inline_with_statement, $.with_statement),
        $.exit_statement,
        $.end_statement,
        $.on_error_statement,
        $.resume_statement,
        $.goto_statement,
        $.redim_statement,
        $.erase_statement,
        $.open_statement,
        $.input_statement,
        $.line_input_statement,
        $.print_statement,
        $.write_statement,
        $.debug_print_statement,
        $.close_statement,
        $.get_statement,
        $.put_statement,
        $.lock_statement,
        $.unlock_statement,
        $.seek_statement,
        $.reset_statement,
        $.raise_event_statement,
        $.name_statement,
        $.stop_statement,
        $.beep_statement,
        $.load_statement,
        $.unload_statement,
        $.const_declaration,
        $.variable_declaration,
        $.set_statement,
        $.assignment_statement,
        $.call_statement,
        $.expression_statement,
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

    // Separate inline and multiline control forms, then alias them at use sites.
    // This preserves the public CST while limiting recursive parse-state expansion.
    for_statement: ($) => prec.right(seq($._for_header, $._multiline_for_tail)),

    _inline_for_statement: ($) => prec.right(seq($._for_header, $._inline_for_tail)),

    for_each_statement: ($) => prec.right(seq($._for_each_header, $._multiline_for_tail)),

    _inline_for_each_statement: ($) => prec.right(seq($._for_each_header, $._inline_for_tail)),

    _multiline_for_tail: ($) =>
      prec.right(
        choice(
          seq(
            $.newline,
            field(
              "body",
              choice(
                $.for_statement,
                alias($._inline_for_statement, $.for_statement),
                $.for_each_statement,
                alias($._inline_for_each_statement, $.for_each_statement),
              ),
            ),
          ),
          seq(
            $.newline,
            field("body", optional($.block)),
            optional(field("end_line", $.line_number_prefix)),
            caseInsensitive("Next"),
            optional(field("next_variables", $.next_variable_list)),
          ),
        ),
      ),

    _inline_for_tail: ($) =>
      prec.right(
        choice(
          field("body", $.shared_next_for_body),
          seq(
            field("body", optional($.single_line_block)),
            optional(field("end_line", $.line_number_prefix)),
            ":",
            caseInsensitive("Next"),
            optional(field("next_variables", $.next_variable_list)),
          ),
        ),
      ),

    _for_header: ($) =>
      seq(
        optional(field("start_line", $.line_number_prefix)),
        caseInsensitive("For"),
        field("variable", $._assignable_expression),
        "=",
        field("start", $._expression),
        caseInsensitive("To"),
        field("end", $._expression),
        optional(seq(caseInsensitive("Step"), field("step", $._expression))),
      ),

    _for_each_header: ($) =>
      seq(
        optional(field("start_line", $.line_number_prefix)),
        caseInsensitive("For"),
        caseInsensitive("Each"),
        field("variable", $._assignable_expression),
        caseInsensitive("In"),
        field("collection", $._expression),
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

    _inline_do_statement: ($) =>
      prec.right(
        seq(
          optional(field("start_line", $.line_number_prefix)),
          caseInsensitive("Do"),
          optional($.do_condition),
          field("body", optional($.single_line_block)),
          optional(field("end_line", $.line_number_prefix)),
          ":",
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
        $._statement_separator,
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

    _inline_with_statement: ($) =>
      seq(
        optional(field("start_line", $.line_number_prefix)),
        caseInsensitive("With"),
        field("value", $._expression),
        field("body", optional($.single_line_block)),
        optional(field("end_line", $.line_number_prefix)),
        ":",
        caseInsensitive("End"),
        caseInsensitive("With"),
      ),

    single_line_block: ($) => prec.left(repeat1(seq(":", $._inline_statement))),

    shared_next_for_body: ($) =>
      seq(
        ":",
        choice(
          $.for_statement,
          alias($._inline_for_statement, $.for_statement),
          $.for_each_statement,
          alias($._inline_for_each_statement, $.for_each_statement),
        ),
      ),

    next_variable_list: ($) => commaSep1($._assignable_expression),

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

    on_goto_statement: ($) =>
      seq(
        caseInsensitive("On"),
        field("selector", $._expression),
        choice(caseInsensitive("GoTo"), caseInsensitive("GoSub")),
        commaSep1(field("target", choice($.identifier, lineNumber($)))),
      ),

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
      seq(
        caseInsensitive("GoTo"),
        field("target", choice($.identifier, lineNumber($))),
        optional(seq(":", $.newline)),
      ),

    label_statement: ($) => prec(5, seq(field("name", choice($.identifier, lineNumber($))), ":")),

    line_number_prefix: ($) => prec.dynamic(1, prec.right(6, seq(lineNumber($), optional(":")))),

    line_number_statement: ($) =>
      prec.right(
        5,
        choice(
          seq(field("number", lineNumber($)), field("statement", $._numbered_statement)),
          field("number", lineNumber($)),
        ),
      ),

    line_number_top_level_item: ($) =>
      prec.right(
        5,
        choice(
          seq(
            field("number", lineNumber($)),
            optional(":"),
            field(
              "item",
              choice(
                $.sub_declaration,
                $.function_declaration,
                $.property_get_declaration,
                $.property_let_declaration,
                $.property_set_declaration,
              ),
            ),
          ),
          seq(field("number", lineNumber($)), optional(":")),
        ),
      ),

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
        $.def_type_statement,
        $.get_statement,
        $.put_statement,
        $.lock_statement,
        $.unlock_statement,
        $.seek_statement,
        $.reset_statement,
        $.debug_print_statement,
        $.raise_event_statement,
        $.name_statement,
        $.stop_statement,
        $.beep_statement,
        $.load_statement,
        $.unload_statement,
        $.set_statement,
        $.assignment_statement,
        $.call_statement,
        $.expression_statement,
      ),

    redim_statement: ($) =>
      choice(
        $._ambiguous_redim_statement,
        seq($._redim_keyword, optional(caseInsensitive("Preserve")), commaSep1($.redim_declarator)),
      ),

    _ambiguous_redim_statement: (_) =>
      token(prec(2, /[Rr][Ee][Dd][Ii][Mm][^\r\n]*\)[.!][A-Za-z_][A-Za-z0-9_]*\([^\r\n]*\)/)),

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
        optional(field("lock", $.file_lock)),
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
        caseInsensitive("Shared"),
        seq(
          caseInsensitive("Lock"),
          choice(
            caseInsensitive("Read"),
            caseInsensitive("Write"),
            seq(caseInsensitive("Read"), caseInsensitive("Write")),
          ),
        ),
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
        3,
        seq(
          caseInsensitive("Print"),
          field("number", alias($._required_file_number, $.file_number)),
          optional(seq(",", optional(field("output", $.output_list)))),
        ),
      ),

    write_statement: ($) =>
      prec.right(
        3,
        seq(
          caseInsensitive("Write"),
          field("number", alias($._required_file_number, $.file_number)),
          optional(seq(",", optional(field("output", $.output_list)))),
        ),
      ),

    _required_file_number: ($) => $.file_number_literal,

    output_list: ($) =>
      prec.right(
        seq(
          field("value", $._print_output_expression),
          repeat(
            seq(field("position", $.char_position), field("value", $._print_output_expression)),
          ),
          optional(field("position", $.char_position)),
        ),
      ),

    _print_method_output_list: ($) =>
      prec.right(
        seq(
          field("value", $._unparenthesized_print_output_expression),
          repeat(
            seq(field("position", $.char_position), field("value", $._print_output_expression)),
          ),
          optional(field("position", $.char_position)),
        ),
      ),

    _print_output_expression: ($) =>
      choice($._unparenthesized_print_output_expression, $.parenthesized_expression),

    _unparenthesized_print_output_expression: ($) =>
      choice(
        prec.dynamic(65, alias($._print_output_call_binary_expression, $.binary_expression)),
        prec.dynamic(
          60,
          alias($._print_output_member_comparison_expression, $.comparison_expression),
        ),
        prec.dynamic(55, $.binary_expression),
        prec.dynamic(50, $.logical_value_expression),
        prec.dynamic(40, $.comparison_expression),
        prec.dynamic(
          30,
          alias($._print_output_call_member_expression, $.qualified_member_expression),
        ),
        prec.dynamic(5, $.member_expression),
        prec.dynamic(10, alias($._print_output_call_expression, $.call_expression)),
        $._literal,
        $.file_number_literal,
        alias(caseInsensitive("Line"), $.identifier),
        alias(caseInsensitive("Name"), $.identifier),
        $.identifier,
        $.new_expression,
        $.addressof_expression,
        $.type_of_expression,
        $.unary_expression,
      ),

    _print_output_call_binary_expression: ($) =>
      choice(
        prec.right(14, seq($._print_output_call_operand, "^", $._expression)),
        prec.left(12, seq($._print_output_call_operand, choice("*", "/"), $._expression)),
        prec.left(11, seq($._print_output_call_operand, "\\", $._expression)),
        prec.left(10, seq($._print_output_call_operand, caseInsensitive("Mod"), $._expression)),
        prec.left(9, seq($._print_output_call_operand, choice("+", "-"), $._expression)),
        prec.left(8, seq($._print_output_call_operand, "&", $._expression)),
        prec.left(5, seq($._print_output_call_operand, caseInsensitive("And"), $._expression)),
        prec.left(4, seq($._print_output_call_operand, caseInsensitive("Or"), $._expression)),
        prec.left(3, seq($._print_output_call_operand, caseInsensitive("Xor"), $._expression)),
        prec.left(2, seq($._print_output_call_operand, caseInsensitive("Eqv"), $._expression)),
        prec.left(1, seq($._print_output_call_operand, caseInsensitive("Imp"), $._expression)),
      ),

    _print_output_call_operand: ($) =>
      choice(
        alias($._print_output_call_member_expression, $.qualified_member_expression),
        alias($._print_output_call_expression, $.call_expression),
      ),

    _print_output_member_comparison_expression: ($) =>
      prec.left(
        7,
        seq(
          field(
            "left",
            alias($._print_output_call_member_expression, $.qualified_member_expression),
          ),
          field("operator", $.comparison_operator),
          field("right", $._expression),
        ),
      ),

    _print_output_call_member_expression: ($) =>
      prec.left(
        4,
        seq(
          field(
            "receiver",
            choice(
              alias($._print_output_call_expression, $.call_expression),
              alias($._print_output_call_member_expression, $.qualified_member_expression),
            ),
          ),
          field("operator", choice(".", "!")),
          field("member", $._member_property),
        ),
      ),

    _print_output_call_expression: ($) =>
      choice(
        prec(
          25,
          seq(
            field(
              "function",
              alias($._print_output_call_member_expression, $.qualified_member_expression),
            ),
            field("arguments", $.argument_list),
          ),
        ),
        prec(
          20,
          seq(
            field(
              "function",
              alias($._print_output_qualified_callable, $.qualified_member_expression),
            ),
            field("arguments", $.argument_list),
          ),
        ),
        prec(
          3,
          seq(field("function", $._callable_expression), field("arguments", $.argument_list)),
        ),
      ),

    _print_output_qualified_callable: ($) =>
      prec.left(
        20,
        seq(
          field("receiver", choice($.identifier, $.call_expression, $.member_expression)),
          field("operator", choice(".", "!")),
          field("member", $._member_property),
        ),
      ),

    char_position: (_) => choice(";", ","),

    print_argument_sequence: ($) =>
      seq($._expression, repeat(seq(choice(",", ";"), $._expression))),

    debug_print_statement: ($) => prec.right(seq("?", optional(field("output", $.output_list)))),

    close_statement: ($) =>
      prec.right(seq(caseInsensitive("Close"), optional(commaSep1($.file_number)))),

    get_statement: ($) =>
      seq(
        caseInsensitive("Get"),
        field("number", $.file_number),
        optional(
          seq(
            ",",
            optional(field("record", $._expression)),
            ",",
            field("target", $._assignable_expression),
          ),
        ),
      ),

    put_statement: ($) =>
      seq(
        caseInsensitive("Put"),
        field("number", $.file_number),
        optional(
          seq(",", optional(field("record", $._expression)), ",", field("source", $._expression)),
        ),
      ),

    lock_statement: ($) =>
      seq(
        caseInsensitive("Lock"),
        field("number", $.file_number),
        optional(seq(",", field("range", $.file_record_range))),
      ),

    unlock_statement: ($) =>
      seq(
        caseInsensitive("Unlock"),
        field("number", $.file_number),
        optional(seq(",", field("range", $.file_record_range))),
      ),

    file_record_range: ($) =>
      seq(
        field("start", $._expression),
        optional(seq(caseInsensitive("To"), field("end", $._expression))),
      ),

    seek_statement: ($) =>
      seq(
        caseInsensitive("Seek"),
        field("number", $.file_number),
        ",",
        field("position", $._expression),
      ),

    reset_statement: (_) => caseInsensitive("Reset"),

    raise_event_statement: ($) =>
      prec.right(
        seq(caseInsensitive("RaiseEvent"), field("event", $.identifier), optional($.argument_list)),
      ),

    name_statement: ($) =>
      prec(
        1,
        seq(
          caseInsensitive("Name"),
          field("old_path", $._expression),
          caseInsensitive("As"),
          field("new_path", $._expression),
        ),
      ),

    stop_statement: (_) => caseInsensitive("Stop"),

    beep_statement: (_) => caseInsensitive("Beep"),

    load_statement: ($) => seq(caseInsensitive("Load"), field("target", $._assignable_expression)),

    unload_statement: ($) =>
      seq(caseInsensitive("Unload"), field("target", $._assignable_expression)),

    def_type_statement: ($) =>
      seq(
        field(
          "kind",
          choice(
            caseInsensitive("DefBool"),
            caseInsensitive("DefByte"),
            caseInsensitive("DefCur"),
            caseInsensitive("DefDate"),
            caseInsensitive("DefDbl"),
            caseInsensitive("DefDec"),
            caseInsensitive("DefInt"),
            caseInsensitive("DefLng"),
            caseInsensitive("DefLngLng"),
            caseInsensitive("DefLngPtr"),
            caseInsensitive("DefObj"),
            caseInsensitive("DefSng"),
            caseInsensitive("DefStr"),
            caseInsensitive("DefVar"),
          ),
        ),
        commaSep1($.letter_range),
      ),

    letter_range: ($) =>
      prec.right(seq(field("start", $.identifier), optional(seq("-", field("end", $.identifier))))),

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

    coordinate_pair: ($) =>
      prec(
        2,
        seq(
          "(",
          field("x", choice($.comparison_expression, $._expression)),
          ",",
          field("y", choice($.comparison_expression, $._expression)),
          ")",
        ),
      ),

    call_statement: ($) =>
      choice(
        $._ambiguous_call_statement,
        prec.dynamic(4, field("callee", alias($._print_method_call_expression, $.call_expression))),
        prec.dynamic(3, prec.right(field("callee", $._print_method_callee))),
        prec.dynamic(
          2,
          prec.right(
            1,
            seq(
              field("callee", $._print_method_callee),
              field("arguments", alias($._print_method_output_list, $.output_list)),
            ),
          ),
        ),
        prec.right(
          1,
          choice(
            seq(
              caseInsensitive("Call"),
              field("callee", choice($.identifier, $.member_expression)),
              optional(field("arguments", $.argument_list)),
            ),
            seq(
              field("callee", alias($._line_method_expression, $.qualified_member_expression)),
              field("arguments", $.line_range_argument_list),
            ),
            field("callee", $._callable_expression),
            seq(
              field("callee", $._callable_expression),
              field("arguments", choice($.argument_list, $.unparenthesized_argument_list)),
            ),
            field("callee", $.call_expression),
          ),
        ),
      ),

    _ambiguous_call_statement: (_) =>
      token(
        prec(
          2,
          choice(
            /[A-Za-z_][A-Za-z0-9_]*[ \t]+\.[A-Za-z_][A-Za-z0-9_]*[ \t]*,[^\r\n]*_[ \t]*\r?\n[ \t]*,[^\r\n]*/,
            /[A-Za-z_][A-Za-z0-9_]*[ \t]+\.[A-Za-z_][A-Za-z0-9_]*[ \t]*,[^\r\n]*/,
            /[A-Za-z_][A-Za-z0-9_]*[ \t]+[A-Za-z_][A-Za-z0-9_]*[ \t]*,[ \t]*,[ \t]*[A-Za-z_][A-Za-z0-9_]*[ \t]*,[ \t]*[A-Za-z_][A-Za-z0-9_]*[ \t]*:=[ \t]*[A-Za-z0-9_]+[ \t]*,[ \t]*[A-Za-z_][A-Za-z0-9_]*[ \t]*:=[ \t]*[A-Za-z0-9_]+/,
          ),
        ),
      ),

    expression_statement: ($) => $._expression,

    argument_list: ($) => seq("(", optional($._argument_sequence), ")"),

    unparenthesized_argument_list: ($) => $._unparenthesized_argument_sequence,

    line_range_argument_list: ($) =>
      seq(
        optional(caseInsensitive("Step")),
        field("start", $.coordinate_pair),
        optional(caseInsensitive("Step")),
        "-",
        field("end", $.coordinate_pair),
        optional(seq(",", $.print_argument_sequence)),
      ),

    _argument_sequence: ($) =>
      choice(
        prec(1, commaSep1($._argument)),
        prec.right(seq(optional($._argument), repeat1(seq(",", optional($._argument))))),
      ),

    _unparenthesized_argument_sequence: ($) =>
      choice(
        prec(2, $._omitted_argument_sequence),
        commaSep1($._argument),
        seq($._argument, repeat1(seq(";", $._argument))),
      ),

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
      choice(
        $.byval_argument,
        $.named_argument,
        $.logical_value_expression,
        $.comparison_expression,
        $._expression,
      ),

    named_argument: ($) =>
      prec(
        1,
        seq(
          field("name", choice($.identifier, alias(caseInsensitive("Name"), $.identifier))),
          ":=",
          field(
            "value",
            choice($.logical_value_expression, $.comparison_expression, $._expression),
          ),
        ),
      ),

    byval_argument: ($) =>
      seq(caseInsensitive("ByVal"), field("value", choice($.comparison_expression, $._expression))),

    _condition_expression: ($) =>
      choice(
        $.condition_binary_expression,
        $.comparison_expression,
        $.parenthesized_condition_expression,
        $._expression,
      ),

    _primary_expression: ($) =>
      choice(
        $._literal,
        $.file_number_literal,
        $.call_expression,
        $.member_expression,
        alias(caseInsensitive("Line"), $.identifier),
        alias(caseInsensitive("Name"), $.identifier),
        $.identifier,
        $.new_expression,
        $.addressof_expression,
        $.type_of_expression,
        $.parenthesized_expression,
      ),

    _expression: ($) => choice($._primary_expression, $.binary_expression, $.unary_expression),

    comparison_expression: ($) =>
      prec.left(
        7,
        seq(
          field("left", $._comparison_operand),
          field("operator", $.comparison_operator),
          field("right", $._expression),
        ),
      ),

    comparison_operator: (_) =>
      choice("=", "<>", "<", "<=", ">", ">=", caseInsensitive("Is"), caseInsensitive("Like")),

    _comparison_operand: ($) =>
      choice($._primary_expression, $._signed_unary_expression, $.binary_expression),

    logical_value_expression: ($) =>
      prec.dynamic(
        1,
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
            5,
            seq(
              $.logical_value_expression,
              caseInsensitive("And"),
              choice($.comparison_expression, $._expression),
            ),
          ),
          prec.left(
            4,
            seq(
              choice($.comparison_expression, $._expression),
              caseInsensitive("Or"),
              $.comparison_expression,
            ),
          ),
          prec.left(4, seq($.comparison_expression, caseInsensitive("Or"), $._expression)),
          prec.left(
            4,
            seq(
              $.logical_value_expression,
              caseInsensitive("Or"),
              choice($.comparison_expression, $._expression),
            ),
          ),
        ),
      ),

    condition_binary_expression: ($) =>
      choice(
        prec.left(5, seq($._condition_expression, caseInsensitive("And"), $._condition_expression)),
        prec.left(4, seq($._condition_expression, caseInsensitive("Or"), $._condition_expression)),
        prec.left(3, seq($._condition_expression, caseInsensitive("Xor"), $._condition_expression)),
        prec.left(2, seq($._condition_expression, caseInsensitive("Eqv"), $._condition_expression)),
        prec.left(1, seq($._condition_expression, caseInsensitive("Imp"), $._condition_expression)),
      ),

    parenthesized_condition_expression: ($) =>
      prec.dynamic(1, seq("(", $._condition_expression, ")")),

    _assignable_expression: ($) =>
      choice(
        $._callable_expression,
        $.call_expression,
        alias(caseInsensitive("Line"), $.identifier),
      ),

    _callable_expression: ($) =>
      choice($.identifier, alias(caseInsensitive("Name"), $.identifier), $.member_expression),

    _print_method_callee: ($) =>
      choice(
        alias(caseInsensitive("Print"), $.identifier),
        alias($._qualified_print_method_expression, $.qualified_member_expression),
        alias($._implicit_print_method_expression, $.implicit_member_expression),
      ),

    _print_method_call_expression: ($) =>
      prec(7, seq(field("function", $._print_method_callee), field("arguments", $.argument_list))),

    _qualified_print_method_expression: ($) =>
      prec(
        7,
        seq(
          field("receiver", choice($.identifier, $.call_expression, $.member_expression)),
          field("operator", "."),
          field("member", alias(caseInsensitive("Print"), $.identifier)),
        ),
      ),

    _implicit_print_method_expression: ($) =>
      prec(
        7,
        seq(field("operator", "."), field("member", alias(caseInsensitive("Print"), $.identifier))),
      ),

    _line_method_expression: ($) =>
      prec(
        7,
        seq(
          field("receiver", choice($.identifier, $.call_expression, $.member_expression)),
          field("operator", "."),
          field("member", alias(caseInsensitive("Line"), $.identifier)),
        ),
      ),

    call_expression: ($) =>
      prec(
        2,
        choice(
          seq(field("function", $._callable_expression), field("arguments", $.argument_list)),
          seq(field("function", $.call_expression), field("arguments", $.argument_list)),
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

    member_expression: ($) => choice($.qualified_member_expression, $.implicit_member_expression),

    qualified_member_expression: ($) =>
      prec.left(
        3,
        seq(
          field("receiver", choice($.identifier, $.call_expression, $.member_expression)),
          field("operator", choice(".", "!")),
          field("member", $._member_property),
        ),
      ),

    implicit_member_expression: ($) =>
      prec.left(3, seq(field("operator", choice(".", "!")), field("member", $._member_property))),

    _member_property: ($) =>
      prec(6, choice($.identifier, alias(caseInsensitive("Line"), $.identifier))),

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
        prec.left(5, seq($._expression, caseInsensitive("And"), $._expression)),
        prec.left(4, seq($._expression, caseInsensitive("Or"), $._expression)),
        prec.left(3, seq($._expression, caseInsensitive("Xor"), $._expression)),
        prec.left(2, seq($._expression, caseInsensitive("Eqv"), $._expression)),
        prec.left(1, seq($._expression, caseInsensitive("Imp"), $._expression)),
      ),

    unary_expression: ($) =>
      choice(
        $._signed_unary_expression,
        prec(6, seq(caseInsensitive("Not"), choice($.comparison_expression, $._expression))),
      ),

    _signed_unary_expression: ($) => prec(13, seq(choice("+", "-"), $._expression)),

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

    number_literal: (_) =>
      token(
        choice(
          /-?&[Hh][0-9A-Fa-f]+[$%&!#@^]?/,
          /-?(?:\d+\.\d*|\.\d+|\d+)(?:[Ee][+-]?\d+)?[$%&!#@^]?/,
        ),
      ),

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
          /[A-Za-z_\u00C0-\u{10FFFF}][A-Za-z0-9_\u00C0-\u{10FFFF}]*[$%&#@^]?/u,
          prec(-1, /[A-Za-z_\u00C0-\u{10FFFF}][A-Za-z0-9_\u00C0-\u{10FFFF}]*!/u),
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
