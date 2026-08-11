import { Language, Parser } from "./vendor/web-tree-sitter.js";
import { countRecoveryNodes } from "./recovery.mjs";

const defaultSource = `Sub Example()
    Dim value As Long
    value = 42
End Sub
`;

const sourceInput = document.querySelector("#source");
const parseButton = document.querySelector("#parse");
const status = document.querySelector("#status");
const errorCount = document.querySelector("#error-count");
const missingCount = document.querySelector("#missing-count");
const treeOutput = document.querySelector("#tree");

let parser;

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function parseSource() {
  if (!parser) return;

  const tree = parser.parse(sourceInput.value);
  if (!tree) {
    setStatus("Parser did not return a syntax tree", true);
    errorCount.textContent = "—";
    missingCount.textContent = "—";
    treeOutput.textContent = "";
    return;
  }

  try {
    const recovery = countRecoveryNodes(tree.rootNode);
    errorCount.textContent = String(recovery.errorCount);
    missingCount.textContent = String(recovery.missingCount);
    treeOutput.textContent = tree.rootNode.toString();
    setStatus(
      recovery.errorCount === 0 && recovery.missingCount === 0
        ? "Clean parse"
        : "Recovery nodes detected",
      recovery.errorCount > 0 || recovery.missingCount > 0,
    );
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
    treeOutput.textContent = "";
  } finally {
    tree.delete();
  }
}

async function initialize() {
  try {
    await Parser.init({
      locateFile: () => new URL("./vendor/web-tree-sitter.wasm", import.meta.url).href,
    });
    const language = await Language.load(new URL("./tree-sitter-vba.wasm", import.meta.url).href);
    parser = new Parser();
    parser.setLanguage(language);
    sourceInput.value = defaultSource;
    parseSource();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
    treeOutput.textContent = "Parser failed to load.";
  }
}

parseButton.addEventListener("click", parseSource);
window.addEventListener("pagehide", () => parser?.delete());
initialize();
