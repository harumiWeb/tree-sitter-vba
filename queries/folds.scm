[
  "Attribute"
  "Option"
  "Explicit"
  "Private"
  "Public"
  "Friend"
  "Sub"
  "Function"
  "Property"
  "Get"
  "Let"
  "Set"
  "End"
  "Dim"
  "Static"
  "Const"
  "As"
  "ByVal"
  "ByRef"
  "Optional"
  "ParamArray"
  "Call"
] @keyword

[
  "String"
  "Boolean"
  "Byte"
  "Integer"
  "Long"
  "LongLong"
  "LongPtr"
  "Single"
  "Double"
  "Currency"
  "Date"
  "Variant"
  "Object"
] @type.builtin

(comment) @comment

(string_literal) @string
(number_literal) @number
(boolean_literal) @constant.builtin

(sub_declaration
  name: (identifier) @function)

(function_declaration
  name: (identifier) @function)

(property_declaration
  name: (identifier) @function)

(parameter
  name: (identifier) @variable.parameter)

(variable_declarator
  name: (identifier) @variable)

(const_declarator
  name: (identifier) @constant)

(type_expression
  (identifier) @type)

(attribute_statement
  name: (identifier) @property)