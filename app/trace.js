/*
 * Mini4WD Track Planner — layout solver and tracing (MIT licence)
 *
 *   close(end, start, cat, opt)   pieces that bring a pose back to the start pose
 *                                 (position, heading and height), from the catalogue
 *                                 and, if allowed, made-to-measure Workshop pieces
 *   fitPath(points, cat, opt)     turns a closed polyline in mm (a sketch) into pieces
 *   traceImage(rgba, w, h)        finds the centre line of a track drawn in an image
 *
 * Poses: {x, y, h, z} in mm and radians, y pointing down like the SVG plan.
 * A curve turns right when s = +1 and left when s = -1 (same as the planner).
 *
 * cat = { straights: [{id, len}], curve: {id, ang, r}, ramps: [{id, len, dz}],
 *         lookup(id) -> {kind, len, ang, r, dz} }
 * Items returned: {t: id, d?: "L"|"R", v?: 1|-1} for catalogue pieces,
 *                 {gen: {type, L | ang+R | L+h}, d?, v?} for made-to-measure pieces.
 */
(function (root) {
  "use strict";
  const DEG = Math.PI / 180;
  const norm = d => { d = ((d % 360) + 540) % 360 - 180; return d <= -180 + 1e-9 ? 180 : d; };

  function step(p, pc) {
    const dz = pc.dz || 0;
    if (pc.kind === "curve") {
      const s = pc.s, a = pc.ang * DEG, R = pc.r, h2 = p.h + s * a;
      const cx = p.x - s * R * Math.sin(p.h), cy = p.y + s * R * Math.cos(p.h);
      return { x: cx + s * R * Math.sin(h2), y: cy - s * R * Math.cos(h2), h: h2, z: p.z + dz };
    }
    return { x: p.x + pc.len * Math.cos(p.h), y: p.y + pc.len * Math.sin(p.h), h: p.h, z: p.z + dz };
  }
  function at(p, pc, u) {
    if (pc.kind === "curve") {
      const s = pc.s, R = pc.r, h = p.h + s * pc.ang * DEG * u;
      const cx = p.x - s * R * Math.sin(p.h), cy = p.y + s * R * Math.cos(p.h);
      return { x: cx + s * R * Math.sin(h), y: cy - s * R * Math.cos(h) };
    }
    return { x: p.x + pc.len * u * Math.cos(p.h), y: p.y + pc.len * u * Math.sin(p.h) };
  }
  const lengthOf = pc => pc.kind === "curve" ? pc.r * pc.ang * DEG : pc.len;

  /* Piece geometry of an item. */
  function pieceOf(it, cat) {
    if (it.gen) {
      const g = it.gen;
      if (g.type === "curve") return { kind: "curve", ang: g.ang, r: g.R, s: it.d === "L" ? -1 : 1 };
      if (g.type === "ramp") return { kind: "straight", len: g.L, dz: g.h * (it.v || 1) };
      return { kind: "straight", len: g.L };
    }
    const t = cat.lookup(it.t);
    if (!t) return null;
    if (t.kind === "curve") return { kind: "curve", ang: t.ang, r: t.r, s: it.d === "L" ? -1 : 1, dz: (t.dz || 0) * (it.v || 1) };
    return { kind: "straight", len: t.len, dz: (t.dz || 0) * (it.v || 1) };
  }
  function run(p, items, cat) { for (const it of items) { const pc = pieceOf(it, cat); if (pc) p = step(p, pc); } return p; }
  function residual(p, start) {
    const gx = start.x - p.x, gy = start.y - p.y;
    return { dist: Math.hypot(gx, gy), dh: norm((start.h - p.h) / DEG), dz: p.z - start.z,
      along: gx * Math.cos(p.h) + gy * Math.sin(p.h), lat: -gx * Math.sin(p.h) + gy * Math.cos(p.h) };
  }

  /* Every length you can make with up to maxN catalogue straights (fewest pieces for each length). */
  function stockSums(straights, maxN) {
    const m = new Map();
    const list = straights.slice().sort((a, b) => b.len - a.len);
    (function rec(i, len, ids) {
      const k = Math.round(len * 10), e = m.get(k);
      if (!e || e.ids.length > ids.length) m.set(k, { len, ids: ids.slice() });
      if (ids.length >= maxN) return;
      for (let j = i; j < list.length; j++) { ids.push(list[j].id); rec(j, len + list[j].len, ids); ids.pop(); }
    })(0, 0, []);
    return [...m.values()].sort((a, b) => a.len - b.len);
  }
  function nearest(sums, len) {
    let lo = 0, hi = sums.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (sums[mid].len < len) lo = mid; else hi = mid; }
    return Math.abs(sums[lo].len - len) <= Math.abs(sums[hi].len - len) ? sums[lo] : sums[hi];
  }
  /* A length made of catalogue straights, plus at most one made-to-measure straight. */
  function fill(sums, len, o) {
    if (len < o.tolStock) return { ids: [], custom: 0 };
    const n = nearest(sums, len);
    if (Math.abs(n.len - len) <= o.tolStock) return { ids: n.ids, custom: 0 };
    if (!o.allowCustom) return null;
    let best = null;
    for (const s of sums) {
      const rest = len - s.len;
      if (rest < o.minCustom) break;
      if (rest > o.maxCustom) continue;
      if (!best || s.ids.length < best.s.ids.length || (s.ids.length === best.s.ids.length && rest < best.rest)) best = { s, rest };
    }
    if (!best) return null;
    return { ids: best.s.ids, custom: Math.round(best.rest * 10) / 10 };
  }
  function* signSeqs(n, minus) {
    const a = new Array(n).fill(1);
    function* rec(i, left) {
      if (left === 0) { yield a.slice(); return; }
      for (let k = i; k <= n - left; k++) { a[k] = -1; yield* rec(k + 1, left - 1); a[k] = 1; }
    }
    yield* rec(0, minus);
  }

  /*
   * Pieces that take `end` back to `start`. The curves fix the heading, then up to two
   * groups of straights placed between them fix the position: their lengths come from
   * a 2×2 linear system and are then made with catalogue straights (or one custom piece).
   */
  function close(end, start, cat, opt) {
    const o = Object.assign({ tol: 3, tolStock: 1, allowCustom: true, minCustom: 20, maxCustom: 250, maxCurves: 10, maxPairs: 2 }, opt || {});
    const sums = stockSums(cat.straights, 8);
    const out = [], seen = new Set();
    const dzNeed = start.z - end.z;
    // height: ramps go first, right after the end of the track
    let ramp = [], rampLen = 0, rampCustom = 0;
    if (Math.abs(dzNeed) >= 1) {
      const v = dzNeed > 0 ? 1 : -1;
      const r = (cat.ramps || []).map(r => ({ r, k: Math.round(Math.abs(dzNeed) / r.dz) }))
        .find(x => x.k >= 1 && x.k <= 3 && Math.abs(x.k * x.r.dz - Math.abs(dzNeed)) < 1);
      if (r) { for (let i = 0; i < r.k; i++) ramp.push({ t: r.r.id, v }); rampLen = r.k * r.r.len; }
      else if (o.allowCustom) {
        const h = Math.round(Math.abs(dzNeed) * 10) / 10, L = Math.max(150, Math.min(600, Math.round(h * 3.3 / 10) * 10));
        ramp.push({ gen: { type: "ramp", L, h }, v }); rampLen = L; rampCustom = 1;
      } else return [];
    }
    const cv = cat.curve;
    if (!cv) return [];
    const dh = norm((start.h - end.h) / DEG);
    for (const T of [dh, dh - 360, dh + 360]) {
      if (Math.abs(T) > 225 + 1e-6) continue;
      const kn = Math.round(T / cv.ang), rem = T - kn * cv.ang;
      let extra = null;
      if (Math.abs(rem) > 0.05) {
        if (!o.allowCustom || Math.abs(rem) < 1) continue;
        extra = { ang: Math.round(Math.abs(rem) * 100) / 100, s: rem > 0 ? 1 : -1 };
      }
      for (let m = 0; m <= o.maxPairs; m++) {
        const n = Math.abs(kn) + 2 * m;
        if (n > o.maxCurves) continue;
        const minus = kn >= 0 ? m : Math.abs(kn) + m;
        for (const signs of signSeqs(n, minus)) {
          const toks = signs.map(s => ({ kind: "curve", ang: cv.ang, r: cv.r, s, id: cv.id }));
          if (extra) toks.push({ kind: "curve", ang: extra.ang, r: cv.r, s: extra.s, custom: true });
          let p = { x: end.x, y: end.y, h: end.h, z: 0 };
          if (rampLen) p = step(p, { kind: "straight", len: rampLen });
          const hs = [p.h];
          for (const tk of toks) { p = step(p, tk); hs.push(p.h); }
          const gx = start.x - p.x, gy = start.y - p.y;
          const U = hs.map(h => [Math.cos(h), Math.sin(h)]);
          const cands = [];
          if (Math.hypot(gx, gy) <= o.tolStock) cands.push({});
          for (let i = 0; i < U.length; i++) {
            const along = gx * U[i][0] + gy * U[i][1], cross = Math.abs(gx * U[i][1] - gy * U[i][0]);
            if (along > 0 && cross <= o.tolStock) cands.push({ [i]: along });
          }
          for (let i = 0; i < U.length; i++) for (let j = i + 1; j < U.length; j++) {
            const det = U[i][0] * U[j][1] - U[i][1] * U[j][0];
            if (Math.abs(det) < 0.2) continue;
            const a = (gx * U[j][1] - gy * U[j][0]) / det, b = (U[i][0] * gy - U[i][1] * gx) / det;
            if (a > 0.5 && b > 0.5) cands.push({ [i]: a, [j]: b });
          }
          for (const c of cands) {
            const fills = {}; let ok = true, custom = rampCustom + (extra ? 1 : 0);
            for (const k in c) { const f = fill(sums, c[k], o); if (!f) { ok = false; break; } fills[k] = f; if (f.custom) custom++; }
            if (!ok) continue;
            const items = ramp.slice();
            const put = k => { const f = fills[k]; if (!f) return; for (const id of f.ids) items.push({ t: id }); if (f.custom) items.push({ gen: { type: "straight", L: f.custom } }); };
            put(0);
            toks.forEach((tk, i) => {
              items.push(tk.custom ? { gen: { type: "curve", ang: tk.ang, R: tk.r }, d: tk.s < 0 ? "L" : "R" } : { t: tk.id, d: tk.s < 0 ? "L" : "R" });
              put(i + 1);
            });
            const res = residual(run({ ...end }, items, cat), start);
            if (res.dist > o.tol || Math.abs(res.dh) > 0.5 || Math.abs(res.dz) >= 1) continue;
            const key = items.map(it => it.t ? it.t + (it.d || "") + (it.v || "") : JSON.stringify(it)).join(",");
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({ items, custom, pieces: items.length, err: res.dist, cost: custom * 1000 + items.length * 10 + n * 6 + m * 40 + res.dist * 5 });
          }
        }
      }
    }
    return out.sort((a, b) => a.cost - b.cost).slice(0, 12);
  }

  /* Evenly spaced points (every `d` mm) along a closed polyline. */
  function resample(pts, d) {
    const P = pts.concat([pts[0]]), out = [];
    let carry = 0;
    for (let i = 0; i + 1 < P.length; i++) {
      const a = P[i], b = P[i + 1], L = Math.hypot(b.x - a.x, b.y - a.y);
      let t = carry;
      while (t < L) { out.push({ x: a.x + (b.x - a.x) * t / L, y: a.y + (b.y - a.y) * t / L }); t += d; }
      carry = t - L;
    }
    return out;
  }
  const polyLen = pts => pts.reduce((s, p, i) => s + Math.hypot(pts[(i + 1) % pts.length].x - p.x, pts[(i + 1) % pts.length].y - p.y), 0);

  /*
   * Fits catalogue pieces to a closed sketch with a beam search: every step adds the
   * piece whose path stays closest to the sketch, then close() completes the loop.
   */
  function fitPath(pts, cat, opt) {
    const o = Object.assign({ step: 10, beam: 60, allowCustom: true, lc: null, tol: 3 }, opt || {});
    if (pts.length < 3 || polyLen(pts) < 800) return { err: "short" };
    let P = resample(pts, o.step);
    const N0 = P.length;
    // start on the straightest stretch whose direction is closest to a multiple of 45°
    const w = Math.min(30, Math.floor(N0 / 8));
    let bi = 0, bs = Infinity;
    // opt.start: keep the given start pose (re-closing an existing track), the sketch begins there
    for (let i = 0; i < N0 && !o.start; i++) {
      const a = P[(i - w + N0) % N0], b = P[(i + w) % N0];
      const straight = Math.hypot(b.x - a.x, b.y - a.y) / (2 * w * o.step);
      const ang = Math.atan2(b.y - a.y, b.x - a.x) / DEG, off = Math.abs(norm(ang - Math.round(ang / 45) * 45));
      const sc = (1 - straight) * 40 + off / 90;
      if (sc < bs) { bs = sc; bi = i; }
    }
    P = P.slice(bi).concat(P.slice(0, bi));
    const N = P.length;
    const a0 = P[N - w], b0 = P[w];
    let h0 = Math.atan2(b0.y - a0.y, b0.x - a0.x) / DEG;
    const snap = Math.round(h0 / 45) * 45;
    h0 = (Math.abs(norm(h0 - snap)) < 4 ? snap : Math.round(h0 * 2) / 2) * DEG;
    const start = o.start ? { x: o.start.x, y: o.start.y, h: o.start.h, z: 0 } : { x: P[0].x, y: P[0].y, h: h0, z: 0 };
    // opt.require: pieces that must stay in the track, in order, near a fraction f of the lap
    // ({it, pc, f}); they are placed when the search gets there (±slack along the sketch)
    const endZone = Math.round(250 / o.step), candZone = Math.round(2200 / o.step), slack = Math.round(600 / o.step);
    const req = (o.require || []).map(r => {
      const L = lengthOf(r.pc) / o.step;
      return { ...r, at: Math.max(0, Math.min(N - endZone - Math.ceil(L) - 1, Math.round(r.f * N - L / 2))) };
    });
    if (req.some(r => r.pc.kind === "straight" && o.lc && r.it.t === o.lc.id)) o.lc = null;

    const opts = [];
    for (const s of cat.straights) opts.push({ it: { t: s.id }, pc: { kind: "straight", len: s.len } });
    if (o.lc) opts.push({ it: { t: o.lc.id }, pc: { kind: "straight", len: o.lc.len }, lc: true });
    if (cat.curve) for (const d of ["L", "R"]) opts.push({ it: { t: cat.curve.id, d }, pc: { kind: "curve", ang: cat.curve.ang, r: cat.curve.r, s: d === "L" ? -1 : 1 } });
    const near = (q, s0, s1) => {
      let bd = Infinity, bi2 = s0;
      for (let i = Math.max(0, s0); i <= Math.min(N - 1, s1); i++) { const d = (P[i].x - q.x) ** 2 + (P[i].y - q.y) ** 2; if (d < bd) { bd = d; bi2 = i; } }
      return { d: Math.sqrt(bd), i: bi2 };
    };
    // cost of a piece: how far it strays from the sketch (window of the sketch around the progress)
    const pieceCost = (p, pc, s0, s1) => {
      const L = lengthOf(pc); let c = 0, sEnd = s0;
      for (const u of [0.25, 0.5, 0.75, 1]) { const r = near(at(p, pc, u), s0, s1); c += r.d * r.d; if (u === 1) sEnd = r.i; }
      return { c: c / 4 / 100 * (L / 200) + 2, sEnd };
    };
    let beam = [{ p: start, s: 0, items: [], cost: 0, rq: 0 }], cands = [];
    const seenG = new Map();
    for (let it = 0; it < 400 && beam.length; it++) {
      const next = [];
      for (const b of beam) {
        const Rq = req[b.rq];
        if (Rq && b.s > Rq.at + slack) continue;
        const ops = Rq && b.s >= Rq.at - slack ? opts.concat([{ it: Rq.it, pc: Rq.pc, req: true }]) : opts;
        for (const op of ops) {
          const L = lengthOf(op.pc), r = pieceCost(b.p, op.pc, b.s, b.s + Math.ceil(L / o.step * 1.8) + 20);
          if (op.lc && b.lc) continue;
          let c = r.c + (op.lc ? -6 : 0) + (op.req ? -8 : 0);
          if (r.sEnd < b.s + L / o.step * 0.4 && !(op.req && L < 8)) c += 50;
          next.push({ p: step(b.p, op.pc), s: op.req ? Math.max(r.sEnd, b.s) : r.sEnd, items: b.items.concat([op.it]), cost: b.cost + c, lc: b.lc || !!op.lc, rq: b.rq + (op.req ? 1 : 0) });
        }
      }
      next.sort((a, b) => a.cost - b.cost);
      const keep = [], keys = new Set();
      let nc = 0;
      for (const n of next) {
        const k = Math.round(n.p.x / 25) + "," + Math.round(n.p.y / 25) + "," + Math.round(norm(n.p.h / DEG)) + (n.lc ? "L" : "") + "/" + n.rq;
        if (keys.has(k)) continue; keys.add(k);
        const g0 = seenG.get(k); if (g0 != null && g0 <= n.cost) continue; seenG.set(k, n.cost);
        if (n.s >= N - candZone && nc < 10 && n.rq === req.length) { cands.push(n); nc++; }
        if (n.s < N - endZone) keep.push(n);
        if (keep.length >= o.beam) break;
      }
      beam = keep;
    }
    cands.sort((a, b) => a.cost / Math.max(1, a.s) - b.cost / Math.max(1, b.s));
    let best = null;
    for (const d of cands.slice(0, 80)) {
      const sols = close(d.p, start, cat, { tol: o.tol, allowCustom: o.allowCustom, maxPairs: 2, maxCurves: 8 });
      for (const s of sols.slice(0, 4)) {
        let p = d.p, dev = 0, s0 = d.s;
        for (const it of s.items) { const pc = pieceOf(it, cat); const r = pieceCost(p, pc, Math.max(0, s0 - 5), N - 1); dev += r.c; s0 = Math.max(s0, r.sEnd); p = step(p, pc); }
        const cost = d.cost + dev + s.custom * 40;
        if (!best || cost < best.cost) best = { items: d.items.concat(s.items), cost, custom: s.custom };
      }
    }
    const done = cands;
    if (!best) { const d = done.sort((a, b) => b.s - a.s || a.cost - b.cost)[0] || beam[0]; if (!d) return { err: "nofit" }; best = { items: d.items, cost: d.cost, open: true, custom: 0 }; }
    // lane change: replaces consecutive straights that add up to its length
    if (o.lc && best.items.some(it => it.t === o.lc.id)) best.lc = true;
    else if (o.lc && !req.length) {
      const its = best.items, lenOf = it => { const pc = it.t && !it.gen ? pieceOf(it, cat) : null; return pc && pc.kind === "straight" && !pc.dz ? pc.len : null; };
      let done2 = false;
      for (let i = 0; i < its.length && !done2; i++) {
        let s = 0;
        for (let j = i; j < its.length; j++) {
          const l = lenOf(its[j]); if (l == null) break;
          s += l;
          if (Math.abs(s - o.lc.len) < 0.5) { its.splice(i, j - i + 1, { t: o.lc.id }); done2 = true; break; }
          if (s > o.lc.len) break;
        }
      }
      best.lc = done2;
    }
    // mean distance from the sketch
    let p = start, dev = 0, n = 0;
    for (const it of best.items) { const pc = pieceOf(it, cat); if (!pc) continue; for (const u of [0.5, 1]) { dev += near(at(p, pc, u), 0, N - 1).d; n++; } p = step(p, pc); }
    const res = residual(p, start);
    return { items: best.items, start, open: !!best.open || res.dist > o.tol || Math.abs(res.dh) > 0.5, custom: best.custom, lc: best.lc, dev: n ? dev / n : 0, sketch: P };
  }

  /* ---------- image → centre line ---------- */
  const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  function dirOf(dx, dy) { for (let i = 0; i < 8; i++) if (DIRS[i][0] === dx && DIRS[i][1] === dy) return i; return 4; }
  /* Moore-neighbour tracing of the outer boundary of the region containing the first set pixel. */
  function contour(mask, w, h) {
    let start = -1;
    for (let i = 0; i < w * h; i++) if (mask[i]) { start = i; break; }
    if (start < 0) return [];
    const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x];
    let x = start % w, y = (start / w) | 0, bd = 4;
    const sx = x, sy = y, pts = [{ x, y }];
    for (let it = 0; it < w * h * 2; it++) {
      let moved = false;
      for (let k = 1; k <= 8; k++) {
        const nd = (bd + k) % 8, nx = x + DIRS[nd][0], ny = y + DIRS[nd][1];
        if (on(nx, ny)) {
          const pd = (nd + 7) % 8, bx = x + DIRS[pd][0], by = y + DIRS[pd][1];
          if (x === sx && y === sy && pts.length > 2 && nx === pts[1].x && ny === pts[1].y) return pts;
          x = nx; y = ny; bd = dirOf(bx - x, by - y); moved = true; break;
        }
      }
      if (!moved) break;
      if (x === sx && y === sy && pts.length > 2 && it > w * h) break;
      if (!(x === sx && y === sy)) pts.push({ x, y });
    }
    return pts;
  }
  function components(mask, w, h, value) {
    const lab = new Int32Array(w * h).fill(-1), comps = [], q = new Int32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (mask[i] !== value || lab[i] >= 0) continue;
      const id = comps.length; let qh = 0, qt = 0, area = 0, border = false;
      q[qt++] = i; lab[i] = id;
      while (qh < qt) {
        const c = q[qh++], cx = c % w, cy = (c / w) | 0; area++;
        if (cx === 0 || cy === 0 || cx === w - 1 || cy === h - 1) border = true;
        const nb = [cx > 0 ? c - 1 : -1, cx < w - 1 ? c + 1 : -1, cy > 0 ? c - w : -1, cy < h - 1 ? c + w : -1];
        for (const n of nb) if (n >= 0 && mask[n] === value && lab[n] < 0) { lab[n] = id; q[qt++] = n; }
      }
      comps.push({ id, area, border });
    }
    return { lab, comps };
  }
  function morph(mask, w, h, grow) {
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let v = grow ? 0 : 1;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy, m = X >= 0 && Y >= 0 && X < w && Y < h ? mask[Y * w + X] : 0;
        if (grow && m) v = 1; if (!grow && !m) v = 0;
      }
      out[y * w + x] = v;
    }
    return out;
  }
  function smoothLoop(pts, k) {
    const n = pts.length, out = [];
    for (let i = 0; i < n; i++) { let x = 0, y = 0; for (let j = -k; j <= k; j++) { const p = pts[(i + j + n) % n]; x += p.x; y += p.y; } out.push({ x: x / (2 * k + 1), y: y / (2 * k + 1) }); }
    return out;
  }
  /*
   * rgba: Uint8ClampedArray (w×h×4). The track is the largest connected shape that stands
   * out from the background (dark on light or light on dark). If it is a closed band, the
   * centre line runs halfway between its outer edge and the edge of its inner hole.
   */
  function traceImage(rgba, w, h) {
    const g = new Uint8Array(w * h), hist = new Array(256).fill(0);
    for (let i = 0; i < w * h; i++) {
      const a = rgba[4 * i + 3] / 255;
      const v = Math.round((0.299 * rgba[4 * i] + 0.587 * rgba[4 * i + 1] + 0.114 * rgba[4 * i + 2]) * a + 255 * (1 - a));
      g[i] = v; hist[v]++;
    }
    // Otsu threshold
    let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sB = 0, wB = 0, best = 0, th = 128;
    for (let t = 0; t < 256; t++) {
      wB += hist[t]; if (!wB) continue; const wF = w * h - wB; if (!wF) break;
      sB += t * hist[t]; const mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) ** 2;
      if (v > best) { best = v; th = t; }
    }
    let fg = new Uint8Array(w * h), cnt = 0;
    for (let i = 0; i < w * h; i++) if (g[i] <= th) { fg[i] = 1; cnt++; }
    if (cnt > w * h / 2) for (let i = 0; i < w * h; i++) fg[i] = 1 - fg[i];
    fg = morph(morph(fg, w, h, true), w, h, false);
    const C = components(fg, w, h, 1);
    if (!C.comps.length) return { err: "empty" };
    const big = C.comps.reduce((a, b) => b.area > a.area ? b : a);
    if (big.area < w * h * 0.002) return { err: "empty" };
    const shape = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) if (C.lab[i] === big.id) shape[i] = 1;
    // holes of the shape: background areas that don't touch the border
    const H = components(shape, w, h, 0);
    const holes = H.comps.filter(c => !c.border).sort((a, b) => b.area - a.area);
    const filled = shape.slice();
    for (let i = 0; i < w * h; i++) if (shape[i] === 0 && !H.comps[H.lab[i]].border) filled[i] = 1;
    const outer = contour(filled, w, h);
    if (outer.length < 20) return { err: "empty" };
    let line = outer, band = false;
    if (holes.length && holes[0].area > big.area * 0.05) {
      const hm = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) if (H.lab[i] === holes[0].id) hm[i] = 1;
      const inner = contour(hm, w, h);
      if (inner.length > 10) {
        const step2 = Math.max(1, Math.floor(outer.length / 400)), mids = [];
        for (let i = 0; i < outer.length; i += step2) {
          const a = outer[i]; let bd = Infinity, b = inner[0];
          for (const q of inner) { const d = (q.x - a.x) ** 2 + (q.y - a.y) ** 2; if (d < bd) { bd = d; b = q; } }
          mids.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
        }
        line = mids; band = true;
      }
    }
    line = smoothLoop(resample(line, Math.max(1, Math.min(w, h) / 200)), 4);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of line) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    return { pts: line, band, bbox: { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 } };
  }

  root.M4Trace = { close, fitPath, traceImage, step, residual, run, pieceOf, resample };
})(typeof window !== "undefined" ? window : globalThis);
