import { useMemo } from 'react';
import { maturity } from './growth';
import type { Tint } from './palette';
import { lerp, seeded } from './random';
import type { Ctx } from './scene';
import { ARCH, POMEGRANATE } from './layouts';
import { branchGrowth, branchOutline } from './tree';

/**
 * The Andalusian courtyard: an olive tree seen through a Moorish arch, a tiled wall with the
 * hills and a far town beyond, a fountain, a reflecting pool and two beds either side of a
 * stone path.
 */

const W = 400;
const H = 300;

export function AndalusiaFar({ palette }: Ctx) {
  return <>
    <path d="M0 176 C40 150 90 158 130 168 C180 150 230 146 280 162 C320 150 360 152 400 164 L400 210 L0 210 Z" fill={palette.hillFar} />
    <Skyline fill={palette.skyline} />
    <path d="M0 192 C50 176 110 184 160 190 C220 180 280 178 330 188 C360 182 385 184 400 186 L400 212 L0 212 Z" fill={palette.hillNear} />
  </>;
}

export function AndalusiaWall({ tint, palette, url, on, arrive, lit }: Ctx) {
  return <>
    {on('cypresses') && <g className={arrive('cypresses')}><Cypress x={74} tint={tint} /><Cypress x={318} tint={tint} tall /></g>}
    {on('palm') && <Palm tint={tint} className={`lg-palm${arrive('palm')}`} />}
    <rect y="194" width={W} height="22" fill={tint(palette.wall)} />
    <rect y="194" width={W} height="2.4" fill={tint(palette.wallShade)} />
    <rect y="199" width={W} height="8" fill={url('tiles')} />
    <rect y="214" width={W} height="3" fill={tint(palette.wallShade)} opacity=".7" />
    {on('lanternString') && <LanternString tint={tint} glow={url('lamp')} lit={lit} className={arrive('lanternString')} />}
  </>;
}

export function AndalusiaGround({ tint, url, idOf, on, arrive, motion, days }: Ctx) {
  return <>
    <rect y="216" width={W} height={H - 216} fill={url('ground')} />
    <GroundTexture tint={tint} />
    <Beds tint={tint} url={url('soil')} />
    {on('pool') && <g className={`lg-pool${arrive('pool')}`}>
      <rect x="24" y="221" width="352" height="11" rx="1" fill={tint('#e6dccb')} />
      <rect x="27" y="222.6" width="346" height="7.8" fill={url('water')} />
      {motion && [60, 150, 250, 330].map((x, i) => <rect key={x} className="lg-shimmer" style={{ animationDelay: `${i * 0.9}s` }} x={x} y={225 + (i % 2) * 2.5} width="22" height=".7" rx=".35" fill="#ffffff" opacity=".55" />)}
      <path d="M27 222.6 H373" stroke={tint('#c9bba3')} strokeWidth=".8" />
    </g>}
    {on('path') && <g className={`lg-path${arrive('path')}`}>{PATH_STONES.map((d, i) => <path key={i} d={d} fill={tint(i % 3 ? '#ddd0b8' : '#d2c3a8')} stroke={tint('#b8a88c')} strokeWidth=".5" />)}</g>}
    {on('bench') && <Bench tint={tint} className={arrive('bench')} />}
    {on('pomegranate') && <Pomegranate tint={tint} days={days} className={`lg-pomegranate${arrive('pomegranate')}`} spray={idOf('hspray1')} />}
    {on('fountain') && <Fountain tint={tint} motion={motion} water={url('water')} className={`lg-fountain${arrive('fountain')}`} />}
    {on('lemons') && <g className={arrive('lemons')}><LemonPot x={172} tint={tint} /><LemonPot x={228} tint={tint} /></g>}
    {on('roses') && <g className={arrive('roses')}><Roses x={26} tint={tint} /><Roses x={374} tint={tint} /></g>}
    {on('lavender') && <g className={`lg-lavender${arrive('lavender')}`}><Lavender x={164} y={262} tint={tint} /><Lavender x={236} y={262} tint={tint} flip /></g>}
  </>;
}

export function AndalusiaFront({ tint, url, on, arrive, palette, time, limb }: Ctx) {
  const lit = palette.night ? 1 : time === 'golden' ? 0.55 : time === 'dawn' ? 0.3 : 0;
  return on('lantern') ? <Lantern tint={tint} glow={url('lamp')} lit={lit} className={arrive('lantern')} at={limb('right', 0.75)} /> : null;
}

