package tree_sitter_vba_test

import (
	"testing"

	tree_sitter_vba "github.com/harumiWeb/tree-sitter-vba/bindings/go"
	tree_sitter "github.com/tree-sitter/go-tree-sitter"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_vba.Language())
	if language == nil {
		t.Fatal("failed to load VBA grammar")
	}
}
