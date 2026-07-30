import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import {
  Decoration,
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers,
  WidgetType,
} from "@codemirror/view";
import { Language, Parser, Query } from "./vendor/web-tree-sitter.js";
import {
  buildHighlightRanges,
  buildTreeModel,
  collectNodeKeys,
  collectRecoveryNodes,
  findSmallestContainingNode,
  formatSExpression,
  formatTreeText,
  initialExpandedNodeKeys,
} from "./parser-presentation.mjs";
import { createSourcePositionIndex } from "./source-positions.mjs";

const exampleSelect = document.querySelector("#example-select");
const fileInput = document.querySelector("#file-input");
const loadFileButton = document.querySelector("#load-file-button");
const fileStatus = document.querySelector("#file-status");
const encodingSelect = document.querySelector("#encoding-select");
const resetButton = document.querySelector("#reset-button");
const version = document.querySelector("#version");
const status = document.querySelector("#parse-status");
const errorCount = document.querySelector("#error-count");
const missingCount = document.querySelector("#missing-count");
const parseTime = document.querySelector("#parse-time");
const sourceName = document.querySelector("#source-name");
const treeOutput = document.querySelector("#tree-output");
const treeButton = document.querySelector("#tree-mode-button");
const sexprButton = document.querySelector("#sexpr-mode-button");
const expandButton = document.querySelector("#expand-tree-button");
const collapseButton = document.querySelector("#collapse-tree-button");
const copyButton = document.querySelector("#copy-tree-button");
const copyStatus = document.querySelector("#copy-status");
const recoverySummary = document.querySelector("#recovery-summary");
const recoveryPanel = document.querySelector("#recovery-panel");
const recoveryList = document.querySelector("#recovery-list");
const reporting = document.querySelector("#reporting");

const replaceDecorations = StateEffect.define();
const decorationField = StateField.define({
  create: () => Decoration.none,
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(replaceDecorations)) return effect.value;
    }
    return transaction.docChanged ? value.map(transaction.changes) : value;
  },
  provide: (field) => EditorView.decorations.from(field),
});

class MissingMarker extends WidgetType {
  toDOM() {
    const marker = document.createElement("span");
    marker.className = "cm-missing-marker";
    marker.setAttribute("aria-hidden", "true");
    return marker;
  }
}

let parser;
let highlightQuery;
let editor;
let examples = [];
let currentModel;
let treeMode = "tree";
let parseTimer;
let exampleLoadController;
let contentRequestGeneration = 0;
let replacingSource = false;
let selectingExplicitNode = false;
let activeNodeKey;
const expandedNodeKeys = new Set();

function asset(path) {
  return new URL(path, import.meta.url).href;
}

function setStatus(message, kind) {
  status.textContent = message;
  status.className = `status ${kind}`;
}

function beginContentRequest() {
  contentRequestGeneration += 1;
  exampleLoadController?.abort();
  exampleLoadController = undefined;
  return contentRequestGeneration;
}

function sourceText() {
  return editor.state.doc.toString();
}

function setSource(text, name) {
  replacingSource = true;
  editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: text } });
  replacingSource = false;
  sourceName.textContent = name;
}

function setFileStatus(name = "No file selected") {
  fileStatus.textContent = name;
}

function makeDecorations(highlights, recovery) {
  const decorations = highlights.map((highlight) =>
    Decoration.mark({ class: highlight.className }).range(highlight.from, highlight.to),
  );

  for (const node of recovery) {
    if (node.recovery === "ERROR" && node.startIndex < node.endIndex) {
      decorations.push(
        Decoration.mark({ class: "cm-recovery-error" }).range(node.startIndex, node.endIndex),
      );
    }
    if (node.recovery === "MISSING") {
      decorations.push(
        Decoration.widget({ widget: new MissingMarker(), side: 1 }).range(node.startIndex),
      );
    }
  }

  return Decoration.set(decorations, true);
}

function updateTreeModeButtons() {
  const treeSelected = treeMode === "tree";
  treeButton.setAttribute("aria-pressed", String(treeSelected));
  sexprButton.setAttribute("aria-pressed", String(!treeSelected));
  expandButton.disabled = !treeSelected || !currentModel;
  collapseButton.disabled = !treeSelected || !currentModel;
  copyButton.disabled = !currentModel;
}

function selectNode(node) {
  if (!node || !editor) return;
  const documentLength = editor.state.doc.length;
  const from = Math.min(node.startIndex, documentLength);
  const to = Math.min(Math.max(node.endIndex, from), documentLength);
  activeNodeKey = node.key;
  selectingExplicitNode = true;
  editor.dispatch({ selection: { anchor: from, head: to }, scrollIntoView: true });
  selectingExplicitNode = false;
  updateSelectedTreeNode();
}

function updateSelectedTreeNode() {
  for (const button of treeOutput.querySelectorAll("[data-node-key]")) {
    button.classList.toggle("selected", button.dataset.nodeKey === activeNodeKey);
  }
}