export function AndalusiaOver({ tint, on, arrive }: Ctx) {
  return on('vine') ? <Vine tint={tint} className={arrive('vine')} /> : null;
}

export function GroundTexture({ tint, color = '#7d8a4f', count = 34, top = 222 }: { tint: Tint; color?: string; count?: number; top?: number }) {
  const tufts = useMemo(() => {
    const random = seeded(23);
    return Array.from({ length: count }, () => ({ x: random() * 400, y: lerp(top, 296, random()), s: lerp(0.6, 1.2, random()) }));
  }, [count, top]);
  return <g stroke={tint(color)} strokeWidth=".7" strokeLinecap="round" fill="none" opacity=".55">
    {tufts.map((tuft, i) => <path key={i} d={`M${tuft.x} ${tuft.y} l${-1.5 * tuft.s} ${-3 * tuft.s} M${tuft.x} ${tuft.y} l0 ${-3.6 * tuft.s} M${tuft.x} ${tuft.y} l${1.5 * tuft.s} ${-3 * tuft.s}`} />)}
  </g>;
}

const PATH_STONES = (() => {
  const random = seeded(17);
  const stones: string[] = [];
  let y = 300;
  let row = 0;
  while (y > 262) {
    const depth = (300 - y) / 38;
    const height = lerp(9, 4.5, depth);
    const half = lerp(27, 11, depth);
    const count = row % 2 ? 2 : 3;
    const gap = 1.6;
    const width = (half * 2 - gap * (count - 1)) / count;
    for (let i = 0; i < count; i++) {
      const x0 = 200 - half + i * (width + gap) + (random() - 0.5) * 1.5;
      const x1 = x0 + width + (random() - 0.5) * 1.5;
      const top = y - height + (random() - 0.5);
      stones.push(`M${x0 + 1} ${y} L${x1 - 1} ${y} L${x1} ${top + 1} L${x0} ${top} Z`);
    }
    y -= height + 1.2;
    row += 1;
  }
  return stones;
})();


const SPECKS = (() => {
  const random = seeded(61);
  return Array.from({ length: 70 }, (_, i) => {
    const left = i % 2 === 0;
    const y = lerp(258, 298, random());
    const inner = lerp(150, 176, (y - 254) / 46) - 6;
    const x = left ? lerp(8, inner, random()) : W - lerp(8, inner, random());
    return { left, x, y, r: lerp(0.4, 1.1, random()) };
  });
})();


function Skyline({ fill }: { fill: string }) {
  // A far-off town on the hill: domes and a slender minaret, barely there.
  return <g fill={fill} opacity=".55">
    <path d="M246 176 h26 v-8 c0 -8 -13 -13 -13 -13 c0 0 -13 5 -13 13 Z" />
    <path d="M276 176 h14 v-5 c0 -5 -7 -8 -7 -8 c0 0 -7 3 -7 8 Z" />
    <rect x="296" y="142" width="4" height="34" /><path d="M295 142 h6 l-3 -7 Z" /><rect x="295" y="152" width="6" height="1.5" />
    <rect x="240" y="170" width="64" height="7" />
  </g>;
}

function Beds({ tint, url }: { tint: Tint; url: string }) {
  const specks = SPECKS;
  const bed = (left: boolean) => {
    const edge = (x: number) => (left ? x : W - x);
    return `M${edge(4)} 300 L${edge(4)} 256 L${edge(150)} 252 L${edge(178)} 300 Z`;
  };
  return <g>
    {[true, false].map((left) => <g key={String(left)}>
      <path d={bed(left)} fill={url} />
      {specks.filter((speck) => speck.left === left).map((speck, i) => <circle key={i} cx={speck.x} cy={speck.y} r={speck.r} fill={tint('#5a4029')} opacity=".45" />)}
      <path d={bed(left)} fill="none" stroke={tint('#d9c9aa')} strokeWidth="2.4" strokeLinejoin="round" />
      <path d={`M${left ? 4 : W - 4} 258 L${left ? 150 : W - 150} 254`} stroke={tint('#8f6c4b')} strokeWidth="1.2" />
    </g>)}
  </g>;
}

