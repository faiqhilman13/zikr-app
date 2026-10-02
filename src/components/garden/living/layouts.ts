import type { BiomeId } from '../../../domain/types';
import { FLOWER_SLOTS } from './growth';
import { lerp, seeded } from './random';
import { rows, scatter, W, type Box, type Layout, type Slot } from './scene';
import { growOlive } from './tree';

/** Where each garden's window, tree, beds and camera are. */

export const ARCH = 'M0 300 L0 116 A232 232 0 0 1 200 3 A232 232 0 0 1 400 116 L400 300 Z';
export const KAMPUNG_FRAME = 'M0 300 L0 44 Q0 10 34 10 L366 10 Q400 10 400 44 L400 300 Z';
export const DOORWAY = 'M0 300 L0 0 L400 0 L400 300 Z';
export const OGEE = 'M0 300 L0 128 C0 84 96 74 150 48 C178 34 194 20 200 2 C206 20 222 34 250 48 C304 74 400 84 400 128 L400 300 Z';

export const POMEGRANATE = growOlive(29, 4);
export const RAMBUTAN = growOlive(61, 4);
export const APRICOT = growOlive(83, 4);

/* The courtyard's two beds either side of the stone path. */
const ANDALUSIA_BEDS: Slot[] = (() => {
  const random = seeded(101);
  const slots: Slot[] = [];
  while (slots.length < FLOWER_SLOTS) {
    const left = slots.length % 2 === 0;
    const y = lerp(258, 297, random());
    // The path narrows towards the tree, so the beds reach further in at the back.
    const inner = lerp(176, 150, (y - 258) / 39);
    const x = left ? lerp(10, inner, random()) : lerp(W - inner, W - 10, random());
    if (slots.some((slot) => Math.hypot(slot.x - x, (slot.y - y) * 1.6) < 9)) continue;
    slots.push({ x, y, species: Math.floor(random() * 6), height: lerp(9, 16, random()), planted: 0, sway: random(), scale: lerp(0.85, 1.3, (y - 258) / 39) });
  }
  const order = slots.map((_, i) => i).sort(() => random() - 0.5);
  order.forEach((slot, rank) => { slots[slot].planted = rank; });
  return slots.sort((a, b) => a.y - b.y);
})();

const first = (slots: Slot[]): Box => { const slot = slots.find((s) => s.planted === 0)!; return { x: slot.x - 35, y: slot.y - 40, w: 70, h: 50 }; };
const around = (at: { x: number; y: number }, w = 70, h = 60): Box => ({ x: at.x - w / 2, y: at.y - h / 3, w, h });

/* The kampung: a laterite path winds from the front of the garden to the house steps. */
export const kampungPath = (y: number) => {
  const t = (y - 244) / 56;
  return { x: lerp(246, 172, t) + Math.sin(t * Math.PI) * 14, half: lerp(7, 22, t) };
};
const KAMPUNG_POND = { x: 62, y: 257, rx: 38, ry: 8 };
const KAMPUNG_BEDS = scatter(131, (x, y) => {
  const path = kampungPath(y);
  if (Math.abs(x - path.x) < path.half + 5) return false;
  if (((x - KAMPUNG_POND.x) / (KAMPUNG_POND.rx + 4)) ** 2 + ((y - KAMPUNG_POND.y) / (KAMPUNG_POND.ry + 5)) ** 2 < 1) return false;
  if (Math.abs(x - 140) < 10 && y < 278) return false;
  if (x > 344 && y > 270) return false;
  return y > (x < 200 ? 266 : 252);
}, { x0: 18, x1: 382, y0: 250, y1: 298 }, (y) => lerp(0.85, 1.25, (y - 252) / 46));

