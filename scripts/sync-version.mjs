// Copia la versione di package.json dentro app/index.html (const APP_VERSION).
// Viene eseguito in automatico da `npm version <patch|minor|major>`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const p = path.join(root, "app", "index.html");
const s = fs.readFileSync(p, "utf8");
const out = s.replace(/const APP_VERSION="[^"]*"/, `const APP_VERSION="${version}"`);
if (out === s && !s.includes(`const APP_VERSION="${version}"`)) { console.error("APP_VERSION non trovato"); process.exit(1); }
fs.writeFileSync(p, out);
console.log(`APP_VERSION = ${version}`);
