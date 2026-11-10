// Automated tests for Mini4WD Track Planner.
// - 3D engine in Node (Manifold): 200 mm straight sizes, closed solids, STL/OBJ/ZIP files
// - app in the browser (Playwright): track closing, lanes, generators, inventory, Workshop, language switch
// Usage: npm test   (optional PW_CHROMIUM = path to an already installed Chromium)
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

/* ---------- 3D engine ---------- */
console.log("3D engine");
const W = await Module(); W.setup();
vm.runInThisContext(fs.readFileSync(path.join(root, "app", "engine3d.js"), "utf8"));
const E = globalThis.M4Engine.create(W);
{
  // reference: 200 mm straight of the MINI4WD 2 LANE DIY TRACK (MakerWorld 542904)
  const p = E.build({ type: "straight", L: 200 }).pieces[0];
  ok(near(p.size[0], 250.3, 0.2) && near(p.size[1], 200, 0.01) && near(p.size[2], 52.5, 0.01), "straight 200: size 250.3 × 200 × 52.5 mm", p.size.join(" × "));
  ok(near(p.volume, 178.9, 1), "straight 200: volume 178.9 cm³ like the original model", p.volume.toFixed(2));
}
for (const type of Object.keys(globalThis.M4Engine.TYPES)) {
  const r = E.build({ type });
  ok(r.pieces.length > 0 && r.pieces.every(p => p.status === "NoError" && p.volume > 1 && p.fit.ok), `${type}: valid solid that fits a 256×256 bed`, JSON.stringify(r.pieces.map(p => [p.status, p.fit.ok])));
}
{
  const r = E.build({ type: "curve", ang: 45, R: 480 });
  ok(r.split === 2 && r.pieces[0].qty === 2, "curve 45° R480 split in 2 for a 256 bed");
  const small = E.build({ type: "straight", L: 200 }, { bedX: 180, bedY: 180 });
  ok(!small.ok, "250 mm wide straight flagged as off a 180×180 bed");
  ok(E.pending() === 0, "WebAssembly memory freed after each piece");
  const m = E.build({ type: "jump" }).pieces[0].mesh, stl = globalThis.M4Engine.toSTL(m, "test");
  ok(stl.length === 84 + (m.tri.length / 3) * 50, "binary STL with the right size");
  ok(new TextDecoder().decode(globalThis.M4Engine.toOBJ(m)).split("\n").filter(l => l.startsWith("f ")).length === m.tri.length / 3, "OBJ with every face");
  const z = globalThis.M4Engine.zip([{ name: "a.txt", data: "test" }]);
  ok(z[0] === 0x50 && z[1] === 0x4b && z.length === 30 + 5 + 4 + 46 + 5 + 22, "valid ZIP");
}

/* ---------- layout solver (trace.js) ---------- */
console.log("Layout solver");
vm.runInThisContext(fs.readFileSync(path.join(root, "app", "trace.js"), "utf8"));
{
  const Tr = globalThis.M4Trace;
  const types = { S200: { kind: "straight", len: 200 }, S215: { kind: "straight", len: 215 }, S100: { kind: "straight", len: 100 }, C45: { kind: "curve", ang: 45, r: 480 }, RUP: { kind: "straight", len: 250, dz: 75 }, LC: { kind: "lane", len: 830 } };
  const cat = { straights: [{ id: "S200", len: 200 }, { id: "S215", len: 215 }, { id: "S100", len: 100 }], curve: { id: "C45", ang: 45, r: 480 }, ramps: [{ id: "RUP", len: 250, dz: 75 }], lookup: id => types[id] };
  const O = { x: 0, y: 0, h: 0, z: 0 }, R4 = Array(4).fill({ t: "C45", d: "R" });
  const half = Tr.run({ ...O }, [{ t: "S200" }, { t: "S215" }, { t: "S215" }, { t: "S200" }, ...R4], cat);
  const c1 = Tr.close(half, O, cat)[0];
  ok(c1 && !c1.custom && Tr.residual(Tr.run({ ...half }, c1.items, cat), O).dist < 0.01, "closes half an oval with kit pieces only");
  const c2 = Tr.close({ x: -137, y: 0, h: 0, z: 0 }, O, cat)[0];
  ok(c2 && c2.custom === 1 && c2.items[0].gen && Math.abs(c2.items[0].gen.L - 137) < 0.1, "a 137 mm gap becomes a made-to-measure straight");
  const c3 = Tr.close({ x: -250, y: 0, h: 0, z: 75 }, O, cat)[0];
  ok(c3 && c3.items.some(i => i.t === "RUP" && i.v === -1), "height difference closed with a down ramp");
  const ov = [{ t: "S200" }, { t: "S215" }, { t: "S215" }, { t: "S200" }, ...R4, { t: "S200" }, { t: "S215" }, { t: "S215" }, { t: "S200" }, ...R4];
  let p = { x: 300, y: 500, h: 0, z: 0 }; const pts = [];
  for (const it of ov) { const pc = Tr.pieceOf(it, cat); for (let k = 0; k < 10; k++) { const q = Tr.step(p, { ...pc, ang: (pc.ang || 0) * k / 10, len: (pc.len || 0) * k / 10 }); pts.push({ x: q.x + Math.sin(pts.length) * 6, y: q.y }); } p = Tr.step(p, pc); }
  const fit = Tr.fitPath(pts, cat, { lc: { id: "LC", len: 830 } });
  ok(!fit.err && !fit.open && fit.dev < 25 && fit.items.filter(i => i.t === "C45").length === 8 && fit.lc, "sketch of the kit oval rebuilt: closed, 8 curves, lane change", JSON.stringify({ n: fit.items && fit.items.length, dev: fit.dev, open: fit.open }));
  const W = 400, H = 260, px = new Uint8ClampedArray(W * H * 4).fill(255);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const r = Math.hypot((x - 200) / 150, (y - 130) / 90); if (r > 0.8 && r < 1) for (let c = 0; c < 3; c++) px[4 * (y * W + x) + c] = 30; }
  const im = Tr.traceImage(px, W, H);
  ok(!im.err && im.band && Math.abs(im.bbox.w - 270) < 8 && Math.abs(im.bbox.h - 162) < 8, "image: centre line of a drawn ring", JSON.stringify(im.bbox));
}

