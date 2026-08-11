import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
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

function resolveRequestPath(requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl ?? "/", "http://localhost").pathname);
  } catch {
    return null;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = resolve(dist, relativePath);
  const fileRelativeToDist = relative(dist, filePath);
  if (fileRelativeToDist.startsWith(`..${sep}`) || fileRelativeToDist === "..") {
    return null;
  }
  return filePath;
}

async function startServer() {
  const server = createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }

    const filePath = resolveRequestPath(request.url);
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

test("generated browser consumer works in a real browser", async () => {
  const { server, url } = await startServer();
  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    const assetErrors = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });
    page.on("requestfailed", (request) => {
      failedRequests.push(`${request.url()}: ${request.failure()?.errorText ?? "unknown error"}`);
    });
    page.on("response", (response) => {
      const pathname = new URL(response.url()).pathname;
      if (response.status() >= 400 && /\.(?:js|mjs|wasm)$/i.test(pathname)) {
        assetErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto(url, { waitUntil: "load" });
    await page.waitForFunction(
      () => document.querySelector("#status")?.textContent === "Clean parse",
    );

    assert.deepEqual(
      { consoleErrors, pageErrors, failedRequests, assetErrors },
      { consoleErrors: [], pageErrors: [], failedRequests: [], assetErrors: [] },
    );
    assert.equal(await readPageValue(page, "#error-count"), "0");
    assert.equal(await readPageValue(page, "#missing-count"), "0");
    assert.match((await readPageValue(page, "#tree")) ?? "", /^\(source_file/);

    await page.locator("#source").fill("Sub Test()\n    value = Foo(\nEnd Sub\n");
    await page.getByRole("button", { name: "Parse source" }).click();
    await page.waitForFunction(
      () =>
        document.querySelector("#status")?.textContent === "Recovery nodes detected" &&
        document.querySelector("#missing-count")?.textContent === "1",
    );
    assert.equal(await readPageValue(page, "#error-count"), "0");

    await page.locator("#source").fill('Sub Test()\n    message = "unterminated\nEnd Sub\n');
    await page.getByRole("button", { name: "Parse source" }).click();
    await page.waitForFunction(
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
