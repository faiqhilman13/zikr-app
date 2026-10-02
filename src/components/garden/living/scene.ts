import type { ReactNode } from 'react';
import type { BiomeId } from '../../../domain/types';
import { FLOWER_SLOTS, leafShare, type TimeOfDay, type UnlockId } from './growth';
import type { Palette, Tint } from './palette';
import { lerp, seeded } from './random';
import { branchGrowth, growOlive, pointOn, type Tree } from './tree';

/**
 * Each garden is its own place: its own window onto the world, its own buildings and water,
 * its own tree at the heart of it and its own beds. What they share is how they grow.
 */

export const W = 400;
export const H = 300;

export type Box = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };
export type Slot = { x: number; y: number; species: number; height: number; planted: number; sway: number; scale: number };
export type HeroKind = 'olive' | 'mango' | 'orange' | 'plane' | 'palm';

/** What every part of a scene is drawn with. */
export interface Ctx {
  tint: Tint;
  palette: Palette;
  time: TimeOfDay;
  motion: boolean;
  /** `url(#…)` for a shared paint server. */
  url: (name: string) => string;
  /** The id of a shared definition. */
  idOf: (name: string) => string;
  on: (id: UnlockId) => boolean;
  /** Class that plays the arrival of a piece seen for the first time. */
  arrive: (id: UnlockId) => string;
  days: number;
  growth: number;
  mini: boolean;
  /** How lit the lamps are at this hour, 0..1. */
  lit: number;
  /** A point on the heart tree's limbs, on its left or right, in scene coordinates. */
  limb: (side: 'left' | 'right', t: number) => Point;
}

export interface Layout {
  /** The window's shape; everything is clipped to it. */
  frame: string;
  hero: { kind: HeroKind; x: number; y: number; scale: number };
  slots: Slot[];
  /** Where the orchard of the phrases stands, and how far away it is. */
  orchard: { y: number; scale: number };
  /** Where birds wait while the tree is too young to hold them. */
  ledge: number;
  /** Where salawat's climbing roses grow. */
  roses: Point[];
  /** Where the season's lanterns or bunting are strung across the sky. */
  seasonY: number;
  focus: (id: UnlockId, ctx: { growth: number; limb: Ctx['limb'] }) => Box | null;
}

export interface Paint {
  /** The land beyond: hills, skyline, water. Drawn behind the orchard. */
  Far: (ctx: Ctx) => ReactNode;
  /** Walls and buildings at the back, in front of the orchard. */
  Wall: (ctx: Ctx) => ReactNode;
  /** The ground, the beds and everything standing behind the heart tree. */
  Ground: (ctx: Ctx) => ReactNode;
  /** Things in front of the tree but behind the flowers, such as something hung from it. */
  Front?: (ctx: Ctx) => ReactNode;
  /** The nearest things, over the flowers. */
  Over?: (ctx: Ctx) => ReactNode;
  Frame: (props: { gold: string; golden: boolean; className: string; ctx: Ctx }) => ReactNode;
  FlowerHeads: (props: { tint: Tint; prefix: string }) => ReactNode;
  /** The golden frame's unlock, which every garden ends with. */
  golden: UnlockId;
}

/** The trees at the heart of each garden. A young tree is always the early part of the same old one. */
export const TREES: Record<Exclude<HeroKind, 'palm'>, Tree> = {
  olive: growOlive(11, 6),
  mango: growOlive(53, 6),
  orange: growOlive(37, 5, { trunk: 40, width: 18, spread: 0.82, outward: -0.04, reach: 1.02 }),
  plane: growOlive(71, 6, { trunk: 66, width: 30, spread: 0.92, outward: 0.04, reach: 1.04 })
};

/** How many leaves (or fronds) are out when the garden first appears, so they can fill in with a stagger. */
export const leavesOut = (kind: HeroKind, ratio: number) => Math.round((kind === 'palm' ? PALM_FRONDS_COUNT : TREES[kind].anchors.length) * leafShare(ratio));
const PALM_FRONDS_COUNT = 18;

export const heroScale = (layout: Layout, growth: number) => layout.hero.scale * (0.62 + 0.4 * growth);

/** The date palm's shape at a given maturity, in its own coordinates. */
export function palmShape(growth: number) {
  const height = 30 + 118 * growth;
  const lean = 10 * growth;
  const frond = 24 + 32 * growth;
  return { height, lean, frond, crown: { x: lean, y: -height } };
}

export const PALM_FRONDS = (() => {
  const random = seeded(5);
  return Array.from({ length: 18 }, (_, i) => ({
    // Upper fronds reach up and out; the lowest arch over and droop.
    angle: i < 12 ? lerp(-168, -12, i / 11) + (random() - 0.5) * 8 : [-205, -190, 10, 25, -150, -30][i - 12],
    length: lerp(0.8, 1.08, random()),
    droop: i >= 12,
    // Unfurl through the day spread around the crown.
    order: (i * 7) % 18
  }));
})();

/** Where something can hang from, or a bird sit on, the heart tree. */
export function limbPoint(layout: Layout, growth: number, side: 'left' | 'right', t: number): Point {
  const scale = heroScale(layout, growth);
  const { x, y } = layout.hero;
  if (layout.hero.kind === 'palm') {
    const shape = palmShape(growth);
    const angle = (side === 'left' ? -150 : -30) * Math.PI / 180;
    const reach = shape.frond * t * 0.9;
    return { x: x + (shape.crown.x + Math.cos(angle) * reach) * scale, y: y + (shape.crown.y + Math.sin(angle) * reach * 0.5 + reach * 0.25) * scale };
  }
  const tree = TREES[layout.hero.kind];
  const limb = side === 'left'
    ? tree.branches.find((branch) => branch.depth === 2 && branch.x1 < -15) ?? tree.branches[1]
    : tree.branches.find((branch) => branch.depth === 2 && branch.x1 > 25) ?? tree.branches[2];
  const at = pointOn(limb, t);
  return { x: x + at.x * scale, y: y + at.y * scale };
}

