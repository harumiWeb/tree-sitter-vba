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

(variable_declarator
  name: (identifier) @name) @definition.var

(const_declarator
  name: (identifier) @name) @definition.constant