export function FlowerHeads({ tint, prefix }: { tint: Tint; prefix: string }) {
  const petals = (count: number, rx: number, ry: number, fill: string, offset = 0) => Array.from({ length: count }, (_, i) =>
    <ellipse key={i} rx={rx} ry={ry} cy={-ry * 0.9} transform={`rotate(${(360 / count) * i + offset})`} fill={fill} />);
  return <>
    {/* Anemone */}
    <g id={`${prefix}0`}>{petals(6, 1.5, 2, tint('#d8373f'))}<circle r="1.2" fill={tint('#241a2a')} /></g>
    {/* Tulip */}
    <g id={`${prefix}1`}><path d="M-2.4 0 C-3 -3 -2.2 -5 -1.2 -5.6 L0 -3.6 L1.2 -5.6 C2.2 -5 3 -3 2.4 0 C1.4 1.2 -1.4 1.2 -2.4 0 Z" fill={tint('#ee7b3a')} /><path d="M-1 -.5 C-1.2 -2.8 -.4 -4 0 -3.6 C.4 -4 1.2 -2.8 1 -.5 Z" fill={tint('#f8a45e')} /></g>
    {/* Iris */}
    <g id={`${prefix}2`}>{petals(3, 1.3, 2.4, tint('#6c5dc2'), 60)}{petals(3, 1, 2.1, tint('#9b8ce6'))}<circle r=".6" fill={tint('#f2cf4a')} /></g>
    {/* Jasmine */}
    <g id={`${prefix}3`}>{petals(5, 1.1, 2, tint('#fbf7ea'))}<circle r=".7" fill={tint('#f1d27c')} /></g>
    {/* Marigold */}
    <g id={`${prefix}4`}>{petals(10, .9, 2, tint('#efa31e'))}{petals(8, .7, 1.2, tint('#f7c33e'), 20)}<circle r=".9" fill={tint('#b9621a')} /></g>
    {/* Cornflower */}
    <g id={`${prefix}5`}>{petals(8, .9, 2.1, tint('#3e73d8'))}<circle r=".8" fill={tint('#23357a')} /></g>
  </>;
}

function Pomegranate({ tint, days, className, spray }: { tint: Tint; days: number; className: string; spray: string }) {
  const tree = POMEGRANATE;
  const growth = Math.min(1, 0.5 + maturity(days - 12) * 0.5);
  const grown = tree.branches.map((branch) => branchGrowth(branch, growth, tree.maxDepth));
  const ready = tree.anchors.filter((anchor) => grown[anchor.branch] >= anchor.t);
  const fruits = ready.filter((anchor) => anchor.order % 3 === 0).slice(0, Math.min(9, Math.floor((days - 12) / 2) + 1));
  return <g transform={`translate(350 256) scale(${(0.42 + 0.2 * growth).toFixed(3)})`}><g className={className}>
    <ellipse cy="2" rx="22" ry="4" fill="#000" opacity=".14" />
    <g className="lg-sway slow">
      {tree.branches.map((branch, i) => grown[i] > 0 && <path key={i} d={branchOutline(branch, grown[i], 0.55)} fill={tint('#7a5b45')} />)}
      {ready.map((anchor) => <g key={anchor.order} transform={`translate(${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)}) rotate(${anchor.rotate.toFixed(0)}) scale(1.7)`}><use href={`#${spray}`} style={{ color: tint(anchor.tone % 2 ? '#3f6d3c' : '#4d7d46') }} /></g>)}
      {fruits.map((anchor) => <g key={`p${anchor.order}`} transform={`translate(${anchor.x.toFixed(1)} ${(anchor.y + 4).toFixed(1)})`}>
        <circle r="4.2" fill={tint('#c3262f')} /><circle cx="-1.3" cy="-1.3" r="1.3" fill="#fff" opacity=".3" /><path d="M-1.2 -4 L0 -5.8 L1.2 -4" fill={tint('#8c1a22')} />
      </g>)}
    </g>
  </g></g>;
}

