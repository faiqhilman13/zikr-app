import type { ReactNode } from 'react';
import { blossomShare, fruitShare, leafShare } from './growth';
import type { Tint } from './palette';
import { lerp } from './random';
import { heroScale, PALM_FRONDS, palmShape, TREES, type HeroKind, type Layout } from './scene';
import { branchGrowth, branchOutline, pointOn } from './tree';

/**
 * The tree at the heart of each garden. Today it fills with leaf, blossom and fruit as the
 * day's intention is kept; over the days it grows from a sapling to an old tree.
 */

const SPRAYS = [
  [-72, -38, -10, 16, 44, 78],
  [-60, -26, 4, 30, 62, 96, -100],
  [-84, -50, -18, 12, 40, 70]
];

type Look = {
  leaf: string; tones: string[]; bark: [string, string]; grain: string;
  /** Leaves per spray, and how far they fan. */
  per: number; fan: number;
  /** A paler leaf mixed in, such as the silver underside of an olive. */
  pale?: string;
  blossom: string; fruit: (ripe: boolean, tint: Tint) => ReactNode;
};

const LOOKS: Record<Exclude<HeroKind, 'palm'>, Look> = {
  olive: {
    leaf: 'M0 0 C1.7 -2.2 1.7 -6.4 0 -9 C-1.7 -6.4 -1.7 -2.2 0 0 Z', tones: ['#5c774c', '#6b8657', '#7b9463', '#8ba571'],
    bark: ['#6d5a47', '#76624d'], grain: '#4d3f33', per: 7, fan: 1, pale: '#c9d2b9', blossom: '#fbf6e4',
    fruit: (ripe, tint) => <><ellipse rx="1.9" ry="2.5" fill={tint(ripe ? '#3b2940' : '#7f8f3a')} /><ellipse cx="-.6" cy="-.9" rx=".5" ry=".8" fill="#fff" opacity=".45" /></>
  },
  mango: {
    leaf: 'M0 0 C2 -3.4 2 -10 0 -13.5 C-2 -10 -2 -3.4 0 0 Z', tones: ['#2f5f2c', '#3b6f33', '#467d3a', '#558b44'],
    bark: ['#6d5a47', '#76624d'], grain: '#4d3f33', per: 5, fan: 0.8, pale: '#9cbf6a', blossom: '#f4ecc8',
    fruit: (ripe, tint) => <><path d="M0 -3.4 C2.6 -3.4 3.2 0 2.4 2.4 C1.6 4.2 -1.6 4.4 -2.4 2.2 C-3 .2 -2.2 -3.4 0 -3.4 Z" fill={tint(ripe ? '#f2a33a' : '#8fb04a')} /><ellipse cx="-.8" cy="-1" rx=".6" ry="1" fill="#fff" opacity=".4" /></>
  },
  orange: {
    leaf: 'M0 0 C2.6 -2.4 2.8 -7.6 0 -10 C-2.8 -7.6 -2.6 -2.4 0 0 Z', tones: ['#1f4d26', '#285a2c', '#2f6633', '#3a7238'],
    bark: ['#5e4f43', '#685749'], grain: '#3f342b', per: 7, fan: 0.9, pale: '#4f8a44', blossom: '#ffffff',
    fruit: (ripe, tint) => <><circle r="2.6" fill={tint(ripe ? '#f08a1c' : '#8fae3a')} /><circle cx="-.8" cy="-.9" r=".8" fill="#fff" opacity=".35" /><circle cy="-2.4" r=".5" fill={tint('#3d5a24')} /></>
  },
  plane: {
    leaf: 'M0 0 L-.8 -2.6 L-4.6 -3.4 L-3 -5.4 L-5.4 -8.4 L-1.8 -7.8 L0 -11.4 L1.8 -7.8 L5.4 -8.4 L3 -5.4 L4.6 -3.4 L.8 -2.6 Z',
    tones: ['#4c7f33', '#5a8d3b', '#679944', '#76a64c'], bark: ['#8d8170', '#a19582'], grain: '#6e6352', per: 6, fan: 1.1, blossom: '#c9d68a',
    fruit: (ripe, tint) => <><path d="M0 -4 V0" stroke={tint('#6e5a3e')} strokeWidth=".4" /><circle r="1.9" fill={tint(ripe ? '#a8804a' : '#9fb35a')} /><circle r="1.9" fill="none" stroke={tint('#6e5a3e')} strokeWidth=".3" strokeDasharray=".4 .5" /></>
  }
};

