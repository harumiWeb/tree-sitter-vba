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

function completeStage(stage) {
  status.dataset.stage = stage;
}

// Reports whether a syntax tree was produced. `Parser.parse()` is specified to return
// `null`, and recovery aggregation can throw, so neither failure reaches a caller as an
// exception. Callers own the initialization state and need the outcome to publish it.
function parseSource() {
  if (!parser) return false;

  const tree = parser.parse(sourceInput.value);
  if (!tree) {
    setStatus("Parser did not return a syntax tree", true);
    errorCount.textContent = "—";
    missingCount.textContent = "—";
    treeOutput.textContent = "";
    return false;
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
    return true;
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
    treeOutput.textContent = "";
    return false;
  } finally {
    tree.delete();
  }
}

async function initialize() {
  completeStage("assets-loaded");

  try {
    await Parser.init({
      locateFile: () => new URL("./vendor/web-tree-sitter.wasm", import.meta.url).href,
    });
    completeStage("runtime-init");

    const language = await Language.load(new URL("./tree-sitter-vba.wasm", import.meta.url).href);
    completeStage("language-load");

    parser = new Parser();
    parser.setLanguage(language);
    completeStage("set-language");

    sourceInput.value = defaultSource;
    if (!parseSource()) {
      // parseSource has already displayed the cause. Throwing routes it to the same
      // handler as a load failure, so `data-init` cannot read "ready" after a parse
      // the page itself reported as failed.
      throw new Error(status.textContent || "the initial parse produced no syntax tree");
    }
    completeStage("initial-parse");
    status.dataset.init = "ready";
  } catch (error) {
    status.dataset.init = "failed";
    setStatus(error instanceof Error ? error.message : String(error), true);
    treeOutput.textContent = parser ? "" : "Parser failed to load.";
  }
}

// A failed re-parse is the same hazard after initialization: without this the page keeps
// advertising "ready" and a consumer waits out its timeout on a condition that cannot hold.
parseButton.addEventListener("click", () => {
  if (!parseSource()) {
    status.dataset.init = "failed";
  }
});
window.addEventListener("pagehide", () => parser?.delete());
initialize();