function Fountain({ tint, motion, water, className }: { tint: Tint; motion: boolean; water: string; className: string }) {
  return <g transform="translate(88 256)"><g className={className}>
    <ellipse cy="4" rx="31" ry="5" fill="#000" opacity=".15" />
    <path d="M-30 -2 L-27 5 H27 L30 -2 Z" fill={tint('#e9e0cf')} />
    <path d="M-30 -2 L-27 5 H27 L30 -2 Z" fill="none" stroke={tint('#c4b59b')} strokeWidth=".6" />
    <ellipse cy="-2" rx="30" ry="5.2" fill={tint('#f1ead9')} />
    <ellipse cy="-2" rx="26.5" ry="3.8" fill={water} />
    {motion && [0, 1, 2].map((i) => <ellipse key={i} className="lg-ripple" style={{ animationDelay: `${i * 1.1}s` }} cy="-2" rx="10" ry="1.6" fill="none" stroke="#fff" strokeWidth=".5" />)}
    <rect x="-3" y="-24" width="6" height="22" fill={tint('#e4d9c4')} />
    <path d="M-12 -24 C-10 -20 10 -20 12 -24 Z" fill={tint('#efe6d4')} />
    <ellipse cy="-24" rx="12" ry="2.4" fill={water} stroke={tint('#e7ddc9')} strokeWidth=".8" />
    <path d="M-1.5 -26 C-1.5 -30 1.5 -30 1.5 -26 Z" fill={tint('#e4d9c4')} /><circle cy="-31" r="1.3" fill={tint('#d4a017')} />
    <g className={motion ? 'lg-water' : undefined} fill="none" stroke="#dff2ff" strokeWidth=".9" strokeLinecap="round" opacity=".9">
      <path d="M0 -30 C-4 -38 -12 -30 -13 -23" /><path d="M0 -30 C4 -38 12 -30 13 -23" />
      <path d="M-11 -23 C-15 -18 -18 -10 -19 -3" /><path d="M11 -23 C15 -18 18 -10 19 -3" />
    </g>
  </g></g>;
}

function Lavender({ x, y, tint, flip = false }: { x: number; y: number; tint: Tint; flip?: boolean }) {
  const spikes = [-11, -7, -3, 1, 5, 9, 12];
  return <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
    <ellipse cy="1" rx="13" ry="2.5" fill="#000" opacity=".12" />
    {spikes.map((dx, i) => <g key={i} className="lg-flower" style={{ animationDelay: `${-i * 0.7}s` }}>
      <path d={`M0 0 Q${dx * 0.5} -8 ${dx} -${16 + (i % 3) * 3}`} stroke={tint('#6d8a5a')} strokeWidth=".8" fill="none" />
      {[0, 1, 2, 3].map((k) => <ellipse key={k} cx={dx * (0.72 + k * 0.08)} cy={-(12 + (i % 3) * 3) - k * 2.2} rx="1.1" ry="1.7" fill={tint(k % 2 ? '#9a7fd1' : '#7e63bc')} />)}
    </g>)}
  </g>;
}

function Lantern({ tint, glow, lit, className, at }: { tint: Tint; glow: string; lit: number; className: string; at: { x: number; y: number } }) {
  // Hangs from a limb on the right of the crown; the limb moves as the tree grows.
  const { x, y } = at;
  return <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}><g className={className}>
    <g className="lg-lantern">
      <line y1="0" y2="12" stroke={tint('#3d3226')} strokeWidth=".5" />
      {lit > 0 && <circle className="lg-flicker" cy="20" r="26" fill={glow} opacity={lit} />}
      <path d="M-3.5 12 L3.5 12 L2.4 10 H-2.4 Z" fill={tint('#b98a2a')} />
      <path d="M-4.5 13 C-6 17 -6 22 -3.5 26 H3.5 C6 22 6 17 4.5 13 Z" fill={lit > 0 ? '#ffd782' : tint('#e9d6a8')} stroke={tint('#a47a22')} strokeWidth=".7" />
      <path d="M0 14 V25 M-3 16 C-4 20 -4 22 -2.5 25 M3 16 C4 20 4 22 2.5 25" stroke={tint('#a47a22')} strokeWidth=".5" fill="none" />
      <path d="M-2.5 26 H2.5 L1.2 28.5 H-1.2 Z" fill={tint('#b98a2a')} />
    </g>
  </g></g>;
}