/** The shared shapes each heart tree is drawn from: sprays of its leaves and its blossom. */
export function HeroDefs({ kind, tint, prefix }: { kind: HeroKind; tint: Tint; prefix: string }) {
  if (kind === 'palm') return <>
    <g id={`${prefix}frond`}>
      <path d="M0 0 Q20 -7 40 2" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      {Array.from({ length: 13 }, (_, i) => {
        const t = (i + 1) / 14;
        const x = 40 * t; const y = -7 * 2 * t * (1 - t) * 2 + 2 * t * t;
        const len = lerp(7, 3.4, t);
        return <path key={i} d={`M${x.toFixed(1)} ${y.toFixed(1)} l${(len * 0.55).toFixed(1)} ${(-len).toFixed(1)} M${x.toFixed(1)} ${y.toFixed(1)} l${(len * 0.55).toFixed(1)} ${(len * 0.8).toFixed(1)}`} stroke="currentColor" strokeWidth=".9" strokeLinecap="round" />;
      })}
    </g>
    <g id={`${prefix}blossom`}>{[-2, 0, 2].map((x) => <path key={x} d={`M0 0 Q${x} 3 ${x * 1.6} 6`} stroke={tint('#f1e2ac')} strokeWidth=".9" fill="none" />)}</g>
  </>;
  const look = LOOKS[kind];
  return <>
    {SPRAYS.map((angles, variant) => <g key={variant} id={`${prefix}spray${variant}`}>
      {angles.slice(0, look.per).map((angle, i) => <path key={i} d={look.leaf} transform={`rotate(${angle * look.fan}) translate(0 -${1.2 + (i % 2)})`}
        fill={look.pale && i % 3 === 1 ? tint(look.pale) : 'currentColor'} opacity={look.pale && i % 3 === 1 && kind === 'olive' ? 0.85 : 1} />)}
    </g>)}
    <g id={`${prefix}blossom`}>{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} rx="1.05" ry="1.7" cy="-1.5" transform={`rotate(${a})`} fill={tint(look.blossom)} />)}<circle r=".8" fill={tint('#e9c44f')} /></g>
  </>;
}

export function Hero({ layout, tint, growth, ratio, prefix, firstLeaves, age }: {
  layout: Layout; tint: Tint; growth: number; ratio: number; prefix: string; firstLeaves: number;
  /** Marks of age on a tree kept long past full growth: a nest, a hollow, a golden crown. */
  age: number;
}) {
  const scale = heroScale(layout, growth);
  const { x, y, kind } = layout.hero;
  return <g transform={`translate(${x} ${y}) scale(${scale.toFixed(3)})`}>
    {kind === 'palm'
      ? <DatePalm tint={tint} growth={growth} ratio={ratio} prefix={prefix} firstLeaves={firstLeaves} age={age} />
      : <BranchingTree kind={kind} tint={tint} growth={growth} ratio={ratio} prefix={prefix} firstLeaves={firstLeaves} age={age} />}
  </g>;
}