/* Damascus: the orange stands in a bed of earth set into the paving; roses in another. */
export const damascusBed = (y: number) => ({ x0: lerp(36, 20, (y - 254) / 46), x1: lerp(168, 186, (y - 254) / 46) });
const DAMASCUS_BEDS = scatter(151, (x, y) => {
  if (Math.abs(x - 100) < 9 && y < 280) return false;
  if (y > 257) { const bed = damascusBed(y); if (x > bed.x0 + 4 && x < bed.x1 - 4) return true; }
  return y > 266 && x > lerp(306, 298, (y - 262) / 38) && x < 392;
}, { x0: 20, x1: 394, y0: 257, y1: 298 }, (y) => lerp(0.85, 1.25, (y - 256) / 42), 8.4);

/* Medina: a water channel runs from the well to the front, with beds of mint and roses along it. */
export const medinaChannel = (y: number) => {
  const t = Math.max(0, (y - 214) / 86);
  return { x: lerp(236, 262, t), half: lerp(1.6, 12, t), bed: lerp(10, 60, t) };
};
const MEDINA_BEDS = scatter(171, (x, y) => {
  const channel = medinaChannel(y);
  const d = Math.abs(x - channel.x);
  return d > channel.half + 3.5 && d < channel.half + 3.5 + channel.bed && !(x < 190 && y < 262);
}, { x0: 150, x1: 380, y0: 232, y1: 298 }, (y) => lerp(0.75, 1.25, (y - 230) / 68), 8);

/* The Ottoman garden: tulips set in rows in two beds either side of a gravel walk. */
export const ottomanWalk = (y: number) => ({ x: 236, half: lerp(8, 30, (y - 216) / 84) });
const OTTOMAN_BEDS = rows(191, [0, 1, 2, 3, 4, 5].flatMap((row) => {
  const y = 244 + row * 10;
  const walk = ottomanWalk(y);
  return [
    { y, x0: lerp(134, 112, (y - 244) / 50), x1: walk.x - walk.half - 7 },
    { y, x0: walk.x + walk.half + 7, x1: lerp(340, 366, (y - 244) / 50) }
  ];
}));


/* Xi'an: a moon gate; a walk of hexagonal pavers to the archway; peonies; a koi pond. */
export const MOON_GATE = 'M10 180 A190 190 0 1 1 390 180 A190 190 0 1 1 10 180 Z';
export const XIAN_POND = { x: 300, y: 250, rx: 70, ry: 15 };
export const xianPath = (y: number) => { const t = Math.max(0, (y - 205) / 95); return { x: lerp(178, 200, t), half: lerp(9, 24, t) }; };
const inMoon = (x: number, y: number, inset = 8) => (x - 200) ** 2 + (y - 180) ** 2 < (190 - inset) ** 2;
const XIAN_BEDS = scatter(211, (x, y) => {
  if (!inMoon(x, y, 12)) return false;
  if (Math.abs(x - 96) < 9 && y < 282) return false;
  const left = y > 258 && x > lerp(26, 18, (y - 254) / 46) && x < lerp(154, 164, (y - 254) / 46);
  const right = y > 280 && x > lerp(244, 236, (y - 276) / 24) && x < 390;
  return left || right;
}, { x0: 18, x1: 392, y0: 258, y1: 298 }, (y) => lerp(0.9, 1.25, (y - 256) / 42), 8);

