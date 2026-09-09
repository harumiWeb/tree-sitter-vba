import assert from "node:assert/strict";
import { createServer } from "node:http";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { chromium } from "playwright";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const dist = join(root, "build", "browser-consumer");

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".wasm", "application/wasm"],
]);

function resolveRequestPath(requestUrl, documentRoot) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl ?? "/", "http://localhost").pathname);
  } catch {
    return null;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = resolve(documentRoot, relativePath);
  const fileRelativeToRoot = relative(documentRoot, filePath);
  if (fileRelativeToRoot.startsWith(`..${sep}`) || fileRelativeToRoot === "..") {
    return null;
  }
  return filePath;
}

async function startServer(documentRoot = dist) {
  const server = createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }

    const filePath = resolveRequestPath(request.url, documentRoot);
    if (!filePath) {
      response.writeHead(400);
      response.end();
      return;
    }

    try {
      const body = await readFile(filePath);
      response.writeHead(200, {
        "Content-Type": contentTypes.get(extname(filePath)) ?? "application/octet-stream",
        "Content-Length": body.byteLength,
      });
      if (request.method === "HEAD") {
        response.end();
      } else {
        response.end(body);
      }
    } catch {
      response.writeHead(404);
      response.end();
    }
  });

  await new Promise((resolveServer, rejectServer) => {
    server.once("error", rejectServer);
    server.listen(0, "127.0.0.1", resolveServer);
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");
  return { server, url: `http://127.0.0.1:${address.port}/` };
}

async function readPageValue(page, selector) {
  return page.locator(selector).textContent();
}

// The browser explains its own failures, so every failure signal the page can emit is
// collected and raced against the success condition. `firstBrowserFailure` never settles
// while the page is healthy.
function collectBrowserSignals(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const assetErrors = [];
  let reportBrowserFailure;
  const firstBrowserFailure = new Promise((resolveFailure) => {
    reportBrowserFailure = resolveFailure;
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
      reportBrowserFailure("the browser logged a console error");
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
    reportBrowserFailure("the page raised an uncaught error");
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.url()}: ${request.failure()?.errorText ?? "unknown error"}`);
    reportBrowserFailure("a page request failed");
  });
  page.on("response", (response) => {
    const pathname = new URL(response.url()).pathname;
    if (response.status() >= 400 && /\.(?:js|mjs|wasm)$/i.test(pathname)) {
      assetErrors.push(`${response.status()} ${response.url()}`);
      reportBrowserFailure("an asset request returned an error status");
    }
  });

  return { consoleErrors, pageErrors, failedRequests, assetErrors, firstBrowserFailure };
}

async function readAttribute(page, selector, attribute) {
  try {
    return (await page.locator(selector).getAttribute(attribute)) ?? "unset";
  } catch {
    return "unreadable";
  }
}

async function readText(page, selector) {
  try {
    return ((await readPageValue(page, selector)) ?? "").split("\n", 1)[0].slice(0, 300);
  } catch {
    return "unreadable";
  }
}

function formatList(entries) {
  return entries.length === 0 ? "none" : `\n  - ${entries.join("\n  - ")}`;
}

async function describeFailure(page, signals, description, cause) {
  return [
    `${description} did not complete: ${cause}`,
    `last completed stage: ${await readAttribute(page, "#status", "data-stage")}`,
    `initialization: ${await readAttribute(page, "#status", "data-init")}`,
    `reported status: ${await readText(page, "#status")}`,
    `syntax tree: ${await readText(page, "#tree")}`,
    `console errors: ${formatList(signals.consoleErrors)}`,
    `page errors: ${formatList(signals.pageErrors)}`,
    `failed requests: ${formatList(signals.failedRequests)}`,
    `asset errors: ${formatList(signals.assetErrors)}`,
  ].join("\n");
}

// Resolves when `predicate` holds. Throws as soon as the page reports an initialization
// failure or the browser emits a failure signal, so a broken page is never waited out.
async function waitForPageState(page, signals, description, predicate) {
  const cause = await Promise.race([
    page.waitForFunction(predicate).then(
      () => null,
      (error) => error.message,
    ),
    signals.firstBrowserFailure,
  ]);

  const initState = await readAttribute(page, "#status", "data-init");
  const problem = cause ?? (initState === "failed" ? "the page reported a failed load" : null);
  if (problem === null) {
    return;
  }
  assert.fail(await describeFailure(page, signals, description, problem));
}

const reachedInitialParse = () => {
  const element = document.querySelector("#status");
  return element?.dataset.init === "failed" || element?.textContent === "Clean parse";
};

test("generated browser consumer works in a real browser", async () => {
  const { server, url } = await startServer();
  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    const signals = collectBrowserSignals(page);

    await page.goto(url, { waitUntil: "load" });
    await waitForPageState(page, signals, "initial parse", reachedInitialParse);

    assert.deepEqual(
      {
        consoleErrors: signals.consoleErrors,
        pageErrors: signals.pageErrors,
        failedRequests: signals.failedRequests,
        assetErrors: signals.assetErrors,
      },
      { consoleErrors: [], pageErrors: [], failedRequests: [], assetErrors: [] },
    );
    assert.equal(await readAttribute(page, "#status", "data-stage"), "initial-parse");
    assert.equal(await readPageValue(page, "#error-count"), "0");
    assert.equal(await readPageValue(page, "#missing-count"), "0");
    assert.match((await readPageValue(page, "#tree")) ?? "", /^\(source_file/);

    await page.locator("#source").fill("Sub Test()\n    value = Foo(\nEnd Sub\n");
    await page.getByRole("button", { name: "Parse source" }).click();
    await waitForPageState(
      page,
      signals,
      "missing-node recovery parse",
      () =>
        document.querySelector("#status")?.textContent === "Recovery nodes detected" &&
        document.querySelector("#missing-count")?.textContent === "1",
    );
    assert.equal(await readPageValue(page, "#error-count"), "0");

    await page.locator("#source").fill('Sub Test()\n    message = "unterminated\nEnd Sub\n');
    await page.getByRole("button", { name: "Parse source" }).click();
    await waitForPageState(
      page,
      signals,
      "error-node recovery parse",
      () =>
        document.querySelector("#status")?.textContent === "Recovery nodes detected" &&
        document.querySelector("#error-count")?.textContent === "1",
    );
    assert.equal(await readPageValue(page, "#missing-count"), "0");
  } finally {
    await page?.close();
    await browser?.close();
    await new Promise((resolveServer) => server.close(resolveServer));
  }
});

// A grammar artifact the browser cannot instantiate is the failure this test exists to
// report. The short wait is the assertion: the page must publish the failure instead of
// leaving the success condition to time out.
test("browser consumer publishes a grammar load failure instead of hanging", async () => {
  const brokenDist = mkdtempSync(join(tmpdir(), "tree-sitter-vba-broken-"));
  let browser;
  let page;
  let server;

  try {
    for (const entry of ["index.html", "app.js", "recovery.mjs", "vendor"]) {
      cpSync(join(dist, entry), join(brokenDist, entry), { recursive: true });
    }
    writeFileSync(join(brokenDist, "tree-sitter-vba.wasm"), Buffer.from("not a wasm module"));

    const started = await startServer(brokenDist);
    server = started.server;

    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    const signals = collectBrowserSignals(page);

    await page.goto(started.url, { waitUntil: "load" });
    await page.waitForFunction(reachedInitialParse, undefined, { timeout: 5000 });

    assert.equal(await readAttribute(page, "#status", "data-init"), "failed");
    assert.equal(await readAttribute(page, "#status", "data-stage"), "runtime-init");

    const cause = "the page reported a failed load";
    const report = await describeFailure(page, signals, "initial parse", cause);
    assert.match(report, /last completed stage: runtime-init/);
    assert.doesNotMatch(report, /reported status: Loading parser/);
  } finally {
    await page?.close();
    await browser?.close();
    if (server) {
      await new Promise((resolveServer) => server.close(resolveServer));
    }
    rmSync(brokenDist, { recursive: true, force: true });
  }
});