function renderTreeNode(node) {
  const item = document.createElement("li");
  item.className = `tree-item${node.recovery ? ` recovery-${node.recovery.toLowerCase()}` : ""}`;
  const row = document.createElement("div");
  row.className = "tree-row";

  if (node.children.length > 0) {
    const toggle = document.createElement("button");
    const branchId = `tree-branch-${node.key}`;
    const expanded = expandedNodeKeys.has(node.key);
    toggle.type = "button";
    toggle.className = "tree-toggle";
    toggle.textContent = expanded ? "−" : "+";
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.setAttribute("aria-controls", branchId);
    toggle.setAttribute("aria-label", `${expanded ? "Collapse" : "Expand"} ${node.type}`);
    toggle.addEventListener("click", () => {
      if (expandedNodeKeys.has(node.key)) {
        expandedNodeKeys.delete(node.key);
      } else {
        expandedNodeKeys.add(node.key);
      }
      renderTree();
    });
    row.append(toggle);
  } else {
    const spacer = document.createElement("span");
    spacer.className = "tree-toggle-spacer";
    spacer.setAttribute("aria-hidden", "true");
    row.append(spacer);
  }

  if (node.fieldName) {
    const field = document.createElement("span");
    field.className = "tree-field";
    field.textContent = `${node.fieldName}:`;
    row.append(field);
  }

  const label = document.createElement("button");
  label.type = "button";
  label.className = "tree-node";
  label.dataset.nodeKey = node.key;
  label.textContent = node.type;
  label.addEventListener("click", () => selectNode(node));
  row.append(label);

  if (node.recovery) {
    const badge = document.createElement("span");
    badge.className = "tree-recovery-badge";
    badge.textContent = node.recovery;
    row.append(badge);
  }

  item.append(row);

  if (node.children.length > 0 && expandedNodeKeys.has(node.key)) {
    const children = document.createElement("ul");
    children.id = `tree-branch-${node.key}`;
    children.className = "tree-children";
    for (const child of node.children) children.append(renderTreeNode(child));
    item.append(children);
  }
  return item;
}

function renderTree() {
  treeOutput.replaceChildren();
  if (!currentModel) {
    treeOutput.textContent = "Parser is loading…";
    return;
  }

  if (treeMode === "sexpr") {
    const output = document.createElement("pre");
    output.className = "sexpr-output";
    output.textContent = formatSExpression(currentModel);
    treeOutput.append(output);
    return;
  }

  const tree = document.createElement("ul");
  tree.className = "syntax-tree";
  tree.append(renderTreeNode(currentModel));
  treeOutput.append(tree);
  updateSelectedTreeNode();
}

function renderRecovery(recovery) {
  recoveryList.replaceChildren();
  const hasRecovery = recovery.length > 0;
  recoveryPanel.hidden = !hasRecovery;
  reporting.hidden = !hasRecovery;
  recoverySummary.textContent = hasRecovery
    ? `${recovery.length} recovery node${recovery.length === 1 ? "" : "s"}`
    : "No recovery nodes";
  recoverySummary.classList.toggle("has-recovery", hasRecovery);

  for (const node of recovery) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const start = `${node.start.row + 1}:${node.start.column + 1}`;
    const end = `${node.end.row + 1}:${node.end.column + 1}`;
    button.type = "button";
    button.textContent = `${node.recovery} — ${start}–${end} (text offset ${node.startIndex}–${node.endIndex})`;
    button.addEventListener("click", () => selectNode(node));
    item.append(button);
    recoveryList.append(item);
  }
}

function parseSource() {
  if (!parser || !highlightQuery) return;

  const text = sourceText();
  const startedAt = performance.now();
  const tree = parser.parse(text);
  if (!tree) {
    setStatus("Parser did not return a syntax tree", "failed");
    return;
  }

  try {
    const positions = createSourcePositionIndex(text);
    const model = buildTreeModel(tree.rootNode, positions);
    const recovery = collectRecoveryNodes(model);
    const highlights = buildHighlightRanges(highlightQuery, tree.rootNode, positions);
    const elapsed = performance.now() - startedAt;

    currentModel = model;
    activeNodeKey = undefined;
    expandedNodeKeys.clear();
    for (const key of initialExpandedNodeKeys(model)) expandedNodeKeys.add(key);

    editor.dispatch({ effects: replaceDecorations.of(makeDecorations(highlights, recovery)) });
    errorCount.textContent = String(recovery.filter((node) => node.recovery === "ERROR").length);
    missingCount.textContent = String(recovery.filter((node) => node.recovery === "MISSING").length);
    parseTime.textContent = `${elapsed.toFixed(1)} ms`;
    renderTree();
    renderRecovery(recovery);
    updateTreeModeButtons();
    setStatus(
      recovery.length === 0 ? "Clean parse" : "Recovery nodes detected",
      recovery.length === 0 ? "clean" : "recovery",
    );
  } catch (error) {
    setStatus("Could not display parse result", "failed");
    treeOutput.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    tree.delete();
  }
}

