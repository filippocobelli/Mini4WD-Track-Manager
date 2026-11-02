// Stampa la sezione di CHANGELOG.md relativa alla versione indicata (usata dal workflow di release).
import fs from "node:fs";
const v = (process.argv[2] || "").replace(/^v/, "");
const md = fs.readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
const re = new RegExp(`^## \\[?v?${v.replace(/\./g, "\\.")}\\]?.*$`, "m");
const m = md.match(re);
if (!m) { console.log(`Mini4WD Track Planner v${v}`); process.exit(0); }
const rest = md.slice(m.index + m[0].length);
const next = rest.search(/^## /m);
console.log((next === -1 ? rest : rest.slice(0, next)).trim());
