import { clamp01, lerp, seeded } from './random';

/**
 * An olive tree grown from a seed: a short gnarled trunk that splits low into a wide,
 * rounded crown. The whole tree is generated once at full size; how much of it shows is
 * decided at render time, so a young tree is always the early part of the same old one.
 */

export interface Branch {
  depth: number;
  x0: number; y0: number; cx: number; cy: number; x1: number; y1: number;
  w0: number; w1: number;
}

export interface Anchor {
  branch: number;
  /** Where along its branch (0..1) the anchor sits; it shows once the branch has grown that far. */
  t: number;
  x: number; y: number;
  rotate: number; scale: number; tone: number; variant: number;
  /** Order in which leaves arrive through the day, spread across the crown. */
  order: number;
}

export interface Tree { branches: Branch[]; anchors: Anchor[]; maxDepth: number }

const point = (b: Branch, t: number) => {
  const u = 1 - t;
  return { x: u * u * b.x0 + 2 * u * t * b.cx + t * t * b.x1, y: u * u * b.y0 + 2 * u * t * b.cy + t * t * b.y1 };
};

/** How a kind of tree carries itself: trunk length and girth, how wide its limbs spread and lean. */
export interface Habit { trunk?: number; width?: number; spread?: number; outward?: number; reach?: number }

export function growOlive(seed = 7, maxDepth = 6, habit: Habit = {}): Tree {
  const { trunk = 50, width: girth = 24, spread: spreadBy = 1, outward = 0.1, reach = 1 } = habit;
  const random = seeded(seed);
  const branches: Branch[] = [];
  const anchors: Omit<Anchor, 'order'>[] = [];

  const grow = (x: number, y: number, angle: number, length: number, width: number, depth: number) => {
    const x1 = x + Math.sin(angle) * length;
    const y1 = y - Math.cos(angle) * length;
    // Olive wood twists: a sideways bend on every limb, strongest on the trunk.
    const bend = (random() < 0.5 ? -1 : 1) * (0.18 + random() * 0.22) * length * (depth === 0 ? 1.4 : 1);
    const cx = (x + x1) / 2 + Math.cos(angle) * bend;
    const cy = (y + y1) / 2 + Math.sin(angle) * bend;
    const branch: Branch = { depth, x0: x, y0: y, cx, cy, x1, y1, w0: width, w1: width * (depth === 0 ? 0.78 : 0.64) };
    const index = branches.push(branch) - 1;

    if (depth >= (maxDepth <= 4 ? 1 : 2)) {
      const spots = depth >= 4 || maxDepth <= 4 ? [0.45, 0.8, 1] : [0.7, 1];
      for (const t of spots) {
        const at = point(branch, t);
        anchors.push({
          branch: index, t, x: at.x + (random() - 0.5) * 6, y: at.y + (random() - 0.5) * 5,
          rotate: random() * 360, scale: lerp(0.8, 1.25, random()) * (depth >= 5 ? 0.9 : 1),
          tone: Math.floor(random() * 4), variant: Math.floor(random() * 3)
        });
      }
    } else if (depth === 1 && maxDepth > 4) {
      const at = point(branch, 1);
      anchors.push({ branch: index, t: 1, x: at.x, y: at.y, rotate: random() * 360, scale: 1.1, tone: 1, variant: 0 });
    }

    if (depth >= maxDepth) return;
    const count = depth === 0 ? 3 : random() < 0.3 ? 3 : 2;
    const spread = (depth === 0 ? 0.95 : depth === 1 ? 0.8 : 0.62) * spreadBy;
    for (let i = 0; i < count; i++) {
      const share = i / (count - 1);
      let child = angle + lerp(-spread, spread, share) + (random() - 0.5) * 0.35;
      // The crown of an olive is broad rather than tall: outer limbs lean out and settle.
      if (depth >= 2) child += Math.sign(child || 1) * outward * (depth - 1);
      child = Math.max(-1.75, Math.min(1.75, child));
      const factor = (depth === 0 ? 0.78 : lerp(0.7, 0.86, random())) * reach;
      grow(x1, y1, child, length * factor, width * (depth === 0 ? 0.7 : 0.64), depth + 1);
    }
  };

  grow(0, 0, (random() - 0.5) * 0.2, trunk, girth, 0);

  // Leaves arrive in a shuffled order so the crown fills evenly rather than branch by branch.
  const order = anchors.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const ranked = new Array<number>(anchors.length);
  order.forEach((anchor, rank) => { ranked[anchor] = rank; });
  return { branches, anchors: anchors.map((anchor, index) => ({ ...anchor, order: ranked[index] })), maxDepth };
}

/** How much of a branch shows (0..1) for a tree of the given maturity. */
export const branchGrowth = (branch: Branch, maturity: number, maxDepth: number) => clamp01(maturity * (maxDepth + 1) - branch.depth);

/** The part of a branch's curve that has grown so far, as a tapered outline. */
export function branchOutline(branch: Branch, growth: number, widthScale: number) {
  const steps = 7;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * growth;
    const at = point(branch, t);
    const u = 1 - t;
    const dx = 2 * u * (branch.cx - branch.x0) + 2 * t * (branch.x1 - branch.cx);
    const dy = 2 * u * (branch.cy - branch.y0) + 2 * t * (branch.y1 - branch.cy);
    const length = Math.hypot(dx, dy) || 1;
    const half = (lerp(branch.w0, branch.w1, t / Math.max(growth, 0.001) * growth) * widthScale) / 2;
    const nx = (-dy / length) * half;
    const ny = (dx / length) * half;
    left.push(`${(at.x + nx).toFixed(2)} ${(at.y + ny).toFixed(2)}`);
    right.unshift(`${(at.x - nx).toFixed(2)} ${(at.y - ny).toFixed(2)}`);
  }
  return `M${left.join(' L')} L${right.join(' L')} Z`;
}

export const pointOn = point;
