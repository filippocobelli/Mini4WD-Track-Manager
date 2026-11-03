// Test automatici di Mini4WD Track Planner.
// - motore 3D in Node (Manifold): misure del rettilineo 200 mm, solidi chiusi, file STL/OBJ/ZIP
// - app nel browser (Playwright): chiusura dei circuiti, corsie, generatori, magazzino, Officina
// Uso: npm test   (variabile facoltativa PW_CHROMIUM = percorso di un Chromium già installato)
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import Module from "manifold-3d/manifold.js";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0, passed = 0;
const ok = (cond, name, extra = "") => { if (cond) { passed++; console.log(`  ✓ ${name}`); } else { failed++; console.log(`  ✗ ${name} ${extra}`); } };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* ---------- motore 3D ---------- */
console.log("Motore 3D");
const W = await Module(); W.setup();
vm.runInThisContext(fs.readFileSync(path.join(root, "app", "engine3d.js"), "utf8"));
const E = globalThis.M4Engine.create(W);
{
  // riferimento: rettilineo 200 mm del set MINI4WD 2 LANE DIY TRACK (MakerWorld 542904)
  const p = E.build({ type: "straight", L: 200 }).pieces[0];
  ok(near(p.size[0], 250.3, 0.2) && near(p.size[1], 200, 0.01) && near(p.size[2], 52.5, 0.01), "rettilineo 200: ingombro 250,3 × 200 × 52,5 mm", p.size.join(" × "));
  ok(near(p.volume, 178.9, 1), "rettilineo 200: volume 178,9 cm³ come il modello originale", p.volume.toFixed(2));
}
for (const type of Object.keys(globalThis.M4Engine.TYPES)) {
  const r = E.build({ type });
  ok(r.pieces.length > 0 && r.pieces.every(p => p.status === "NoError" && p.volume > 1 && p.fit.ok), `${type}: solido valido e dentro il piatto 256×256`, JSON.stringify(r.pieces.map(p => [p.status, p.fit.ok])));
}
{
  const r = E.build({ type: "curve", ang: 45, R: 480 });
  ok(r.split === 2 && r.pieces[0].qty === 2, "curva 45° R480 divisa in 2 per un piatto 256");
  const small = E.build({ type: "straight", L: 200 }, { bedX: 180, bedY: 180 });
  ok(!small.ok, "rettilineo largo 250 mm segnalato fuori da un piatto 180×180");
  ok(E.pending() === 0, "memoria WebAssembly liberata dopo ogni pezzo");
  const m = E.build({ type: "jump" }).pieces[0].mesh, stl = globalThis.M4Engine.toSTL(m, "test");
  ok(stl.length === 84 + (m.tri.length / 3) * 50, "STL binario con dimensione corretta");
  ok(new TextDecoder().decode(globalThis.M4Engine.toOBJ(m)).split("\n").filter(l => l.startsWith("f ")).length === m.tri.length / 3, "OBJ con tutte le facce");
  const z = globalThis.M4Engine.zip([{ name: "a.txt", data: "ciao" }]);
  ok(z[0] === 0x50 && z[1] === 0x4b && z.length === 30 + 5 + 4 + 46 + 5 + 22, "ZIP valido");
}

/* ---------- app nel browser ---------- */
console.log("App");
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on("pageerror", e => errors.push(e.message));
await page.route(/^https?:/, r => r.abort()); // nessuna rete: si prova la versione offline
await page.goto("file://" + path.join(root, "desktop", "index.html"));
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);

const res = await page.evaluate(() => {
  const out = {};
  for (const [k, p] of Object.entries(PRESETS)) { st.layout = p.items(); const a = analyse(geom()); out["preset " + k] = a.closed && Math.abs(a.lanes.A[0] + a.lanes.A[1] - a.lanes.B[0] - a.lanes.B[1]) < 1; }
  st.layout = PRESETS.ovale.items(); const need = bom();
  out["distinta ovale: 8 curve, 2+2 rettilinei, 1 cambio corsia"] = need.c45 === 8 && need.s200 === 2 && need.s215 === 2 && need.lcA === 1;
  st.settings.roomW = 300; st.settings.roomH = 180;
  const g = generate();
  out["alternative: almeno 3, tutte chiuse e dentro 300×180"] = g.length >= 3 && g.every(c => analyse(geom(c.layout)).closed && Math.max(c.w, c.h) <= 3000 && Math.min(c.w, c.h) <= 1800);
  st.settings.rnd = { src: "room", feat: { lc: true, jump: true } };
  const r = randomGen();
  out["casuale: 3 circuiti chiusi con scambio e salto"] = !!r.res && r.res.length === 3 && r.res.every(c => analyse(geom(c.layout)).closed && c.layout.some(x => x.t === "LC") && c.layout.some(x => x.t === "J200"));
  st.owned = {}; st.log = []; setOwned("c45", 3, "test"); setOwned("c45", 5, "test");
  out["magazzino: clic ripetuti uniti in una riga di storico"] = st.log.length === 1 && st.log[0].q === 5;
  return out;
});
for (const [k, v] of Object.entries(res)) ok(v, k);

await page.click('[data-tab="ws"]');
await page.waitForFunction(() => !wsBusy && (wsRes || engErr), null, { timeout: 60000 });
const ws = await page.evaluate(() => ({ err: engErr, label: wsRes && wsRes.pieces[0].label }));
ok(!ws.err && ws.label === "rettilineo 200mm", "Officina: il motore parte nel browser e genera il rettilineo", JSON.stringify(ws));
ok(errors.length === 0, "nessun errore JavaScript nella pagina", errors.join(" | "));
await browser.close();

console.log(`\n${passed} superati, ${failed} falliti`);
process.exit(failed ? 1 : 0);