function BranchingTree({ kind, tint, growth, ratio, prefix, firstLeaves, age }: {
  kind: Exclude<HeroKind, 'palm'>; tint: Tint; growth: number; ratio: number; prefix: string; firstLeaves: number; age: number;
}) {
  const tree = TREES[kind];
  const look = LOOKS[kind];
  const tones = look.tones;
  const width = 0.22 + 0.78 * Math.pow(growth, 1.2);
  const grown = tree.branches.map((branch) => branchGrowth(branch, growth, tree.maxDepth));
  const ready = tree.anchors.filter((anchor) => grown[anchor.branch] >= anchor.t);
  const leafTarget = Math.round(tree.anchors.length * leafShare(ratio));
  const showing = ready.filter((anchor) => anchor.order < leafTarget);
  const flowering = ready.filter((anchor) => anchor.order % 4 === 1);
  const fruiting = ready.filter((anchor) => anchor.order % 5 === 2);
  const blossoms = Math.round(flowering.length * blossomShare(ratio) * (1 - fruitShare(ratio)));
  const fruit = Math.round(fruiting.length * fruitShare(ratio));
  const ripe = ratio >= 1;
  const trunk = tree.branches[0];
  const young = growth * (tree.maxDepth + 1) < 1.8;
  const tip = pointOn(trunk, grown[0]);
  const spray = `${prefix}spray`;

  return <>
    <ellipse cx="0" cy="2" rx={34 * width + 8} ry="5" fill="#000" opacity=".16" />
    <g className="lg-sway">
      {growth > 0.3 && <path d={`M-${9 * width} 1 C-${16 * width} 4 -${22 * width} 3 -${26 * width} 5 L-${5 * width} 3 Z M${9 * width} 1 C${15 * width} 3 ${20 * width} 3 ${24 * width} 5 L${5 * width} 3 Z`} fill={tint('#56463a')} />}
      {tree.branches.map((branch, i) => grown[i] > 0 && <path key={i} d={branchOutline(branch, grown[i], width)} fill={tint(branch.depth < 2 ? look.bark[0] : look.bark[1])} />)}
      {/* Bark: the grain of old wood; a plane tree's peels in pale patches instead. */}
      {tree.branches.slice(0, 4).map((branch, i) => grown[i] > 0.2 && <path key={i} d={`M${branch.x0 - 2} ${branch.y0} Q${branch.cx - 1} ${branch.cy} ${lerp(branch.x0, branch.x1, grown[i]) - 1} ${lerp(branch.y0, branch.y1, grown[i])}`} stroke={tint(look.grain)} strokeWidth={1.2 * width + 0.3} fill="none" opacity=".55" />)}
      {kind === 'plane' && grown[0] > 0.5 && [0.2, 0.42, 0.66, 0.84].map((t, i) => { const at = pointOn(trunk, t * grown[0]); return <ellipse key={`p${i}`} cx={(at.x + (i % 2 ? 3 : -4) * width).toFixed(1)} cy={at.y.toFixed(1)} rx={3.4 * width + 0.5} ry={2.2 * width + 0.4} fill={tint(i % 2 ? '#c9c0a4' : '#b7ae92')} opacity=".8" />; })}
      {tree.branches.slice(0, 2).map((branch, i) => grown[i] > 0.3 && <path key={`h${i}`} d={`M${branch.x0 + 3 * width} ${branch.y0} Q${branch.cx + 2} ${branch.cy} ${lerp(branch.x0, branch.x1, grown[i]) + 2} ${lerp(branch.y0, branch.y1, grown[i])}`} stroke={tint('#93806a')} strokeWidth={0.9 * width + 0.2} fill="none" opacity=".45" />)}
      {age >= 3 && <circle cx={trunk.x1.toFixed(1)} cy={(trunk.y1 - 40).toFixed(1)} r="70" fill="#ffd66b" opacity=".16" className="lg-bloom" />}
      {age >= 2 && grown[0] >= 1 && <ellipse cx={(trunk.cx * 0.6).toFixed(1)} cy={trunk.cy.toFixed(1)} rx={2.6 * width + 1} ry={4.2 * width + 1.4} fill={tint('#3a2c22')} opacity=".85" />}
      {age >= 1 && (() => {
        const fork = tree.branches.find((branch) => branch.depth === 2 && branch.x1 < 0) ?? tree.branches[1];
        return grown[tree.branches.indexOf(fork)] >= 1 && <Nest at={{ x: fork.x1, y: fork.y1 + 1 }} tint={tint} />;
      })()}
      {young && [0, 1, 2, 3].map((i) => <g key={`sprout${i}`} transform={`translate(${tip.x} ${tip.y}) rotate(${-60 + i * 40}) scale(.8)`}><use href={`#${spray}${i % 3}`} className="lg-leaf" style={{ color: tint(tones[i]) }} /></g>)}
      {showing.map((anchor) => <g key={anchor.order} transform={`translate(${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)}) rotate(${anchor.rotate.toFixed(0)}) scale(${anchor.scale.toFixed(2)})`}>
        <use href={`#${spray}${anchor.variant}`} className="lg-leaf" style={{ color: tint(tones[anchor.tone]), animationDelay: anchor.order < firstLeaves ? `${Math.round((anchor.order / Math.max(firstLeaves, 1)) * 900)}ms` : '0ms' }} />
      </g>)}
      {flowering.slice(0, blossoms).map((anchor) => <g key={`b${anchor.order}`} transform={`translate(${(anchor.x + 3).toFixed(1)} ${(anchor.y - 2).toFixed(1)})`}><use href={`#${prefix}blossom`} className="lg-pop" /></g>)}
      {fruiting.slice(0, fruit).map((anchor) => <g key={`f${anchor.order}`} transform={`translate(${(anchor.x - 2).toFixed(1)} ${(anchor.y + 3).toFixed(1)})`}><g className="lg-pop">{look.fruit(ripe, tint)}</g></g>)}
    </g>
  </>;
}

function Nest({ at, tint }: { at: { x: number; y: number }; tint: Tint }) {
  return <g transform={`translate(${at.x.toFixed(1)} ${at.y.toFixed(1)})`}>
    <ellipse rx="6" ry="2.6" fill={tint('#7a5a3a')} /><path d="M-6 -.4 C-3 -2.4 3 -2.4 6 -.4" stroke={tint('#5a4028')} strokeWidth=".8" fill="none" />
    <circle cx="-1.6" cy="-1.4" r="1.1" fill="#e9e2d0" /><circle cx="1" cy="-1.6" r="1.1" fill="#dcd2bd" />
  </g>;
}