/* ---------- app in the browser ---------- */
console.log("App");
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ["--use-gl=swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on("pageerror", e => errors.push(e.message));
await page.route(/^https?:/, r => r.abort()); // no network: test the offline version
await page.goto("file://" + path.join(root, "desktop", "index.html"));
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);

const res = await page.evaluate(() => {
  const out = {};
  for (const [k, p] of Object.entries(PRESETS)) { st.layout = p.items(); const a = analyse(geom()); out["preset " + k] = a.closed && Math.abs(a.lanes.A[0] + a.lanes.A[1] - a.lanes.B[0] - a.lanes.B[1]) < 1; }
  st.layout = PRESETS.ovale.items(); const need = bom();
  out["oval parts: 8 curves, 2+2 straights, 1 lane change"] = need.c45 === 8 && need.s200 === 2 && need.s215 === 2 && need.lcA === 1;
  st.settings.roomW = 300; st.settings.roomH = 180;
  const g = generate();
  out["alternatives: at least 3, all closed and inside 300×180"] = g.length >= 3 && g.every(c => analyse(geom(c.layout)).closed && Math.max(c.w, c.h) <= 3000 && Math.min(c.w, c.h) <= 1800);
  st.settings.rnd = { src: "room", feat: { lc: true, jump: true } };
  const r = randomGen();
  out["random: 3 closed tracks with lane change and jump"] = !!r.res && r.res.length === 3 && r.res.every(c => analyse(geom(c.layout)).closed && c.layout.some(x => x.t === "LC") && c.layout.some(x => x.t === "J200"));
  st.owned = {}; st.log = []; setOwned("c45", 3, "test"); setOwned("c45", 5, "test");
  out["inventory: repeated clicks merged into one history row"] = st.log.length === 1 && st.log[0].q === 5;
  return out;
});
for (const [k, v] of Object.entries(res)) ok(v, k);

