// Copies the Manifold library (node_modules/manifold-3d) into app/vendor/ in a form
// that works everywhere: browser, file:// in Electron, claude.ai preview.
//  - manifold.js: the ES module becomes a classic script (globalThis.ManifoldModule)
//  - manifold-wasm.js: the .wasm file embedded as base64 (no fetch needed)
// Re-run only when manifold-3d is updated: `npm run vendor`.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const dir = path.dirname(require.resolve("manifold-3d/manifold.js"));
const { version } = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
const out = path.join(root, "app", "vendor");
fs.mkdirSync(out, { recursive: true });

let js = fs.readFileSync(path.join(dir, "manifold.js"), "utf8");
const n = (js.match(/export default Module;/g) || []).length;
if (n !== 1) throw new Error("manifold.js: unexpected structure (export default)");
js = js.replace("export default Module;", "globalThis.ManifoldModule=Module;")
       .replaceAll("import.meta.url", '(globalThis.MANIFOLD_BASE||(typeof location!=="undefined"?location.href:"file:///"))');
if (/\bimport\.meta\b|^\s*export\s/m.test(js)) throw new Error("manifold.js: ES module constructs left");
fs.writeFileSync(path.join(out, "manifold.js"), `/* manifold-3d ${version} — Apache-2.0 — https://github.com/elalish/manifold (converted to a classic script) */\n` + js);

const wasm = fs.readFileSync(path.join(dir, "manifold.wasm"));
fs.writeFileSync(path.join(out, "manifold-wasm.js"), `/* manifold-3d ${version} manifold.wasm (base64) */\nglobalThis.MANIFOLD_WASM_B64="${wasm.toString("base64")}";\n`);
fs.copyFileSync(path.join(dir, "LICENSE"), path.join(out, "LICENSE-manifold.txt"));
fs.writeFileSync(path.join(out, "VERSION-manifold.txt"), version + "\n");
console.log(`manifold-3d ${version} → app/vendor (${(wasm.length / 1024).toFixed(0)} KB wasm)`);
