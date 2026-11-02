// Prepara le due uscite a partire da app/index.html:
//  - dist/web/Mini4WD-Track-Planner-v<versione>.html: un solo file con le icone incorporate (per html.cobelli.uk)
//  - desktop/: copia offline per l'app Electron, con three.js locale al posto del CDN
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const src = fs.readFileSync(path.join(root, "app", "index.html"), "utf8");

const m = src.match(/const APP_VERSION="([^"]+)"/);
if (!m || m[1] !== pkg.version) {
  console.error(`Versione non allineata: app/index.html=${m && m[1]} package.json=${pkg.version}. Esegui: node scripts/sync-version.mjs`);
  process.exit(1);
}

const b64 = f => "data:image/png;base64," + fs.readFileSync(path.join(root, "app", f)).toString("base64");

// 1) file unico per il web
let single = src
  .replace('href="mini4wd-icon-32.png"', `href="${b64("mini4wd-icon-32.png")}"`)
  .replace('href="mini4wd-icon-180.png"', `href="${b64("mini4wd-icon-180.png")}"`)
  .replace(/\n<link rel="manifest"[^>]*>/, "");
fs.mkdirSync(path.join(root, "dist", "web"), { recursive: true });
const webOut = path.join(root, "dist", "web", `Mini4WD-Track-Planner-v${pkg.version}.html`);
fs.writeFileSync(webOut, single);

// 2) copia offline per l'app desktop
const desk = path.join(root, "desktop");
fs.rmSync(desk, { recursive: true, force: true });
fs.mkdirSync(path.join(desk, "vendor"), { recursive: true });
for (const f of fs.readdirSync(path.join(root, "app"))) if (f !== "index.html") fs.copyFileSync(path.join(root, "app", f), path.join(desk, f));
const three = path.join(root, "node_modules", "three");
fs.copyFileSync(path.join(three, "build", "three.min.js"), path.join(desk, "vendor", "three.min.js"));
fs.copyFileSync(path.join(three, "examples", "js", "controls", "OrbitControls.js"), path.join(desk, "vendor", "OrbitControls.js"));
const deskHtml = src
  .replace("https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js", "vendor/three.min.js")
  .replace("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js", "vendor/OrbitControls.js");
if (deskHtml.includes("cdn.jsdelivr.net")) { console.error("Riferimento CDN non sostituito in desktop/index.html"); process.exit(1); }
fs.writeFileSync(path.join(desk, "index.html"), deskHtml);

console.log(`v${pkg.version}: ${path.relative(root, webOut)} + desktop/`);
