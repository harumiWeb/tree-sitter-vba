// External scanner for the VB6 dialect.
//
// One job: tell a dot (or bang) that touches the token before it from one that
// follows whitespace. VB6 reads `Foo .Bar, x` as a call to Foo with two
// arguments and `Foo.Bar , x` as a call to Foo.Bar with an omitted first
// argument; the grammar cannot see the space, so the scanner emits four tokens
// and the grammar chains members only on the immediate ones. A dot after a
// line continuation counts as immediate, because `x("y") _` / `    .Add(...)`
// is a chain. A dot followed by a digit is left to the internal lexer (`.5`).
//
// The scanner carries no state: serialize/deserialize are no-ops.

#include "tree_sitter/parser.h"

enum TokenType {
  DOT_IMMEDIATE,
  DOT_SPACED,
  BANG_IMMEDIATE,
  BANG_SPACED,
};

void *tree_sitter_vb6_external_scanner_create(void) { return NULL; }
void tree_sitter_vb6_external_scanner_destroy(void *payload) {}
unsigned tree_sitter_vb6_external_scanner_serialize(void *payload, char *buffer) { return 0; }
void tree_sitter_vb6_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {}

static bool is_blank(int32_t c) { return c == ' ' || c == '\t' || c == '\f'; }

bool tree_sitter_vb6_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  if (!(valid_symbols[DOT_IMMEDIATE] || valid_symbols[DOT_SPACED] ||
        valid_symbols[BANG_IMMEDIATE] || valid_symbols[BANG_SPACED])) {
    return false;
  }

  bool spaced = false;
  for (;;) {
    if (is_blank(lexer->lookahead)) {
      spaced = true;
      lexer->advance(lexer, true);
      continue;
    }
    if (lexer->lookahead == '_') {
      // A line continuation is `_`, optional blanks, then a newline. Anything
      // else starting with `_` is an identifier and not ours; the lexer
      // position is reset when we return false.
      lexer->advance(lexer, true);
      while (is_blank(lexer->lookahead)) lexer->advance(lexer, true);
      if (lexer->lookahead == '\r') lexer->advance(lexer, true);
      if (lexer->lookahead != '\n') return false;
      lexer->advance(lexer, true);
      // The continued line's indentation does not count as spacing.
      while (is_blank(lexer->lookahead)) lexer->advance(lexer, true);
      spaced = false;
      continue;
    }
    break;
  }

  if (lexer->lookahead == '.') {
    lexer->advance(lexer, false);
    if (lexer->lookahead >= '0' && lexer->lookahead <= '9') return false;
    lexer->result_symbol = spaced ? DOT_SPACED : DOT_IMMEDIATE;
    return valid_symbols[lexer->result_symbol];
  }
  if (lexer->lookahead == '!') {
    lexer->advance(lexer, false);
    lexer->result_symbol = spaced ? BANG_SPACED : BANG_IMMEDIATE;
    return valid_symbols[lexer->result_symbol];
  }
  return false;
}