/** Where birds settle on the heart tree, or null while it is too young to hold them. */
export function perches(layout: Layout, growth: number): Point[] | null {
  const scale = heroScale(layout, growth);
  const { x, y } = layout.hero;
  if (layout.hero.kind === 'palm') {
    if (growth < 0.35) return null;
    const shape = palmShape(growth);
    return [-160, -25, -140, -45, -120].map((deg, i) => {
      const angle = deg * Math.PI / 180;
      const reach = shape.frond * (0.55 + (i % 2) * 0.12);
      return { x: x + (shape.crown.x + Math.cos(angle) * reach) * scale, y: y + (shape.crown.y + Math.sin(angle) * reach * 0.35) * scale - 2 };
    });
  }
  const tree = TREES[layout.hero.kind];
  const limbs = tree.branches.filter((branch) => branch.depth === 3 && branchGrowth(branch, growth, tree.maxDepth) >= 1);
  if (!limbs.length) return null;
  return [0, 1, 2, 3, 4].map((index) => {
    const at = pointOn(limbs[(index * 5 + 2) % limbs.length], 0.85);
    return { x: x + at.x * scale, y: y + at.y * scale - 2 };
  });
}

/** A square view around the heart tree as it stands, for the small window beside the counter. */
export function crownView(layout: Layout, growth: number) {
  const scale = heroScale(layout, growth);
  let top = 0; let left = 0; let right = 0;
  if (layout.hero.kind === 'palm') {
    const shape = palmShape(growth);
    top = shape.crown.y - shape.frond * 0.6;
    left = shape.crown.x - shape.frond;
    right = shape.crown.x + shape.frond;
  } else {
    const tree = TREES[layout.hero.kind];
    tree.branches.forEach((branch) => {
      const grown = branchGrowth(branch, growth, tree.maxDepth);
      if (grown <= 0) return;
      const end = pointOn(branch, grown);
      top = Math.min(top, end.y - 12); left = Math.min(left, end.x - 12); right = Math.max(right, end.x + 12);
    });
  }
  const width = (right - left) * scale;
  const height = -top * scale + 10;
  const size = Math.max(width, height, 46);
  const cx = layout.hero.x + ((left + right) / 2) * scale;
  const cy = layout.hero.y + 6 - height / 2;
  return `${(cx - size / 2).toFixed(1)} ${(cy - size / 2).toFixed(1)} ${size.toFixed(1)} ${size.toFixed(1)}`;
}

/** A translate and scale that brings `box` to the middle without showing past the scene's edges. */
export function zoomTo(box: Box) {
  const k = Math.min(3.2, Math.max(1, Math.min(W / box.w, H / box.h) * 0.85));
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const x = Math.min(0, Math.max(W - k * W, W / 2 - k * cx));
  const y = Math.min(0, Math.max(H - k * H, H / 2 - k * cy));
  return { k, x, y };
}

/**
 * Places for the flowers: scattered over the beds a garden has, spaced so none hides
 * another, planted in a scattered order and drawn back to front.
 */
export function scatter(seed: number, inside: (x: number, y: number) => boolean, area: { x0: number; x1: number; y0: number; y1: number }, sizeAt: (y: number) => number, spacing = 9): Slot[] {
  const random = seeded(seed);
  const slots: Slot[] = [];
  let gap = spacing;
  let tries = 0;
  while (slots.length < FLOWER_SLOTS) {
    const x = lerp(area.x0, area.x1, random());
    const y = lerp(area.y0, area.y1, random());
    if (++tries % 4000 === 0) gap *= 0.9;
    if (!inside(x, y)) continue;
    if (slots.some((slot) => Math.hypot(slot.x - x, (slot.y - y) * 1.6) < gap)) continue;
    slots.push({ x, y, species: Math.floor(random() * 6), height: lerp(9, 16, random()), planted: 0, sway: random(), scale: sizeAt(y) });
  }
  return plantOrder(slots, random);
}

/** Flowers set in rows, for a formal garden. `rows` gives each row's y and its run of x. */
export function rows(seed: number, lines: { y: number; x0: number; x1: number }[]): Slot[] {
  const random = seeded(seed);
  const per = Math.ceil(FLOWER_SLOTS / lines.length);
  const slots: Slot[] = [];
  lines.forEach((line, row) => {
    for (let i = 0; i < per && slots.length < FLOWER_SLOTS; i++) {
      const x = lerp(line.x0, line.x1, (i + 0.5) / per) + (random() - 0.5) * 1.5;
      // Tulips in bands of colour, as the Ottoman gardeners set them.
      slots.push({ x, y: line.y + (random() - 0.5), species: (row + Math.floor(i / 3)) % 6, height: lerp(10, 14, random()), planted: 0, sway: random(), scale: lerp(0.8, 1.25, (line.y - 236) / 60) });
    }
  });
  return plantOrder(slots, random);
}

function plantOrder(slots: Slot[], random: () => number) {
  const order = slots.map((_, i) => i).sort(() => random() - 0.5);
  order.forEach((slot, rank) => { slots[slot].planted = rank; });
  return slots.sort((a, b) => a.y - b.y);
}

export type Scenes = Record<BiomeId, { layout: Layout; paint: Paint }>;