function Palm({ tint, className }: { tint: Tint; className: string }) {
  const fronds = [-150, -120, -95, -70, -40, -15, 12, -170];
  return <g transform="translate(34 214)"><g className={className}>
    <path d="M0 0 C-2 -30 4 -60 14 -86 L18 -85 C9 -60 4 -30 6 0 Z" fill={tint('#8a6d4a')} />
    {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${1 + i * 1.05} ${-i * 7.2} l4 -1.4`} stroke={tint('#6e5436')} strokeWidth=".7" />)}
    <g transform="translate(16 -86)"><g className="lg-sway slow">
      {fronds.map((angle, i) => <path key={i} transform={`rotate(${angle})`} d="M0 0 C10 -3 22 -2 32 4 C22 1 10 2 0 0 Z" fill={tint(i % 2 ? '#4f7a3f' : '#5f8c48')} />)}
      <circle cx="-2" cy="4" r="2.4" fill={tint('#c9782c')} /><circle cx="2" cy="5" r="2.2" fill={tint('#b8651f')} /><circle cx="0" cy="7.5" r="2" fill={tint('#d0883a')} />
    </g></g>
  </g></g>;
}

function Vine({ tint, className }: { tint: Tint; className: string }) {
  const leaves = useMemo(() => {
    const random = seeded(41);
    const along = (t: number) => {
      // Up the left side of the arch and over its shoulder.
      if (t < 0.5) return { x: 7 + random() * 3, y: lerp(292, 120, t / 0.5) };
      const a = lerp(Math.PI, Math.PI * 1.32, (t - 0.5) / 0.5);
      return { x: 232 + Math.cos(a) * 225, y: 116 + Math.sin(a) * 225 * 0.55 };
    };
    return Array.from({ length: 26 }, (_, i) => ({ ...along(i / 25), r: random() * 360, grape: i % 5 === 3 }));
  }, []);
  return <g className={className}>
    <path d={`M${leaves.map((leaf) => `${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}`).join(' L')}`} stroke={tint('#6d5236')} strokeWidth="1.3" fill="none" />
    {leaves.map((leaf, i) => <g key={i} transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}) rotate(${leaf.r.toFixed(0)})`}>
      <path d="M0 0 C-4 -2 -5 -7 -2 -9 C-1 -7 0 -8 0 -10 C1 -8 2 -7 3 -9 C6 -7 4 -2 0 0 Z" fill={tint(i % 2 ? '#5f8b43' : '#6f9b4c')} />
      {leaf.grape && <g transform="translate(3 4)">{[[0, 0], [2.2, 0], [1.1, 1.9], [-1.1, 1.9], [3.3, 1.9], [0, 3.8], [2.2, 3.8], [1.1, 5.7]].map(([gx, gy], k) => <circle key={k} cx={gx} cy={gy} r="1.3" fill={tint('#5b3a73')} />)}</g>}
    </g>)}
  </g>;
}

export function ArchFrame({ gold, golden, className }: { gold: string; golden: boolean; className: string }) {
  return <g className={`lg-frame${golden ? ' golden' : ''}${className}`} fill="none" pointerEvents="none">
    <path d={ARCH} stroke={golden ? gold : 'var(--gold)'} strokeWidth={golden ? 3.2 : 1.6} />
    <path d="M5 300 L5 117 A227 227 0 0 1 200 9 A227 227 0 0 1 395 117 L395 300" stroke={golden ? gold : 'var(--gold)'} strokeWidth=".6" opacity=".7" />
    <g transform="translate(200 3)"><path d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z" fill={golden ? gold : 'var(--gold)'} stroke="none" /><rect x="-4" y="-4" width="8" height="8" transform="rotate(45)" fill="none" stroke={golden ? gold : 'var(--gold)'} strokeWidth=".6" /></g>
  </g>;
}

function Cypress({ x, tint, tall = false }: { x: number; tint: Tint; tall?: boolean }) {
  const h = tall ? 84 : 70;
  return <g transform={`translate(${x} 198)`}><g className="lg-sway slow">
    <path d={`M0 0 C-9 -${h * 0.3} -8 -${h * 0.7} 0 -${h} C8 -${h * 0.7} 9 -${h * 0.3} 0 0 Z`} fill={tint('#2f5a3c')} />
    <path d={`M0 -4 C-4 -${h * 0.35} -3 -${h * 0.7} 0 -${h - 6}`} stroke={tint('#3f7350')} strokeWidth="2" fill="none" opacity=".7" />
  </g></g>;
}

