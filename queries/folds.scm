(sub_declaration
  body: (block) @fold)

(function_declaration
  body: (block) @fold)

(property_declaration
  body: (block) @fold)

(type_declaration) @fold

(enum_declaration) @fold

(preprocessor_if) @fold

(if_statement
  consequence: (block) @fold)

(elseif_clause
  body: (block) @fold)

(else_clause
  body: (block) @fold)

(select_statement) @fold

(for_statement
  body: (block) @fold)

(for_each_statement
  body: (block) @fold)

(do_statement
  body: (block) @fold)

(while_statement
  body: (block) @fold)

(with_statement
  body: (block) @fold)

(frm_begin_block) @fold

(frm_begin_property_block) @fold
