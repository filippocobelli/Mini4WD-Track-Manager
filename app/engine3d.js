/*
 * Mini4WD Track Planner — 3D engine (MIT licence)
 *
 * Generates printable 2-lane track pieces (STL / OBJ) with the Manifold library,
 * which guarantees closed (watertight) solids. The base sizes come from the 200 mm
 * straight of the "MINI4WD 2 LANE DIY TRACK" set (MakerWorld 542904):
 *   lane 115 mm, walls and floor 2.5 mm, walls 50 mm above the floor,
 *   2 mm fillets, 30×(L-80) mm r10 slots, Tamiya connector tabs 6.4×2.8×26.3 mm
 *   with the clip notch at 22.5 mm.
 *
 * Piece coordinates: X across the track (0 = outer face of the left wall),
 * Y along the track, Z up (floor resting on the bed).
 *
 * Labels follow M4Engine.lang ("en" default, or "it").
 *
 * Usage: const E = M4Engine.create(manifoldWasm); const r = E.build({type:"straight", L:200});
 */
(function (root) {
  "use strict";

  const DEFAULTS = {
    lanes: 2, laneW: 115, wallT: 2.5, floorT: 2.5, wallH: 50, fillet: 2,
    tabs: true, tabW: 6.4, tabT: 2.8, tabH: 26.3, notchW: 3.1, notchZ: 22.5,
    slots: true, slotW: 30, slotR: 10, slotInset: 40,
    ribs: true, ribStep: 25, ribT: 3,
    bedX: 256, bedY: 256, maxSplit: 12
  };

  const API = { lang: "en" };
  const tr = (it, en) => (API.lang === "it" ? it : en);
  // A parameter: [default, min, max, label]; the label follows the current language.
  const prm = (d, mi, ma, it, en) => { const a = [d, mi, ma]; Object.defineProperty(a, 3, { get: () => tr(it, en), enumerable: true }); return a; };
  const typ = (it, en, params) => ({ get name() { return tr(it, en); }, params });

  // Elements the engine can build, with their parameters (defaults and limits for the UI)
  const TYPES = {
    straight: typ("Rettilineo", "Straight", { L: prm(200, 20, 1000, "Lunghezza (mm)", "Length (mm)") }),
    curve: typ("Curva", "Curve", { ang: prm(45, 5, 180, "Angolo (°)", "Angle (°)"), R: prm(480, 150, 2000, "Raggio in asse (mm)", "Centre-line radius (mm)") }),
    ramp: typ("Rampa", "Ramp", { L: prm(250, 80, 1000, "Lunghezza (mm)", "Length (mm)"), h: prm(75, 5, 200, "Dislivello (mm)", "Rise (mm)") }),
    hill: typ("Dosso", "Hill", { L: prm(400, 100, 1200, "Lunghezza (mm)", "Length (mm)"), h: prm(40, 5, 150, "Altezza (mm)", "Height (mm)") }),
    jump: typ("Salto", "Jump", { L: prm(200, 100, 600, "Lunghezza pezzo (mm)", "Piece length (mm)"), jl: prm(90, 30, 400, "Lunghezza rampa (mm)", "Ramp length (mm)"), jh: prm(18, 3, 45, "Altezza salto (mm)", "Jump height (mm)") }),
    saddle: typ("Sella", "Saddle", { L: prm(200, 60, 600, "Lunghezza pezzo (mm)", "Piece length (mm)"), sl: prm(80, 20, 300, "Lunghezza sella (mm)", "Saddle length (mm)"), sh: prm(12, 2, 40, "Altezza sella (mm)", "Saddle height (mm)") }),
    washboard: typ("Washboard", "Washboard", { L: prm(200, 60, 600, "Lunghezza pezzo (mm)", "Piece length (mm)"), n: prm(6, 1, 30, "Numero di dossi", "Number of bumps"), wh: prm(5, 1, 20, "Altezza dossi (mm)", "Bump height (mm)") }),
    support: typ("Supporto rialzo", "Raised support", { hs: prm(75, 10, 250, "Altezza sotto il pavimento (mm)", "Height under the floor (mm)"), d: prm(20, 10, 60, "Profondità (mm)", "Depth (mm)") })
  };

  const smootherstep = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (t * (6 * t - 15) + 10));

  /* Manifold lives in WebAssembly: objects must be freed by hand with delete().
     Every object created is registered and deleted at the end of each build. */
  function trackObjects(W) {
    if (W.__m4tracked) return W.__m4tracked;
    const reg = [], { Manifold, CrossSection } = W;
    const isObj = r => r instanceof Manifold || r instanceof CrossSection;
    const wrap = (obj, k) => {
      const f = obj[k];
      if (typeof f !== "function" || k === "constructor" || k === "delete" || /^(prototype|length|name)$/.test(k)) return;
      try { obj[k] = function (...a) { const r = f.apply(this, a); if (isObj(r)) reg.push(r); return r; }; } catch (e) { /* read-only property */ }
    };
    for (const C of [Manifold, CrossSection]) {
      for (const k of Object.getOwnPropertyNames(C.prototype)) wrap(C.prototype, k);
      for (const k of Object.getOwnPropertyNames(C)) wrap(C, k);
    }
    W.__m4tracked = reg;
    return reg;
  }
  const meshOf = m => { const g = m.getMesh(); return { vert: Float32Array.from(g.vertProperties), tri: Uint32Array.from(g.triVerts), numProp: g.numProp }; };

  function create(W) {
    const { Manifold, CrossSection } = W;
    const reg = trackObjects(W);
    const cleanup = () => { for (const o of reg.splice(0)) { try { o.delete(); } catch (e) { /* already freed */ } } };
    const width = P => P.lanes * P.laneW + (P.lanes + 1) * P.wallT;
    const laneX0 = (P, i) => P.wallT + i * (P.laneW + P.wallT); // start of lane i (inner face)

    /* U section with centre wall and fillets, in the (x, z) plane. */
    function profile(P) {
      const Wd = width(P), H = P.floorT + P.wallH, r = P.fillet;
      let cs = CrossSection.square([Wd, P.floorT]);
      for (let i = 0; i <= P.lanes; i++) cs = cs.add(CrossSection.square([P.wallT, H]).translate([i * (P.laneW + P.wallT), 0]));
      if (r > 0) {
        for (let i = 0; i <= P.lanes; i++) {
          const x0 = i * (P.laneW + P.wallT);
          const faces = [];
          if (i < P.lanes) faces.push([x0 + P.wallT, 1]);
          if (i > 0) faces.push([x0, -1]);
          for (const [xf, dir] of faces) {
            const sq = CrossSection.square([r, r]).translate([dir > 0 ? xf : xf - r, P.floorT]);
            const c = CrossSection.circle(r, 24).translate([xf + dir * r, P.floorT + r]);
            cs = cs.add(sq.subtract(c));
          }
        }
      }
      return cs;
    }

    /* Tamiya connector tab (outer side of a wall), in the straight-piece frame.
       side -1 = left (x<0), +1 = right; y from y0 to y0+tabT. */
    function tab(P, side, y0, z0) {
      const Wd = width(P), xw = side < 0 ? 0 : Wd;
      const lowW = P.notchW, highW = P.tabW - P.notchW;
      // low part next to the wall (up to the notch) + taller outer lip
      const low = Manifold.cube([lowW, P.tabT, P.notchZ]).translate([side < 0 ? xw - lowW : xw, y0, z0]);
      const high = Manifold.cube([highW, P.tabT, P.tabH]).translate([side < 0 ? xw - P.tabW : xw + lowW, y0, z0]);
      return low.add(high);
    }
    function tabsStraight(P, L, z0, z1) {
      return Manifold.union([tab(P, -1, 0, z0), tab(P, 1, 0, z0), tab(P, -1, L - P.tabT, z1), tab(P, 1, L - P.tabT, z1)]);
    }

    function slotCutterStraight(P, L, zTop) {
      if (!P.slots || L < 2 * P.slotInset + P.slotW) return null;
      const r = Math.min(P.slotR, P.slotW / 2), cut = [];
      for (let i = 0; i < P.lanes; i++) {
        const xc = laneX0(P, i) + P.laneW / 2, x0 = xc - P.slotW / 2 + r, x1 = xc + P.slotW / 2 - r;
        const y0 = P.slotInset + r, y1 = L - P.slotInset - r;
        const shape = CrossSection.hull([[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => CrossSection.circle(r, 24).translate([x, y])));
        cut.push(Manifold.extrude(shape, zTop + 2).translate([0, 0, -1]));
      }
      return Manifold.union(cut);
    }

    function ribs(P, L, zf) {
      const Wd = width(P), list = [];
      for (let y = P.ribStep / 2; y < L; y += P.ribStep) {
        const z = zf(y);
        if (z < 2) continue;
        list.push(Manifold.cube([Wd, P.ribT, z + 0.6]).translate([0, y - P.ribT / 2, 0]));
      }
      return list.length ? Manifold.union(list) : null;
    }

    /* Generic straight, with floor height zf(y) (ramps and hills). */
    function straight(P, L, zf) {
      const flat = !zf;
      const n = flat ? 1 : Math.max(2, Math.ceil(L / 4));
      let m = Manifold.extrude(profile(P), L, n).rotate([90, 0, 0]).translate([0, L, 0]);
      let zMax = 0;
      if (!flat) {
        m = m.warp(v => { v[2] += zf(v[1]); });
        for (let y = 0; y <= L; y += 2) zMax = Math.max(zMax, zf(y));
      }
      const cut = slotCutterStraight(P, L, zMax + P.floorT);
      if (cut) m = m.subtract(cut);
      if (P.tabs) m = m.add(tabsStraight(P, L, flat ? 0 : zf(0), flat ? 0 : zf(L)));
      if (!flat && P.ribs) { const rb = ribs(P, L, zf); if (rb) m = m.add(rb); }
      return m;
    }

    /* Bump inside each lane: closed (y, z) profile, extruded over the usable lane width. */
    function laneAddon(P, pts) {
      let area = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; area += x1 * y2 - x2 * y1; }
      const cs = CrossSection.ofPolygons([area < 0 ? pts.slice().reverse() : pts]);
      const gap = P.fillet + 0.6, wl = P.laneW - 2 * gap, out = []; // kept off the fillets: no coincident edges
      for (let i = 0; i < P.lanes; i++) {
        // extrude the (y, z) profile along z, then rotate: (y, z, x) -> (x, y, z)
        const a = Manifold.extrude(cs, wl).rotate([90, 0, 0]).rotate([0, 0, 90]);
        out.push(a.translate([laneX0(P, i) + gap, 0, P.floorT - 0.4]));
      }
      return Manifold.union(out);
    }

    function curve(P, angDeg, R) {
      const Wd = width(P), x0 = R - Wd / 2;
      if (x0 - (P.tabs ? P.tabW : 0) <= 5) throw new Error(tr("Raggio troppo piccolo per la larghezza della pista.", "Radius too small for the track width."));
      const segs = Math.max(6, Math.ceil(angDeg / 1.5));
      const circ = Math.max(12, Math.round(segs * 360 / angDeg));
      let m = Manifold.revolve(profile(P).translate([x0, 0]), circ, angDeg);
      // slots: arcs with rounded ends
      if (P.slots) {
        const cut = [];
        for (let i = 0; i < P.lanes; i++) {
          const rc = x0 + laneX0(P, i) + P.laneW / 2, half = P.slotW / 2;
          const d = (P.slotInset + half) / rc, span = angDeg * Math.PI / 180 - 2 * d;
          if (span <= 0.02) continue;
          const ring = CrossSection.square([P.slotW, P.floorT + 2]).translate([rc - half, -1]);
          cut.push(Manifold.revolve(ring, circ, span * 180 / Math.PI).rotate([0, 0, d * 180 / Math.PI]));
          for (const a of [d, d + span]) cut.push(Manifold.cylinder(P.floorT + 2, half, half, 32).translate([rc * Math.cos(a), rc * Math.sin(a), -1]));
        }
        if (cut.length) m = m.subtract(Manifold.union(cut));
      }
      if (P.tabs) {
        const t0 = Manifold.union([tab(P, -1, 0, 0), tab(P, 1, 0, 0)]).translate([x0, 0, 0]);
        const t1 = Manifold.union([tab(P, -1, -P.tabT, 0), tab(P, 1, -P.tabT, 0)]).translate([x0, 0, 0]).rotate([0, 0, angDeg]);
        m = m.add(t0).add(t1);
      }
      return m;
    }

    /* Support for raised sections: base, three posts, top plate and two side stops
       (wide enough to leave room for the connector tabs at the joints). */
    function support(P, hs, d) {
      const Wd = width(P), t = 3, post = 10, side = (P.tabs ? P.tabW : 0) + 0.5, top = Wd + 2 * side;
      const C = (sx, sz, x, z) => Manifold.cube([sx, d, sz]).translate([x, 0, z]);
      return Manifold.union([
        C(top, t, -side, 0),
        C(post, hs, -side, 0), C(post, hs, Wd + side - post, 0), C(post, hs, Wd / 2 - post / 2, 0),
        C(top, t, -side, hs - t),
        C(2.5, 10, -side, hs - t), C(2.5, 10, Wd + side - 2.5, hs - t)
      ]);
    }

    /* --- sizes, bed, export --- */
    function hull2(pts) {
      pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lo = [], up = [];
      for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
      for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
      return lo.slice(0, -1).concat(up.slice(0, -1));
    }
    /* Tries to fit the piece on the bed by rotating it in plane (1° steps). */
    function bedFit(m, P) {
      const { vertProperties: v, numProp } = m.getMesh();
      const pts = []; for (let i = 0; i < v.length; i += numProp) pts.push([v[i], v[i + 1]]);
      const h = hull2(pts); let best = null;
      for (let deg = 0; deg < 180; deg += 1) {
        const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const [x, y] of h) { const X = x * c - y * s, Y = x * s + y * c; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
        const w = x1 - x0, d = y1 - y0, ok = (w <= P.bedX && d <= P.bedY);
        const score = Math.max(w / P.bedX, d / P.bedY);
        if (!best || (ok && !best.ok) || (ok === best.ok && score < best.score)) best = { ok, deg, w, d, score };
      }
      return best;
    }
    /* Rotates for the bed and puts the piece in the centre, minimum z at 0. */
    function placeForPrint(m, fit) {
      let o = fit && fit.deg ? m.rotate([0, 0, fit.deg]) : m;
      const b = o.boundingBox();
      return o.translate([-(b.min[0] + b.max[0]) / 2, -(b.min[1] + b.max[1]) / 2, -b.min[2]]);
    }
    function info(m) {
      const b = m.boundingBox();
      return { size: [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]], volume: m.volume() / 1000, tris: m.numTri() };
    }

    /* Builds an element; if it does not fit the bed it is split into equal parts. */
    function build(spec, prm) {
      const P = Object.assign({}, DEFAULTS, prm || {});
      const T = spec.type, g = k => +(spec[k] ?? TYPES[T].params[k][0]);
      const pieces = [];
      const make = (n) => {
        if (T === "curve") { const a = g("ang") / n; return [{ m: curve(P, a, g("R")), qty: n, label: `${tr("curva", "curve")} ${fmt(a)}° R${fmt(g("R"))}` }]; }
        if (T === "support") return [{ m: support(P, g("hs"), g("d")), qty: 1, label: `${tr("supporto", "support")} h${fmt(g("hs"))}` }];
        const L = g("L");
        if (T === "straight") return [{ m: straight(P, L / n), qty: n, label: `${tr("rettilineo", "straight")} ${fmt(L / n)}mm` }];
        if (T === "ramp" || T === "hill") {
          const h = g("h"), zf = T === "ramp" ? (y => h * smootherstep(y / L)) : (y => h * Math.sin(Math.PI * y / L) ** 2);
          const out = [], seg = L / n;
          const nm = TYPES[T].name.toLowerCase();
          for (let i = 0; i < n; i++) out.push({ m: straight(P, seg, y => zf(y + i * seg)), qty: 1, label: `${nm} ${fmt(L)}x${fmt(h)} ${tr("parte", "part")} ${i + 1}${tr("di", "of")}${n}` });
          if (n === 1) out[0].label = `${nm} ${fmt(L)}x${fmt(h)}mm`;
          return out;
        }
        // elements with bumps in the lanes: not divisible
        let base = straight(P, L), pts;
        if (T === "jump") { const jl = Math.min(g("jl"), L - 20), y0 = (L - jl) / 2, y1 = y0 + jl; pts = [[y0, 0], [y1, g("jh")], [y1, 0]]; }
        else if (T === "saddle") { const sl = Math.min(g("sl"), L - 20), y0 = (L - sl) / 2; pts = [[y0, 0], [y0 + sl / 2, g("sh")], [y0 + sl, 0]]; }
        else if (T === "washboard") {
          const nb = Math.max(1, Math.round(g("n"))), y0 = 20, y1 = L - 20, step = (y1 - y0) / nb; pts = [[y0, 0]];
          for (let k = 0; k <= nb * 12; k++) { const y = y0 + k * step / 12; pts.push([y, g("wh") * Math.sin(Math.PI * (k % 12) / 12) ** 2 + 0.2]); } // valleys 0.2 mm inside the floor
          pts.push([y1, 0]);
        }
        return [{ m: base.add(laneAddon(P, pts)), qty: 1, label: `${TYPES[T].name.toLowerCase()} ${fmt(L)}mm` }];
      };
      const divisible = ["straight", "curve", "ramp", "hill"].includes(T);
      let n = 1, parts, fits;
      while (true) {
        parts = make(n);
        fits = parts.map(p => bedFit(p.m, P));
        if (fits.every(f => f.ok) || !divisible || n >= P.maxSplit) break;
        n++;
      }
      for (let i = 0; i < parts.length; i++) {
        const m = placeForPrint(parts[i].m, fits[i]);
        pieces.push({ label: parts[i].label, qty: parts[i].qty, fit: fits[i], mesh: meshOf(m), ...info(m), status: m.status() });
      }
      return { type: T, split: n, pieces, ok: fits.every(f => f.ok), P };
    }
    function safeBuild(spec, prm) { try { return build(spec, prm); } finally { cleanup(); } }

    return { build: safeBuild, width, pending: () => reg.length };
  }

  /* --- file formats --- */
  function toSTL(mesh, name) {
    const v = mesh.vert, t = mesh.tri, numProp = mesh.numProp || 3;
    const nt = t.length / 3, buf = new ArrayBuffer(84 + nt * 50), dv = new DataView(buf);
    const head = ("Mini4WD Track Planner - " + (name || "piece")).slice(0, 80);
    for (let i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i) & 127);
    dv.setUint32(80, nt, true);
    let o = 84;
    for (let i = 0; i < nt; i++) {
      const a = t[3 * i] * numProp, b = t[3 * i + 1] * numProp, c = t[3 * i + 2] * numProp;
      const ux = v[b] - v[a], uy = v[b + 1] - v[a + 1], uz = v[b + 2] - v[a + 2];
      const wx = v[c] - v[a], wy = v[c + 1] - v[a + 1], wz = v[c + 2] - v[a + 2];
      let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const l = Math.hypot(nx, ny, nz) || 1;
      for (const x of [nx / l, ny / l, nz / l]) { dv.setFloat32(o, x, true); o += 4; }
      for (const k of [a, b, c]) for (let j = 0; j < 3; j++) { dv.setFloat32(o, v[k + j], true); o += 4; }
      dv.setUint16(o, 0, true); o += 2;
    }
    return new Uint8Array(buf);
  }
  function toOBJ(mesh, name) {
    const v = mesh.vert, t = mesh.tri, numProp = mesh.numProp || 3, out = [`# Mini4WD Track Planner - ${name || "piece"} (mm)`, `o ${(name || "piece").replace(/\s+/g, "_")}`];
    for (let i = 0; i < v.length; i += numProp) out.push(`v ${v[i].toFixed(4)} ${v[i + 1].toFixed(4)} ${v[i + 2].toFixed(4)}`);
    for (let i = 0; i < t.length; i += 3) out.push(`f ${t[i] + 1} ${t[i + 1] + 1} ${t[i + 2] + 1}`);
    return new TextEncoder().encode(out.join("\n") + "\n");
  }
  /* Uncompressed ZIP ("store" method), enough to bundle several files. */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = d => { let c = 0xFFFFFFFF; for (let i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) {
    const enc = new TextEncoder(), chunks = [], central = []; let off = 0;
    for (const f of files) {
      const name = enc.encode(f.name), data = f.data instanceof Uint8Array ? f.data : enc.encode(f.data), crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
      chunks.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    }
    const csize = central.reduce((s, a) => s + a.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    const all = [...chunks, ...central, new Uint8Array(e.buffer)], out = new Uint8Array(all.reduce((s, a) => s + a.length, 0));
    let p = 0; for (const a of all) { out.set(a, p); p += a.length; }
    return out;
  }
  function fmt(x) { const s = String(Math.round(x * 10) / 10); return API.lang === "it" ? s.replace(".", ",") : s; }

  root.M4Engine = Object.assign(API, { create, DEFAULTS, TYPES, toSTL, toOBJ, zip, smootherstep });
})(typeof globalThis !== "undefined" ? globalThis : this);
