/**
 * @file Tree-sitter grammar for Visual Basic 6 (VB6) - entry point
 * @license MIT
 *
 * The statement grammar is shared with VBA; see ../common/define-grammar.js.
 * This dialect adds the .frm/.ctl form header and the .cls class header as
 * written by the VB6 IDE, and drops the VBA7-only constructs (PtrSafe,
 * LongPtr/LongLong, DefLngPtr/DefLngLng).
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = require("../common/define-grammar")("vb6");
