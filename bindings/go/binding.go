package tree_sitter_vba

// #cgo CFLAGS: -std=c11 -I../../src
// #cgo !windows CFLAGS: -fPIC
// #include "tree_sitter/parser.h"
// const TSLanguage *tree_sitter_vba(void);
import "C"
import "unsafe"

// Language returns the tree-sitter Language for this grammar.
func Language() unsafe.Pointer {
	return unsafe.Pointer(C.tree_sitter_vba())
}
