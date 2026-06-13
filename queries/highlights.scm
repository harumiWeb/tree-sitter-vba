(comment) @comment

(string_literal) @string
(number_literal) @number
(boolean_literal) @constant.builtin
(nothing_literal) @constant.builtin
(null_literal) @constant.builtin
(empty_literal) @constant.builtin
(guid_literal) @constant.builtin

(attribute_statement) @keyword
(option_statement) @keyword
(type_declaration) @keyword
(enum_declaration) @keyword
(declare_statement) @keyword
(preprocessor_const) @keyword
(preprocessor_if) @keyword
(preprocessor_elseif) @keyword
(preprocessor_else) @keyword
(visibility) @keyword
(procedure_modifier) @keyword
(as_type_clause) @keyword
(line_continuation) @punctuation.special

(if_statement) @keyword
(single_line_if_statement) @keyword
(elseif_clause) @keyword
(else_clause) @keyword
(select_statement) @keyword
(case_clause) @keyword
(for_statement) @keyword
(for_each_statement) @keyword
(do_statement) @keyword
(do_condition) @keyword
(while_statement) @keyword
(with_statement) @keyword
(exit_statement) @keyword
(on_error_statement) @keyword
(resume_statement) @keyword
(goto_statement) @keyword
(redim_statement) @keyword
(set_statement) @keyword
(new_expression) @keyword
(addressof_expression) @keyword
(condition_binary_expression) @operator
(comparison_expression) @operator
(case_expression) @keyword

(type_expression) @type
(dotted_type_expression) @type

(type_declaration
  name: (identifier) @type)

(enum_declaration
  name: (identifier) @type)

(type_member
  name: (identifier) @property)

(enum_member
  name: (identifier) @constant)

(label_statement
  name: (identifier) @label)

(named_argument
  name: (identifier) @variable.parameter)

(addressof_expression
  target: (identifier) @function)

(declare_statement
  name: (identifier) @function)

(sub_declaration
  name: (identifier) @function)

(function_declaration
  name: (identifier) @function)

(property_declaration
  name: (identifier) @function)

(call_statement
  callee: (identifier) @function.call)

(call_statement
  callee: (member_expression
    property: (identifier) @function.method.call))

(call_expression
  function: (identifier) @function.call)

(call_expression
  function: (member_expression
    property: (identifier) @function.method.call))

(parameter
  name: (identifier) @variable.parameter)

(variable_declarator
  name: (identifier) @variable)

(const_declarator
  name: (identifier) @constant)

(member_expression
  property: (identifier) @property)

(attribute_statement
  name: (identifier) @property)

(frm_begin_block
  name: (identifier) @type)

(frm_property_statement
  name: (_) @property)