function LanternString({ tint, glow, lit, className }: { tint: Tint; glow: string; lit: number; className: string }) {
  const points = Array.from({ length: 11 }, (_, i) => {
    const x = 18 + i * 36.4;
    return { x, y: 186 + (i % 2 ? 7 : 0) };
  });
  const d = points.map((p, i) => (i === 0 ? `M${p.x} ${p.y - 6}` : `Q${(points[i - 1].x + p.x) / 2} ${Math.max(points[i - 1].y, p.y) + 4} ${p.x} ${p.y - 6}`)).join(' ');
  return <g className={className}>
    <path d={d} stroke={tint('#4a3b2b')} strokeWidth=".6" fill="none" />
    {points.map((p, i) => <g key={i} transform={`translate(${p.x} ${p.y - 6})`}>
      {lit > 0 && <circle className="lg-flicker" style={{ animationDelay: `${i * 0.3}s` }} cy="5" r="9" fill={glow} opacity={lit} />}
      <path d="M-2 1 C-3 3 -3 6 -1.5 8 H1.5 C3 6 3 3 2 1 Z" fill={lit > 0 ? (i % 3 === 0 ? '#ffcf75' : i % 3 === 1 ? '#ff9f6b' : '#ffe39a') : tint(i % 2 ? '#d9674a' : '#e7b04a')} />
      <rect x="-1.2" y="0" width="2.4" height="1.2" fill={tint('#8a6a2a')} />
    </g>)}
  </g>;
}

function LemonPot({ x, tint }: { x: number; tint: Tint }) {
  return <g transform={`translate(${x} 250)`}>
    <ellipse cy="1" rx="8" ry="2" fill="#000" opacity=".14" />
    <path d="M-6 -8 L6 -8 L4.5 0 H-4.5 Z" fill={tint('#c96a3d')} /><rect x="-6.8" y="-9.5" width="13.6" height="2.2" rx=".8" fill={tint('#d98150')} />
    <path d="M0 -9 V-15" stroke={tint('#6b5038')} strokeWidth="1.2" />
    <g className="lg-sway slow"><circle cy="-21" r="9" fill={tint('#4f7f3f')} /><circle cx="-4" cy="-24" r="5" fill={tint('#5f9148')} /><circle cx="4" cy="-19" r="5.5" fill={tint('#467537')} />
      {[[-4, -18], [3, -25], [5, -16], [-6, -23], [0, -21]].map(([lx, ly], i) => <ellipse key={i} cx={lx} cy={ly} rx="1.6" ry="1.3" fill={tint('#f2d33c')} />)}</g>
  </g>;
}

function Bench({ tint, className }: { tint: Tint; className: string }) {
  return <g transform="translate(292 246)"><g className={className}>
    <ellipse cy="1" rx="22" ry="2.5" fill="#000" opacity=".14" />
    <rect x="-17" y="-8" width="4" height="8" fill={tint('#cfc1a6')} /><rect x="13" y="-8" width="4" height="8" fill={tint('#cfc1a6')} />
    <rect x="-20" y="-11" width="40" height="3.6" rx="1" fill={tint('#e2d6bf')} />
    <rect x="-17" y="-13.6" width="34" height="2.8" rx="1.2" fill={tint('#2f56a8')} />
    <path d="M-15 -13.6 h4 M-5 -13.6 h4 M5 -13.6 h4" stroke={tint('#e2b33c')} strokeWidth=".6" />
  </g></g>;
}

function Roses({ x, tint }: { x: number; tint: Tint }) {
  const blooms = [[-6, -14], [2, -18], [7, -11], [-2, -9], [-9, -7], [5, -5]];
  return <g transform={`translate(${x} 266)`}>
    <ellipse cy="1" rx="13" ry="2.5" fill="#000" opacity=".14" />
    <g className="lg-sway slow">
      <path d="M-12 0 C-13 -10 -6 -20 2 -21 C10 -20 14 -10 12 0 Z" fill={tint('#3e6b3a')} />
      {blooms.map(([bx, by], i) => <g key={i} transform={`translate(${bx} ${by})`}><circle r="2.6" fill={tint(i % 2 ? '#d64566' : '#e8708a')} /><path d="M-1.2 0 A1.2 1.2 0 1 1 1.2 0" stroke={tint('#a82a4a')} strokeWidth=".5" fill="none" /></g>)}
    </g>
  </g>;
}
