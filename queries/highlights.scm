(comment) @comment

(string_literal) @string
(number_literal) @number
(boolean_literal) @constant.builtin

(attribute_statement) @keyword
(option_statement) @keyword
(visibility) @keyword
(procedure_modifier) @keyword
(as_type_clause) @keyword

(if_statement) @keyword
(elseif_clause) @keyword
(else_clause) @keyword
(select_statement) @keyword
(case_clause) @keyword
(for_statement) @keyword
(for_each_statement) @keyword
(do_statement) @keyword
(do_condition) @keyword
(with_statement) @keyword
(set_statement) @keyword

(type_expression) @type

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
