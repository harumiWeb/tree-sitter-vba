import Parser from "./vendor/web-tree-sitter.js";

const source = document.querySelector("#source");
const sourceName = document.querySelector("#source-name");
const exampleSelect = document.querySelector("#example-select");
const fileInput = document.querySelector("#file-input");
const encodingSelect = document.querySelector("#encoding-select");
const version = document.querySelector("#version");
const status = document.querySelector("#parse-status");
const errorCount = document.querySelector("#error-count");
const missingCount = document.querySelector("#missing-count");
const parseTime = document.querySelector("#parse-time");
const treeOutput = document.querySelector("#tree-output");
const recoveryList = document.querySelector("#recovery-list");

let parser;
let examples = [];
let parseTimer;

function asset(path) {
  return new URL(path, import.meta.url).href;
}

function setStatus(message, kind) {
  status.textContent = message;
  status.className = `status ${kind}`;
}

function inspectTree(rootNode) {
  const recovery = [];
  const nodes = [rootNode];

  while (nodes.length > 0) {
    const node = nodes.pop();
    const kind =
      node.type === "ERROR"
        ? "ERROR"
        : node.type === "MISSING" || node.isMissing
          ? "MISSING"
          : null;
    if (kind) {
      recovery.push({
        kind,
        startIndex: node.startIndex,
        endIndex: node.endIndex,
        start: node.startPosition,
        end: node.endPosition,
      });
    }
    for (let index = 0; index < node.childCount; index += 1) {
      nodes.push(node.child(index));
    }
  }

  return recovery.sort((left, right) => left.startIndex - right.startIndex);
}

function renderRecovery(recovery) {
  recoveryList.replaceChildren();
  if (recovery.length === 0) {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = "No ERROR or MISSING recovery nodes.";
    recoveryList.append(item);
    return;
  }

  for (const item of recovery) {
    const row = document.createElement("li");
    const button = document.createElement("button");
    const start = `${item.start.row + 1}:${item.start.column + 1}`;
    const end = `${item.end.row + 1}:${item.end.column + 1}`;
    button.type = "button";
    button.textContent = `${item.kind} — ${start}–${end} (offset ${item.startIndex}–${item.endIndex})`;
    button.addEventListener("click", () => {
      source.focus();
      source.setSelectionRange(item.startIndex, item.endIndex);
    });
    row.append(button);
    recoveryList.append(row);
  }
}

function parseSource() {
  if (!parser) return;

  const startedAt = performance.now();
  const tree = parser.parse(source.value);
  const recovery = inspectTree(tree.rootNode);
  const elapsed = performance.now() - startedAt;
  const errors = recovery.filter((item) => item.kind === "ERROR").length;
  const missing = recovery.filter((item) => item.kind === "MISSING").length;

  treeOutput.textContent = tree.rootNode.toString();
  errorCount.textContent = String(errors);
  missingCount.textContent = String(missing);
  parseTime.textContent = `${elapsed.toFixed(1)} ms`;
  renderRecovery(recovery);

  if (recovery.length === 0) {
    setStatus("Clean parse", "clean");
  } else {
    setStatus("Recovery nodes detected", "recovery");
  }
  tree.delete();
}

function scheduleParse() {
  clearTimeout(parseTimer);
  parseTimer = setTimeout(parseSource, 150);
}

async function loadExample(id) {
  const example = examples.find((item) => item.id === id);
  if (!example) return;
  const response = await fetch(asset(`./examples/${example.file}`));
  if (!response.ok) throw new Error(`Could not load ${example.file}`);
  source.value = await response.text();
  sourceName.textContent = example.label;
  scheduleParse();
}

async function loadSelectedFile() {
  const [file] = fileInput.files;
  if (!file) return;
  if (!/\.(bas|cls|frm)$/i.test(file.name)) {
    setStatus("Choose a .bas, .cls, or .frm file", "failed");
    fileInput.value = "";
    return;
  }
  try {
    source.value = new TextDecoder(encodingSelect.value).decode(await file.arrayBuffer());
    sourceName.textContent = file.name;
    scheduleParse();
  } catch (error) {
    setStatus(`Could not decode ${file.name}: ${error.message}`, "failed");
  }
}

async function initialize() {
  try {
    const [metadata, manifest] = await Promise.all([
      fetch(asset("./version.json")).then((response) => response.json()),
      fetch(asset("./examples/manifest.json")).then((response) => response.json()),
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

    await Parser.init({ locateFile: (fileName) => asset(`./vendor/${fileName}`) });
    const language = await Parser.Language.load(asset("./tree-sitter-vba.wasm"));
    parser = new Parser();
    parser.setLanguage(language);
    await loadExample(examples[0].id);
  } catch (error) {
    setStatus("Parser failed to load", "failed");
    treeOutput.textContent = error.stack || error.message;
    recoveryList.innerHTML = '<li class="empty">The parser could not be initialized.</li>';
  }
}

source.addEventListener("input", scheduleParse);
exampleSelect.addEventListener("change", () =>
  loadExample(exampleSelect.value).catch((error) => {
    setStatus(error.message, "failed");
  }),
);
fileInput.addEventListener("change", loadSelectedFile);

initialize();
