import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const scannedRoots = ["src", "tests", "scripts", "docs", "supabase"];
const scannedExtensions = new Set([
  ".css",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".sql",
  ".ts",
  ".tsx",
]);

// Keep the signatures escaped so this guard can safely scan its own source.
const mojibakeSignatures = [
  "\u00c3", // UTF-8 Spanish decoded as Windows-1252
  "\u00c2", // stray prefix before punctuation or spaces
  "\u00e2\u20ac", // damaged smart quotes, dashes or arrows
  "\u00f0\u0178", // damaged emoji prefix
  "\ufffd", // Unicode replacement character
] as const;

async function sourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(root, entry.name);
      if (entry.isDirectory()) return sourceFiles(entryPath);
      return scannedExtensions.has(path.extname(entry.name)) ? [entryPath] : [];
    }),
  );
  return files.flat();
}

test("product text does not contain mojibake", async () => {
  const files = (
    await Promise.all(scannedRoots.map((root) => sourceFiles(root)))
  ).flat();
  const failures: string[] = [];

  for (const file of files) {
    const contents = await readFile(file, "utf8");
    const signature = mojibakeSignatures.find((candidate) =>
      contents.includes(candidate),
    );
    if (signature) failures.push(`${file} (${JSON.stringify(signature)})`);
  }

  assert.deepEqual(
    failures,
    [],
    `Se detectó texto con codificación dañada:\n${failures.join("\n")}`,
  );
});

test("thumbnail prompts keep the accented generic-text filters intact", async () => {
  const [config, orchestrator, formatTests] = await Promise.all([
    readFile("src/config/thumbnail-creation.ts", "utf8"),
    readFile("src/lib/generation/thumbnail-orchestrator.ts", "utf8"),
    readFile("tests/generation-formats.test.ts", "utf8"),
  ]);

  assert.match(config, /composición/u);
  assert.match(orchestrator, /QUÉ PASÓ/u);
  assert.match(config, /genérico/u);
  assert.match(orchestrator, /genérica/u);
  assert.match(formatTests, /QUÉ PASÓ/u);
});