function scheduleParse() {
  clearTimeout(parseTimer);
  parseTimer = setTimeout(parseSource, 150);
}

async function loadExample(id) {
  const example = examples.find((item) => item.id === id);
  if (!example) return;
  const requestGeneration = beginContentRequest();
  const controller = new AbortController();
  exampleLoadController = controller;

  try {
    const response = await fetch(asset(`./examples/${example.file}`), {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Could not load ${example.file}`);
    const text = await response.text();
    if (requestGeneration !== contentRequestGeneration) return;
    setSource(text, example.label);
    setFileStatus();
  } catch (error) {
    if (error.name !== "AbortError") throw error;
  } finally {
    if (exampleLoadController === controller) exampleLoadController = undefined;
  }
}

async function loadSelectedFile() {
  const [file] = fileInput.files;
  if (!file) return;
  const requestGeneration = beginContentRequest();
  if (!/\.(bas|cls|frm)$/i.test(file.name)) {
    setStatus("Choose a .bas, .cls, or .frm file", "failed");
    fileInput.value = "";
    setFileStatus();
    return;
  }
  try {
    const text = new TextDecoder(encodingSelect.value).decode(await file.arrayBuffer());
    if (requestGeneration !== contentRequestGeneration) return;
    setSource(text, file.name);
    setFileStatus(file.name);
  } catch (error) {
    setStatus(`Could not decode ${file.name}: ${error.message}`, "failed");
  }
}

function resetSource() {
  fileInput.value = "";
  setFileStatus();
  if (examples[0]) {
    exampleSelect.value = examples[0].id;
    loadExample(examples[0].id).catch((error) => setStatus(error.message, "failed"));
  }
}

async function copyCurrentTree() {
  if (!currentModel) return;
  copyStatus.textContent = "";
  const text =
    treeMode === "sexpr"
      ? formatSExpression(currentModel)
      : formatTreeText(currentModel).join("\n");
  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = "Copied";
  } catch {
    copyStatus.textContent = "Copy unavailable";
  }
}

function initializeEditor() {
  editor = new EditorView({
    state: EditorState.create({
      doc: "",
      extensions: [
        lineNumbers(),
        history(),
        drawSelection(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        decorationField,
        EditorView.contentAttributes.of({ "aria-label": "VBA source code" }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            if (!replacingSource) {
              beginContentRequest();
              sourceName.textContent = "Edited source";
            }
            scheduleParse();
          }
          if (update.selectionSet && currentModel && !selectingExplicitNode) {
            const selection = update.state.selection.main;
            const selectedNode = findSmallestContainingNode(
              currentModel,
              selection.from,
              selection.to,
            );
            activeNodeKey = selectedNode?.key;
            updateSelectedTreeNode();
          }
        }),
      ],
    }),
    parent: document.querySelector("#editor"),
  });
}

async function initialize() {
  initializeEditor();
  try {
    const [metadata, manifest, highlightsSource] = await Promise.all([
      fetch(asset("./version.json")).then((response) => response.json()),
      fetch(asset("./examples/manifest.json")).then((response) => response.json()),
      fetch(asset("./queries/highlights.scm")).then((response) => response.text()),
    ]);
    version.textContent = `tree-sitter-vba v${metadata.version} · grammar commit: ${metadata.commit}`;
    examples = manifest.examples;
    exampleSelect.replaceChildren();
    for (const example of examples) {
      const option = document.createElement("option");
      option.value = example.id;
      option.textContent = example.label;
      exampleSelect.append(option);
    }

    await Parser.init({ locateFile: () => asset("./vendor/web-tree-sitter.wasm") });
    const language = await Language.load(asset("./tree-sitter-vba.wasm"));
    highlightQuery = new Query(language, highlightsSource);
    parser = new Parser();
    parser.setLanguage(language);
    await loadExample(examples[0].id);
  } catch (error) {
    setStatus("Parser failed to load", "failed");
    treeOutput.textContent = error.stack || error.message;
  }
}

exampleSelect.addEventListener("change", () =>
  loadExample(exampleSelect.value).catch((error) => setStatus(error.message, "failed")),
);
fileInput.addEventListener("change", loadSelectedFile);
loadFileButton.addEventListener("click", () => fileInput.click());
resetButton.addEventListener("click", resetSource);
treeButton.addEventListener("click", () => {
  treeMode = "tree";
  renderTree();
  updateTreeModeButtons();
});
sexprButton.addEventListener("click", () => {
  treeMode = "sexpr";
  renderTree();
  updateTreeModeButtons();
});
expandButton.addEventListener("click", () => {
  if (!currentModel) return;
  for (const key of collectNodeKeys(currentModel)) expandedNodeKeys.add(key);
  renderTree();
});
collapseButton.addEventListener("click", () => {
  expandedNodeKeys.clear();
  renderTree();
});
copyButton.addEventListener("click", copyCurrentTree);
window.addEventListener("pagehide", () => {
  clearTimeout(parseTimer);
  highlightQuery?.delete();
  parser?.delete();
  editor?.destroy();
});

initialize();