await page.click('[data-tab="ws"]');
await page.waitForFunction(() => !wsBusy && (wsRes || engErr), null, { timeout: 60000 });
const ws = await page.evaluate(() => ({ err: engErr, label: wsRes && wsRes.pieces[0].label }));
const cl = await page.evaluate(() => {
  const out = {}, labels = () => closeOptions(geom()).map(o => o.edit ? editLabel(o) : itemsLabel(o.items));
  st.layout = PRESETS.ovale.items().slice(0, -3); CS.key = null;
  const o1 = closeOptions(geom()); applyClose(o1[0]);
  out["open track: first suggestion closes it exactly"] = AN.exact;
  st.layout = [{ t: "S200" }, { t: "S215" }, ...Array(2).fill({ t: "C45", d: "R" }), { t: "S200" }, ...Array(2).fill({ t: "C45", d: "R" }), { t: "S200" }, { t: "S200" }, ...Array(2).fill({ t: "C45", d: "R" }), { t: "S200" }, ...Array(2).fill({ t: "C45", d: "R" })]; CS.key = null;
  out["15 mm short: suggests swapping a straight"] = closeOptions(geom()).some(o => o.edit === "swap");
  st.layout = PRESETS.rainbow.items().filter(x => !(x.t === "RUP" && x.v === -1)); CS.key = null;
  const o3 = closeOptions(geom()).find(o => o.edit === "ins" && o.item.t === "RUP" && o.item.v === -1);
  if (o3) applyClose(o3);
  out["missing down ramp: suggests inserting it, track closes"] = !!o3 && AN.exact;
  return out;
});
for (const [k, v] of Object.entries(cl)) ok(v, k);
const sw = await page.evaluate(() => {
  const out = {}, pick = id => { render(); const k = window._swap.findIndex(o => o.id === id || o.kind === id); doSwap(window._swap[k]); };
  st.layout = PRESETS.ovale.items(); sel = 0; tab = "sum"; render(); pick("LC");
  out["swap a straight for the lane change: track closed again, piece kept"] = AN.exact && st.layout[0].t === "LC" && st.layout.filter(x => x.t === "LC").length === 2;
  st.layout = PRESETS.ovale.items(); sel = 0; render(); pick("J200");
  out["swap a straight for a jump: same length, nothing else changes"] = AN.exact && st.layout.length === 13 && st.layout[0].t === "J200";
  st.layout = PRESETS.ovale.items(); sel = 5; render(); pick("raise");
  out["raised curve: rainbow ramps around the 180° turn, still closed, 75 mm high"] = AN.exact && AN.maxZ === 75 && st.layout.filter(x => x.t === "RUP").length === 2;
  st.layout = PRESETS.rett.items(); sel = 0; render(); pick("HILL");
  out["swap for a 600 mm hill on a rectangle: closed again"] = AN.exact && st.layout[0].t === "HILL";
  return out;
});
for (const [k, v] of Object.entries(sw)) ok(v, k);
const rf = await page.evaluate(() => {
  const pts = []; for (let i = 0; i < 240; i++) { const t = i / 240 * 2 * Math.PI, rr = 1 + 0.28 * Math.sin(2 * t) + 0.18 * Math.cos(3 * t); pts.push({ x: 1150 * rr * Math.cos(t), y: 1350 * rr * Math.sin(t) }); }
  st.settings.fitLC = false; runFit(pts, "draw"); const before = AN.exact;
  commit(() => { st.layout.splice(Math.floor(st.layout.length * 0.55), 0, { t: "LC" }); const k = st.layout.findIndex((x, i) => i > 3 && x.t === "S200"); st.layout[k] = { t: "SAD" }; });
  const opened = !AN.exact; doRefit();
  return { before, opened, exact: AN.exact, lc: st.layout.filter(x => x.t === "LC").length, sad: st.layout.filter(x => x.t === "SAD").length, sketch: !!st.sketch };
});
ok(rf.before && rf.opened && rf.exact && rf.lc === 1 && rf.sad === 1 && rf.sketch, "drawn track + lane change and saddle added by hand: re-closed following the drawing, both kept", JSON.stringify(rf));
await page.evaluate(() => { st.layout = PRESETS.ovale.items(); render(); });
await page.click("#clearall");
const cleared = await page.evaluate(() => st.layout.length);
await page.click("#undo");
ok(cleared === 0 && await page.evaluate(() => st.layout.length === 13), "Clear empties the plan and Undo brings the track back");
await page.click('[data-tab="gen"]');
await page.click("#draw");
const box = await page.locator("#cv").boundingBox(), z = await page.evaluate(() => view.z);
const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
await page.mouse.move(cx + 1250 * z, cy); await page.mouse.down();
for (let i = 1; i <= 100; i++) { const t = i / 100 * 2 * Math.PI; await page.mouse.move(cx + 1250 * z * Math.cos(t), cy + 560 * z * Math.sin(t)); }
await page.mouse.up(); await page.waitForTimeout(500);
const dr = await page.evaluate(() => ({ fit: FIT, exact: AN.exact, draw: drawMode }));
const sm = await page.evaluate(() => { const pts = []; for (let i = 0; i < 160; i++) { const t = i / 160 * 2 * Math.PI; pts.push({ x: Math.sin(t) * 800, y: Math.sin(2 * t) * 350 + Math.cos(t) * 150 }); }
  st.settings.fitScale = 1; runFit(pts, "draw", { autoScale: true }); return { scale: FIT.scale, open: FIT.open, exact: AN.exact, cross: FIT.cross, bridges: FIT.bridges && FIT.bridges.made.length, clear: FIT.bridges && FIT.bridges.made[0] && FIT.bridges.made[0].clear }; });