const FROND_TONES = ['#4d7a3a', '#5a8a42', '#3f6d34', '#679649'];

/**
 * The date palm: its trunk rises over the days; each day new fronds unfurl from the crown,
 * spathes open through the middle of the intention and dates hang yellow, then ripen brown
 * when it is complete.
 */
function DatePalm({ tint, growth, ratio, prefix, firstLeaves, age }: { tint: Tint; growth: number; ratio: number; prefix: string; firstLeaves: number; age: number }) {
  const shape = palmShape(growth);
  const { height, lean, frond } = shape;
  const out = Math.max(4, Math.round(PALM_FRONDS.length * leafShare(ratio)));
  const spathes = Math.round(4 * blossomShare(ratio) * (1 - fruitShare(ratio)));
  const clusters = Math.round(5 * fruitShare(ratio) * Math.min(1, growth * 2));
  const ripe = ratio >= 1;
  const girth = 5 + 4 * growth;
  // The trunk: rings of old leaf bases, a gentle curve towards the light.
  const at = (t: number) => ({ x: lean * t * t, y: -height * t });
  const rings = Math.round(height / 5.5);
  return <>
    <ellipse cy="2" rx={girth * 2.6 + 6} ry="4" fill="#000" opacity=".16" />
    <path d={`M${-girth} 0 C${-girth * 0.9} ${-height * 0.4} ${lean * 0.5 - girth * 0.7} ${-height * 0.8} ${lean - girth * 0.6} ${-height} L${lean + girth * 0.6} ${-height} C${lean * 0.5 + girth * 0.7} ${-height * 0.8} ${girth * 0.9} ${-height * 0.4} ${girth} 0 Z`} fill={tint('#8a6d4a')} />
    {Array.from({ length: rings }, (_, i) => {
      const p = at((i + 0.5) / rings);
      const w = girth * (1 - 0.4 * (i / rings));
      return <path key={i} d={`M${(p.x - w).toFixed(1)} ${p.y.toFixed(1)} L${p.x.toFixed(1)} ${(p.y - 2.6).toFixed(1)} L${(p.x + w).toFixed(1)} ${p.y.toFixed(1)}`} stroke={tint(i % 2 ? '#6e5436' : '#7a5f3f')} strokeWidth="1.1" fill="none" />;
    })}
    {age >= 2 && <ellipse cx={at(0.3).x} cy={at(0.3).y} rx={girth * 0.35} ry={girth * 0.6} fill={tint('#3a2c22')} opacity=".7" />}
    <g transform={`translate(${lean.toFixed(1)} ${(-height).toFixed(1)})`}>
      {age >= 3 && <circle r={frond * 1.3} fill="#ffd66b" opacity=".16" className="lg-bloom" />}
      <g className="lg-sway slow">
        {PALM_FRONDS.map((f, i) => {
          if (f.order >= out) return null;
          const len = frond * f.length;
          return <g key={i} transform={`rotate(${f.angle}) scale(${(len / 40).toFixed(3)} ${((len / 40) * (f.droop ? 0.9 : 1)).toFixed(3)})`}>
            <use href={`#${prefix}frond`} className="lg-leaf" style={{ color: tint(FROND_TONES[i % 4]), animationDelay: f.order < firstLeaves ? `${f.order * 50}ms` : '0ms' }} />
          </g>;
        })}
        {Array.from({ length: spathes }, (_, i) => <g key={`s${i}`} transform={`translate(${(i - 1.5) * 4} 3)`}><use href={`#${prefix}blossom`} className="lg-pop" /></g>)}
        {Array.from({ length: clusters }, (_, i) => {
          const cx = (i - 2) * 5.5;
          return <g key={`d${i}`} transform={`translate(${cx} 4)`} className="lg-pop">
            <path d={`M0 0 Q${cx * 0.2} 5 ${cx * 0.3} 9`} stroke={tint('#d49a3a')} strokeWidth=".8" fill="none" />
            {[[0, 7], [1.6, 8.4], [-1.4, 8.6], [.4, 10], [2.2, 10.4], [-1.8, 10.6], [.6, 12]].map(([dx, dy], k) => <ellipse key={k} cx={cx * 0.3 + dx} cy={dy} rx=".95" ry="1.4" fill={tint(ripe ? (k % 2 ? '#7a2e1a' : '#8f3a1f') : (k % 2 ? '#e2b32c' : '#efc443'))} />)}
          </g>;
        })}
        {age >= 1 && <Nest at={{ x: -frond * 0.35, y: -2 }} tint={tint} />}
      </g>
    </g>
  </>;
}