/* Agra: a cusped arch; the channel down the middle with sandstone walks; beds in the quarters. */
export const agraChannel = (y: number) => { const t = Math.max(0, (y - 206) / 94); return { half: lerp(2.4, 20, t), walk: lerp(5, 34, t) }; };
export const CUSPED = (() => {
  const bez = (t: number, p: number[][]) => { const u = 1 - t; return [0, 1].map((k) => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]); };
  const left = [[16, 126], [16, 64], [120, 36], [200, 12]];
  const pts = Array.from({ length: 11 }, (_, i) => bez(i / 10, left));
  const lobes = (list: number[][]) => list.slice(1).map(([x, y]) => `A7 7 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const right = [...pts].reverse().map(([x, y]) => [400 - x, y]);
  return `M16 300 L16 126 ${lobes(pts)} ${lobes(right)} L384 300 Z`;
})();
const AGRA_BEDS = scatter(223, (x, y) => {
  const c = agraChannel(y); const d = Math.abs(x - 200);
  if (d < c.half + c.walk + 6 || d > lerp(150, 196, (y - 222) / 78) - 5) return false;
  if (x < 24 || x > 376) return false;
  if (Math.abs(x - 70) < 9 && y < 288) return false;
  if (x > 326 && y < 272) return false;
  return y > 228;
}, { x0: 20, x1: 380, y0: 228, y1: 298 }, (y) => lerp(0.75, 1.25, (y - 226) / 72), 8.4);

/* Samarkand: a Timurid arch; a brick walk down from the square; beds below the ariq. */
export const TIMURID = 'M24 300 V124 C24 66 138 36 200 16 C262 36 376 66 376 124 V300 Z';
export const samarkandPath = (y: number) => { const t = Math.max(0, (y - 228) / 72); return { x: lerp(196, 186, t), half: lerp(8, 22, t) }; };
const SAMARKAND_BEDS = scatter(233, (x, y) => {
  const p = samarkandPath(y);
  if (Math.abs(x - p.x) < p.half + 5) return false;
  if (x > 266 && x < 374 && y < 286) return false;
  if (x > 210 && x < 270 && y > 270) return false;
  if (x < 50 && y > 262) return false;
  if (Math.abs(x - 102) < 9 && y < 290) return false;
  return x > 30 && x < 370;
}, { x0: 30, x1: 370, y0: 250, y1: 298 }, (y) => lerp(0.85, 1.25, (y - 248) / 50), 8);

/* Djenné: a window in a mud wall; a footpath down to the floodwater; beds of earth. */
export const MUD_FRAME = 'M16 300 V34 Q16 26 24 26 H376 Q384 26 384 34 V300 Z';
export const djennePath = (y: number) => { const t = Math.max(0, (y - 226) / 74); return { x: lerp(236, 214, t), half: lerp(6, 18, t) }; };
const DJENNE_BEDS = scatter(241, (x, y) => {
  const p = djennePath(y);
  if (Math.abs(x - p.x) < p.half + 5) return false;
  if (Math.abs(x - 98) < 15 && y < 292) return false;
  if (x > 150 && x < 202 && y < 268) return false;
  if (x > 312 && y < 254) return false;
  if (x > 206 && x < 280 && y < 252) return false;
  if (x > 246 && x < 296 && y > 278) return false;
  if (x > 204 && x < 242 && y > 260 && y < 282) return false;
  return [[24, 262], [168, 268], [372, 274]].every(([bx, by]) => Math.hypot(x - bx, (y - by) * 1.4) > 12);
}, { x0: 22, x1: 378, y0: 242, y1: 298 }, (y) => lerp(0.85, 1.25, (y - 240) / 58), 8);

export const LAYOUTS: Record<BiomeId, Layout> = {
  andalusia: {
    frame: ARCH,
    hero: { kind: 'olive', x: 200, y: 266, scale: 1 },
    slots: ANDALUSIA_BEDS,
    orchard: { y: 197, scale: 1 },
    ledge: 193,
    roses: [32, 362, 128, 272, 200].map((x) => ({ x, y: 214 })),
    seasonY: 124,
    focus: (id, { limb }) => {
      switch (id) {
        case 'firstBloom': return first(ANDALUSIA_BEDS);
        case 'path': return { x: 150, y: 240, w: 100, h: 60 };
        case 'lavender': return { x: 140, y: 225, w: 120, h: 55 };
        case 'fountain': return { x: 45, y: 210, w: 90, h: 60 };
        case 'butterflies': return { x: 30, y: 205, w: 140, h: 90 };
        case 'pomegranate': return { x: 300, y: 185, w: 100, h: 80 };
        case 'lantern': { const at = limb('right', 0.75); return { x: at.x - 35, y: at.y - 15, w: 70, h: 60 }; }
        case 'lemons': return { x: 145, y: 215, w: 110, h: 45 };
        case 'pool': return { x: 10, y: 195, w: 380, h: 50 };
        case 'bench': return { x: 255, y: 220, w: 75, h: 40 };
        case 'palm': return { x: 0, y: 110, w: 100, h: 115 };
        case 'songbirds': return { x: 120, y: 90, w: 160, h: 110 };
        case 'lanternString': return { x: 0, y: 165, w: 210, h: 50 };
        case 'cypresses': return { x: 30, y: 110, w: 100, h: 100 };
        case 'roses': return { x: 0, y: 235, w: 80, h: 45 };
        case 'vine': return { x: 0, y: 100, w: 110, h: 200 };
        case 'fireflies': return { x: 80, y: 130, w: 240, h: 140 };
        case 'shootingStars': return { x: 100, y: 10, w: 240, h: 110 };
        default: return null;
      }
    }
  },
  kampung: {
    frame: KAMPUNG_FRAME,
    hero: { kind: 'mango', x: 140, y: 272, scale: 0.84 },
    slots: KAMPUNG_BEDS,
    orchard: { y: 182, scale: 0.78 },
    ledge: 262,
    roses: [266, 384, 296, 354, 326].map((x) => ({ x, y: 240 })),
    seasonY: 42,
    focus: (id, { limb }) => {
      switch (id) {
        case 'firstBloom': return first(KAMPUNG_BEDS);
        case 'steppingStones': return { x: 160, y: 240, w: 110, h: 60 };
        case 'lemongrass': return { x: 180, y: 240, w: 110, h: 55 };
        case 'wakaf': return { x: 0, y: 190, w: 90, h: 65 };
        case 'butterflies': return { x: 30, y: 205, w: 140, h: 90 };
        case 'banana': return { x: 196, y: 190, w: 64, h: 55 };
        case 'doveCage': return { x: 180, y: 180, w: 70, h: 80 };
        case 'rambutan': return { x: 320, y: 225, w: 80, h: 75 };
        case 'lotusPond': return { x: 15, y: 230, w: 100, h: 45 };
        case 'pangkin': return { x: 290, y: 215, w: 70, h: 35 };
        case 'coconut': return { x: 320, y: 100, w: 80, h: 110 };
        case 'songbirds': return { x: 60, y: 90, w: 160, h: 110 };
        case 'pelitaRow': return { x: 150, y: 220, w: 130, h: 80 };
        case 'bamboo': return { x: 0, y: 110, w: 100, h: 110 };
        case 'bougainvillea': return { x: 240, y: 170, w: 90, h: 50 };
        case 'orchids': return around(limb('left', 0.5));
        case 'fireflies': return { x: 80, y: 130, w: 240, h: 140 };
        case 'shootingStars': return { x: 100, y: 10, w: 240, h: 110 };
        default: return null;
      }
    }
  },
  damascus: {
    frame: DOORWAY,
    hero: { kind: 'orange', x: 100, y: 276, scale: 1.05 },
    slots: DAMASCUS_BEDS,
    orchard: { y: 150, scale: 0.62 },
    ledge: 150,
    roses: [54, 186, 352, 120, 372].map((x) => ({ x, y: 224 })),
    seasonY: 34,
    focus: (id) => {
      switch (id) {
        case 'firstBloom': return first(DAMASCUS_BEDS);
        case 'inlaidFloor': return { x: 160, y: 225, w: 200, h: 75 };
        case 'jasmine': return { x: 0, y: 130, w: 90, h: 110 };
        case 'bahra': return { x: 180, y: 225, w: 120, h: 60 };
        case 'butterflies': return { x: 30, y: 205, w: 140, h: 90 };
        case 'citrusPots': return { x: 190, y: 170, w: 160, h: 70 };
        case 'brassLantern': return { x: 230, y: 115, w: 80, h: 70 };
        case 'damaskRoses': return { x: 290, y: 235, w: 110, h: 65 };
        case 'iwanCushions': return { x: 205, y: 170, w: 130, h: 60 };
        case 'mashrabiya': return { x: 40, y: 140, w: 170, h: 60 };
        case 'grapeArbor': return { x: 0, y: 0, w: 400, h: 110 };
        case 'songbirds': return { x: 20, y: 100, w: 160, h: 110 };
        case 'qamariyya': return { x: 200, y: 100, w: 140, h: 60 };
        case 'doves': return { x: 180, y: 220, w: 120, h: 50 };
        case 'teaTray': return { x: 220, y: 190, w: 100, h: 40 };
        case 'apricot': return { x: 330, y: 170, w: 70, h: 80 };
        case 'fireflies': return { x: 80, y: 130, w: 240, h: 140 };
        case 'shootingStars': return { x: 100, y: 10, w: 240, h: 110 };
        default: return null;
      }
    }
  },
  medina: {
    frame: DOORWAY,
    hero: { kind: 'palm', x: 150, y: 278, scale: 1.18 },
    slots: MEDINA_BEDS,
    orchard: { y: 200, scale: 0.7 },
    ledge: 199,
    roses: [24, 384, 110, 330, 190].map((x) => ({ x, y: 214 })),
    seasonY: 34,
    focus: (id, { limb }) => {
      switch (id) {
        case 'firstBloom': return first(MEDINA_BEDS);
        case 'channels': return { x: 180, y: 220, w: 140, h: 80 };
        case 'mint': return { x: 180, y: 230, w: 140, h: 70 };
        case 'well': return { x: 70, y: 210, w: 80, h: 60 };
        case 'butterflies': return { x: 200, y: 205, w: 140, h: 90 };
        case 'youngPalms': return { x: 280, y: 190, w: 120, h: 90 };
        case 'fanous': return around(limb('right', 0.6));
        case 'camel': return { x: 300, y: 215, w: 90, h: 45 };
        case 'arish': return { x: 0, y: 190, w: 100, h: 60 };
        case 'dallah': return { x: 10, y: 215, w: 80, h: 40 };
        case 'medinaDoves': return { x: 170, y: 225, w: 120, h: 50 };
        case 'songbirds': return { x: 70, y: 80, w: 160, h: 110 };
        case 'wallLamps': return { x: 0, y: 170, w: 400, h: 50 };
        case 'dateBaskets': return { x: 60, y: 260, w: 110, h: 40 };
        case 'taifRoses': return { x: 170, y: 255, w: 180, h: 45 };
        case 'grove': return { x: 0, y: 100, w: 400, h: 120 };
        case 'fireflies': return { x: 80, y: 130, w: 240, h: 140 };
        case 'shootingStars': return { x: 100, y: 10, w: 240, h: 110 };
        default: return null;
      }
    }
  },
  ottoman: {
    frame: OGEE,
    hero: { kind: 'plane', x: 90, y: 280, scale: 0.78 },
    slots: OTTOMAN_BEDS,
    orchard: { y: 170, scale: 0.55 },
    ledge: 202,
    roses: [24, 172, 120, 210, 70].map((x) => ({ x, y: 216 })),
    seasonY: 136,
    focus: (id) => {
      switch (id) {
        case 'firstBloom': return first(OTTOMAN_BEDS);
        case 'boxHedges': return { x: 110, y: 235, w: 260, h: 65 };
        case 'hyacinths': return { x: 120, y: 235, w: 240, h: 65 };
        case 'cesme': return { x: 140, y: 190, w: 80, h: 55 };
        case 'butterflies': return { x: 30, y: 205, w: 140, h: 90 };
        case 'kiosk': return { x: 260, y: 120, w: 140, h: 125 };
        case 'caiques': return { x: 120, y: 165, w: 200, h: 50 };
        case 'carnations': return { x: 190, y: 220, w: 100, h: 45 };
        case 'havuz': return { x: 190, y: 245, w: 95, h: 50 };
        case 'divan': return { x: 280, y: 180, w: 110, h: 55 };
        case 'cypressRow': return { x: 120, y: 120, w: 140, h: 95 };
        case 'songbirds': return { x: 0, y: 80, w: 160, h: 110 };
        case 'tulipLamps': return { x: 170, y: 225, w: 130, h: 75 };
        case 'storks': return { x: 300, y: 100, w: 80, h: 70 };
        case 'ottomanRoses': return { x: 300, y: 250, w: 100, h: 50 };
        case 'erguvan': return { x: 100, y: 140, w: 300, h: 60 };
        case 'fireflies': return { x: 80, y: 130, w: 240, h: 140 };
        case 'shootingStars': return { x: 100, y: 10, w: 240, h: 110 };
        default: return null;
      }
    }
  },
  xian: {
    frame: MOON_GATE,
    hero: { kind: 'plum', x: 96, y: 276, scale: 1.05 },
    slots: XIAN_BEDS,
    orchard: { y: 186, scale: 0.6, avoid: [142, 400] },
    ledge: 181,
    roses: [24, 130, 70, 104, 46].map((x) => ({ x, y: 204 })),
    seasonY: 32,
    focus: (id) => {
      switch (id) {
        case 'firstBloom': return first(XIAN_BEDS);
        case 'hexPavers': return { x: 130, y: 205, w: 120, h: 95 };
        case 'peonies': return { x: 10, y: 235, w: 180, h: 60 };
        case 'koiPond': return { x: 220, y: 225, w: 160, h: 50 };
        case 'butterflies': return { x: 30, y: 205, w: 140, h: 90 };
        case 'taihuRocks': return { x: 200, y: 215, w: 200, h: 60 };
        case 'redLanterns': return { x: 20, y: 160, w: 360, h: 60 };
        case 'zigzagBridge': return { x: 220, y: 225, w: 160, h: 50 };
        case 'stele': return { x: 118, y: 190, w: 64, h: 50 };
        case 'pailou': return { x: 130, y: 150, w: 90, h: 65 };
        case 'xianBamboo': return { x: 330, y: 100, w: 70, h: 110 };
        case 'songbirds': return { x: 16, y: 90, w: 160, h: 110 };
        case 'cranes': return { x: 210, y: 225, w: 60, h: 50 };
        case 'tingPavilion': return { x: 320, y: 180, w: 70, h: 55 };
        case 'pondLotus': return { x: 220, y: 225, w: 160, h: 50 };
        case 'wisteria': return { x: 40, y: 0, w: 320, h: 90 };
        case 'fireflies': return { x: 80, y: 130, w: 240, h: 140 };
        case 'shootingStars': return { x: 100, y: 10, w: 240, h: 110 };
        default: return null;
      }
    }
  },
  agra: {
    frame: CUSPED,
    hero: { kind: 'pomegranate', x: 70, y: 282, scale: 1.08 },
    slots: AGRA_BEDS,
    orchard: { y: 206, scale: 0.45, avoid: [84, 316] },
    ledge: 206,
    roses: [20, 380, 50, 350, 76].map((x) => ({ x, y: 206 })),
    seasonY: 64,
    focus: (id, { limb }) => {
      switch (id) {
        case 'firstBloom': return first(AGRA_BEDS);
        case 'channelWater': return { x: 140, y: 200, w: 120, h: 100 };
        case 'fountainJets': return { x: 150, y: 196, w: 100, h: 80 };
        case 'cypressAvenue': return { x: 110, y: 180, w: 180, h: 100 };
        case 'butterflies': return { x: 30, y: 205, w: 140, h: 90 };
        case 'chhatri': return { x: 316, y: 196, w: 80, h: 75 };
        case 'diyas': return { x: 150, y: 220, w: 100, h: 70 };
        case 'peacock': return { x: 250, y: 245, w: 70, h: 40 };
        case 'lotusBasin': return { x: 150, y: 215, w: 100, h: 40 };
        case 'marbleBench': return { x: 230, y: 228, w: 60, h: 30 };
        case 'parakeets': return around(limb('right', 0.8));
        case 'songbirds': return { x: 0, y: 90, w: 160, h: 110 };
        case 'jaali': return { x: 0, y: 200, w: 400, h: 100 };
        case 'roseParterre': return { x: 60, y: 210, w: 280, h: 90 };
        case 'reflection': return { x: 130, y: 196, w: 140, h: 104 };
        case 'champa': return { x: 0, y: 160, w: 400, h: 70 };
        case 'fireflies': return { x: 80, y: 130, w: 240, h: 140 };
        case 'shootingStars': return { x: 100, y: 10, w: 240, h: 110 };
        default: return null;
      }
    }
  },
  samarkand: {
    frame: TIMURID,
    hero: { kind: 'apricot', x: 102, y: 280, scale: 1 },
    slots: SAMARKAND_BEDS,
    orchard: { y: 228, scale: 0.5, avoid: [150, 270] },
    ledge: 228,
    roses: [40, 360, 140, 250, 90].map((x) => ({ x, y: 236 })),
    seasonY: 52,
    focus: (id) => {
      switch (id) {
        case 'firstBloom': return first(SAMARKAND_BEDS);
        case 'ariq': return { x: 0, y: 220, w: 400, h: 40 };
        case 'roseRows': return { x: 0, y: 210, w: 400, h: 45 };
        case 'tapchan': return { x: 266, y: 220, w: 110, h: 60 };
        case 'butterflies': return { x: 30, y: 205, w: 140, h: 90 };
        case 'choynak': return { x: 290, y: 236, w: 60, h: 30 };
        case 'suzani': return { x: 280, y: 228, w: 80, h: 30 };
        case 'grapeTrellis': return { x: 260, y: 190, w: 120, h: 90 };
        case 'melons': return { x: 205, y: 265, w: 70, h: 35 };
        case 'anor': return { x: 5, y: 250, w: 60, h: 45 };
        case 'hoopoe': return { x: 170, y: 240, w: 45, h: 30 };
        case 'songbirds': return { x: 20, y: 90, w: 160, h: 110 };
        case 'uzbekLanterns': return { x: 270, y: 200, w: 100, h: 50 };
        case 'mulberry': return { x: 340, y: 170, w: 60, h: 70 };
        case 'ceramics': return { x: 236, y: 230, w: 110, h: 70 };
        case 'illumination': return { x: 0, y: 60, w: 400, h: 150 };
        case 'fireflies': return { x: 80, y: 130, w: 240, h: 140 };
        case 'shootingStars': return { x: 100, y: 10, w: 240, h: 110 };
        default: return null;
      }
    }
  },
  djenne: {
    frame: MUD_FRAME,
    hero: { kind: 'baobab', x: 98, y: 284, scale: 0.92 },
    slots: DJENNE_BEDS,
    orchard: { y: 206, scale: 0.5, avoid: [56, 344] },
    ledge: 230,
    roses: [24, 376, 40, 360, 56].map((x) => ({ x, y: 206 })),
    seasonY: 46,
    focus: (id) => {
      switch (id) {
        case 'firstBloom': return first(DJENNE_BEDS);
        case 'canari': return { x: 145, y: 225, w: 70, h: 45 };
        case 'bissap': return { x: 0, y: 225, w: 400, h: 75 };
        case 'granary': return { x: 306, y: 186, w: 94, h: 70 };
        case 'butterflies': return { x: 30, y: 205, w: 140, h: 90 };
        case 'acacia': return { x: 300, y: 150, w: 100, h: 75 };
        case 'calabash': return { x: 240, y: 260, w: 60, h: 40 };
        case 'pirogue': return { x: 200, y: 180, w: 100, h: 50 };
        case 'weaverNests': return { x: 310, y: 160, w: 90, h: 50 };
        case 'millet': return { x: 0, y: 190, w: 80, h: 60 };
        case 'bogolan': return { x: 200, y: 215, w: 90, h: 40 };
        case 'songbirds': return { x: 10, y: 80, w: 160, h: 110 };
        case 'sahelLamps': return { x: 180, y: 220, w: 90, h: 70 };
        case 'sahelMango': return { x: 0, y: 160, w: 70, h: 70 };
        case 'guineaFowl': return { x: 195, y: 250, w: 60, h: 35 };
        case 'waterLilies': return { x: 20, y: 200, w: 360, h: 35 };
        case 'fireflies': return { x: 80, y: 130, w: 240, h: 140 };
        case 'shootingStars': return { x: 100, y: 10, w: 240, h: 110 };
        default: return null;
      }
    }
  }
};
