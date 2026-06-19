import { readFileSync } from "node:fs";

const generatedParser = readFileSync("src/parser.c", "utf8");
const goParser = readFileSync("bindings/go/parser.c", "utf8");

if (generatedParser !== goParser) {
  console.error("bindings/go/parser.c is out of sync with src/parser.c.");
  console.error("Run `pnpm generate` and copy src/parser.c to bindings/go/parser.c.");
  process.exit(1);
}
