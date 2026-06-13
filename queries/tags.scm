(sub_declaration
  name: (identifier) @name) @definition.function

(function_declaration
  name: (identifier) @name) @definition.function

(property_declaration
  name: (identifier) @name) @definition.method

(variable_declarator
  name: (identifier) @name) @definition.var

(const_declarator
  name: (identifier) @name) @definition.constant