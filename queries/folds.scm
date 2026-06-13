(sub_declaration
  body: (block) @fold)

(function_declaration
  body: (block) @fold)

(property_declaration
  body: (block) @fold)

(if_statement
  consequence: (block) @fold)

(select_statement) @fold

(for_statement
  body: (block) @fold)

(for_each_statement
  body: (block) @fold)

(do_statement
  body: (block) @fold)

(with_statement
  body: (block) @fold)

(frm_begin_block) @fold
