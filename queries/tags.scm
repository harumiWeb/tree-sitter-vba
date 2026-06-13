(sub_declaration
  name: (identifier) @name) @definition.function

(function_declaration
  name: (identifier) @name) @definition.function

(property_declaration
  name: (identifier) @name) @definition.method

(type_declaration
  name: (identifier) @name) @definition.type

(enum_declaration
  name: (identifier) @name) @definition.enum

(declare_statement
  name: (identifier) @name) @definition.function

(label_statement
  name: (identifier) @name) @definition.label

(label_statement
  name: (line_number_literal) @name) @definition.label

(line_number_statement
  number: (line_number_literal) @name) @definition.label

(variable_declarator
  name: (identifier) @name) @definition.var

(const_declarator
  name: (identifier) @name) @definition.constant