ok(sm.scale > 2 && !sm.open && sm.exact && sm.cross === 0 && sm.bridges === 1 && sm.clear >= 60, "small figure-eight drawing: enlarged to suit the kit curves, bridge built at the crossing, still closed", JSON.stringify(sm));
ok(dr.fit && !dr.fit.open && dr.exact && !dr.draw, "drawing with the mouse becomes a closed track", JSON.stringify(dr));
const png = await page.evaluate(() => { const c = document.createElement("canvas"); c.width = 600; c.height = 380; const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, 600, 380); x.strokeStyle = "#222"; x.lineWidth = 28; x.beginPath(); x.moveTo(150, 60); x.lineTo(450, 60); x.arc(450, 190, 130, -Math.PI / 2, Math.PI / 2); x.lineTo(150, 320); x.arc(150, 190, 130, Math.PI / 2, Math.PI * 1.5); x.stroke(); return c.toDataURL("image/png"); });
const tmpPng = path.join(root, "dist", "test-oval.png"); fs.mkdirSync(path.dirname(tmpPng), { recursive: true }); fs.writeFileSync(tmpPng, Buffer.from(png.split(",")[1], "base64"));
await page.setInputFiles("#imgfile", tmpPng); await page.waitForFunction(() => FIT && FIT.src === "image", null, { timeout: 20000 });
const ig0 = await page.evaluate(() => ({ auto: st.settings.imgAuto, exact: AN.exact }));
await page.evaluate(() => { st.settings.imgAuto = 0; st.settings.imgW = 300; fitImage(); });
const ig = await page.evaluate(() => ({ fit: FIT, exact: AN.exact, w: bbox(G).w }));
ok(ig0.auto === 1 && ig0.exact && !ig.fit.open && ig.exact && ig.fit.dev < 30 && Math.abs(ig.w - 3270) < 150, "image of a layout: automatic scale, then a given width, closed both times", JSON.stringify({ ig0, ig }));
await page.evaluate(() => { st.settings.fitLC = true; });
await page.setInputFiles("#imgfile", path.join(root, "tests", "fixtures", "track-3lane.png"));
await page.waitForFunction(() => FIT && FIT.src === "image" && IMG && IMG.name === "track-3lane", null, { timeout: 30000 });
const p3 = await page.evaluate(() => ({ lanes: IMG.tr.lanes, w: Math.round(IMG.size.w), exact: AN.exact, dev: FIT.dev, cross: FIT.cross, lc: FIT.lc, br: FIT.bridges && FIT.bridges.made.length, maxZ: AN.maxZ, sup: AN.supports }));
ok(p3.lanes === 3 && Math.abs(p3.w - 4830) < 300 && p3.exact && p3.dev < 30 && p3.cross === 0 && p3.br === 1 && p3.maxZ >= 60 && p3.sup > 0 && p3.lc, "3-lane track editor picture (grid, colours, text, bridge): 3 lanes, real scale, closed, bridge with supports built", JSON.stringify(p3));
await page.evaluate(() => { tab = "bom"; renderPane(); });
ok(await page.evaluate(() => document.querySelectorAll("#pane a.ab.sm[href*='makerworld']").length > 0 && document.querySelectorAll("#pane [data-gen]").length > 0), "parts to print: MakerWorld links and Make STL buttons");
await page.click("#pane [data-gen]"); await page.waitForFunction(() => !wsBusy && wsRes && tab === "ws", null, { timeout: 60000 });
ok(await page.evaluate(() => tab === "ws" && wsRes.ok), "Make STL opens the Workshop with that piece");
ok(!ws.err && ws.label === "straight 200mm", "Workshop: the engine starts in the browser and builds the straight", JSON.stringify(ws));

const en = await page.evaluate(() => ({ lang: document.documentElement.lang, tab: document.querySelector('[data-tab="inv"]').textContent }));
ok(en.lang === "en" && en.tab === "Inventory", "starts in English", JSON.stringify(en));
await page.click("#lang");
await page.waitForFunction(() => !wsBusy && wsRes, null, { timeout: 60000 });
const it = await page.evaluate(() => ({ lang: document.documentElement.lang, tab: document.querySelector('[data-tab="inv"]').textContent, saved: localStorage.getItem("m4wd-lang"), label: wsRes.pieces[0].label, pane: document.getElementById("pane").textContent }));
ok(it.lang === "it" && it.tab === "Magazzino" && it.saved === "it" && it.label === "rettilineo 200mm" && /Piatto della stampante/.test(it.pane), "IT/EN button switches to Italian and remembers it", JSON.stringify({ ...it, pane: undefined }));
await page.reload(); await page.waitForTimeout(300);
ok(await page.evaluate(() => document.documentElement.lang === "it" && document.getElementById("lang").textContent === "EN"), "Italian kept after reload");
ok(errors.length === 0, "no JavaScript errors on the page", errors.join(" | "));
await browser.close();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
