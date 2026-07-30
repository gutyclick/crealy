import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const trackedFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);

const secretPatterns = [
  /sk-(?:live|test|proj)-[A-Za-z0-9_-]{20,}/,
  /rk_(?:live|test)_[A-Za-z0-9]{20,}/,
  /whsec_[A-Za-z0-9]{20,}/,
  /re_[A-Za-z0-9]{20,}/,
  /sb_secret_[A-Za-z0-9_-]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
];

const flagged: string[] = [];
for (const file of trackedFiles) {
  if (file.endsWith("package-lock.json") || file.startsWith("public/")) continue;
  let content = "";
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (secretPatterns.some((pattern) => pattern.test(content))) flagged.push(file);
}

if (flagged.length) {
  console.error("Posibles secretos detectados en archivos versionados:");
  for (const file of flagged) console.error(`- ${file}`);
  process.exitCode = 1;
} else {
  console.log("No se detectaron secretos de alta confianza en archivos versionados.");
}
