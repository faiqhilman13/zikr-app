import { useMemo } from 'react';
import type { Palette, Tint } from './palette';
import { mix } from './palette';
import { lerp, seeded } from './random';
import { KAMPUNG_FRAME } from './kampungScene';
import { branchGrowth, branchOutline, growOlive } from './tree';

/**
 * The kampung garden: a Malay village garden seen through a carved wooden window. Paddy
 * terraces and coconut palms beyond a picket fence, a mango tree at its heart, hibiscus
 * and ixora in the beds, and, as the days are tended, a wakaf to rest in, a lotus pond,
 * pelita lamps and fireflies over the water.
 */

const RAMBUTAN = growOlive(61, 4);

export function KampungBackdrop({ palette }: { palette: Palette }) {
  const terraces = palette.night ? '#1d2f3a' : mix(palette.hillNear, '#7fb04a', 0.55);
  return <g>
    <path d="M0 170 C50 150 110 160 160 168 C220 150 290 148 340 162 C370 156 390 158 400 160 L400 212 L0 212 Z" fill={mix(palette.hillFar, '#6f9a6a', 0.35)} />
    {/* A village mosque with a tiered roof, far across the fields. */}
    <g fill={palette.skyline} opacity=".7" transform="translate(286 168)">
      <rect x="-12" y="-2" width="24" height="9" />
      <path d="M-16 -2 L0 -10 L16 -2 Z" /><path d="M-11 -9 L0 -16 L11 -9 Z" /><path d="M-6 -15 L0 -21 L6 -15 Z" />
      <rect x="-.6" y="-25" width="1.2" height="5" />
    </g>
    {[40, 66, 120, 344, 372].map((x, i) => <g key={x} transform={`translate(${x} ${178 + (i % 2) * 4})`} opacity=".75">
      <path d="M0 0 C-1 -10 1 -18 3 -24" stroke={palette.skyline} strokeWidth="1.2" fill="none" />
      {[-150, -110, -70, -30, 10].map((a) => <path key={a} transform={`translate(3 -24) rotate(${a})`} d="M0 0 C3 -1 7 0 10 2" stroke={palette.skyline} strokeWidth="1.1" fill="none" />)}
    </g>)}
    {/* Paddy terraces, stepped down the near slope. */}
    {[0, 1, 2, 3].map((row) => <path key={row} d={`M0 ${186 + row * 6} C80 ${180 + row * 6} 160 ${184 + row * 6} 240 ${182 + row * 6} C310 ${180 + row * 6} 360 ${184 + row * 6} 400 ${182 + row * 6} L400 212 L0 212 Z`}
      fill={mix(terraces, row % 2 ? '#a9c95f' : '#8bb64e', palette.night ? 0.1 : 0.35)} />)}
  </g>;
}

export function Fence({ tint }: { tint: Tint }) {
  const posts = Array.from({ length: 34 }, (_, i) => 4 + i * 11.8);
  return <g>
    <rect y="203" width="400" height="2.6" fill={tint('#9c7650')} />
    <rect y="210" width="400" height="2.6" fill={tint('#9c7650')} />
    {posts.map((x, i) => <path key={i} d={`M${x} 216 V${i % 2 ? 199 : 197} L${x + 2.2} ${i % 2 ? 196.5 : 194.5} L${x + 4.4} ${i % 2 ? 199 : 197} V216 Z`} fill={tint(i % 3 ? '#b88d5f' : '#a97f53')} />)}
  </g>;
}

export function SteppingStones({ tint, className }: { tint: Tint; className: string }) {
  const stones = [[200, 292, 13, 5], [193, 279, 11, 4.3], [206, 268, 9, 3.6], [199, 260, 7, 3]];
  return <g className={className}>{stones.map(([x, y, rx, ry], i) => <g key={i}>
    <ellipse cx={x} cy={y + 1} rx={rx} ry={ry} fill="#000" opacity=".12" />
    <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={tint(i % 2 ? '#c4734a' : '#b8673f')} />
    <ellipse cx={x - rx * 0.3} cy={y - ry * 0.3} rx={rx * 0.4} ry={ry * 0.3} fill="#fff" opacity=".12" />
  </g>)}</g>;
}

export function Lemongrass({ x, y, tint }: { x: number; y: number; tint: Tint }) {
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cy="1" rx="10" ry="2.2" fill="#000" opacity=".12" />
    {[-30, -18, -8, 0, 9, 19, 31].map((a, i) => <g key={i} className="lg-flower" style={{ animationDelay: `${-i * 0.6}s` }}>
      <path d={`M0 0 Q${a * 0.25} -10 ${a * 0.55} -${20 + (i % 3) * 3}`} stroke={tint(i % 2 ? '#8fb55a' : '#a6c86b')} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </g>)}
  </g>;
}

export function Wakaf({ tint, className }: { tint: Tint; className: string }) {
  return <g transform="translate(66 252)"><g className={className}>
    <ellipse cy="1.5" rx="30" ry="4" fill="#000" opacity=".15" />
    {[-22, 22].map((px) => <rect key={px} x={px - 1.4} y="-26" width="2.8" height="26" fill={tint('#7a5234')} />)}
    <rect x="-24" y="-9" width="48" height="3.2" fill={tint('#a37346')} />
    <rect x="-24" y="-6" width="48" height="1.4" fill={tint('#6f4a2c')} />
    {/* A Malay roof: steep, with crossed gable ends (silang gunting). */}
    <path d="M-32 -24 L0 -44 L32 -24 Z" fill={tint('#8a3b2a')} />
    <path d="M-32 -24 L32 -24 L29 -21 L-29 -21 Z" fill={tint('#6b2c20')} />
    <path d="M-3 -46 L3 -40 M3 -46 L-3 -40" stroke={tint('#5a3a22')} strokeWidth="1.3" />
    <path d="M-26 -26 L0 -41 L26 -26" stroke={tint('#a85a40')} strokeWidth=".7" fill="none" />
  </g></g>;
}

export function Banana({ x, tint }: { x: number; tint: Tint }) {
  return <g transform={`translate(${x} 246)`}><g className="lg-sway slow">
    <path d="M-1.6 0 C-2 -12 -1 -24 0 -32 L2 -32 C2.4 -24 2.6 -12 1.6 0 Z" fill={tint('#7f9a4f')} />
    {[-140, -100, -60, -25, 15].map((a, i) => <path key={a} transform={`translate(1 -31) rotate(${a})`} d="M0 0 C6 -5 16 -5 24 0 C16 2 6 3 0 0 Z" fill={tint(i % 2 ? '#5f8f3c' : '#71a447')} />)}
    <path d="M1 -31 C4 -26 4 -20 3 -16" stroke={tint('#6b4a2b')} strokeWidth="1" fill="none" />
    {[0, 1, 2].map((k) => <ellipse key={k} cx={3 + (k % 2)} cy={-24 + k * 2.6} rx="2.6" ry="1.2" fill={tint('#d8c24a')} />)}
  </g></g>;
}

export function DoveCage({ tint, className }: { tint: Tint; className: string }) {
  return <g transform="translate(148 254)"><g className={className}>
    <ellipse cy="1" rx="5" ry="1.4" fill="#000" opacity=".14" />
    <rect x="-.9" y="-62" width="1.8" height="62" fill={tint('#8a6a45')} />
    <rect x="-7" y="-63" width="14" height="1.4" fill={tint('#6b4a2b')} />
    <g transform="translate(6 -62)"><g className="lg-lantern">
      <line y2="5" stroke={tint('#4a3b2b')} strokeWidth=".5" />
      <path d="M-5 5 Q0 1 5 5 V14 H-5 Z" fill="none" stroke={tint('#c9a26a')} strokeWidth=".7" />
      {[-3, -1, 1, 3].map((bx) => <line key={bx} x1={bx} y1="4.2" x2={bx} y2="14" stroke={tint('#c9a26a')} strokeWidth=".4" />)}
      <ellipse cx=".5" cy="10.5" rx="2" ry="1.4" fill={tint('#b9a08a')} /><circle cx="2" cy="9.6" r=".9" fill={tint('#b9a08a')} />
    </g></g>
  </g></g>;
}

export function Rambutan({ tint, days, spray, className }: { tint: Tint; days: number; spray: string; className: string }) {
  const growth = Math.min(1, 0.55 + (days - 17) / 120);
  const grown = RAMBUTAN.branches.map((branch) => branchGrowth(branch, growth, RAMBUTAN.maxDepth));
  const ready = RAMBUTAN.anchors.filter((anchor) => grown[anchor.branch] >= anchor.t);
  return <g transform={`translate(360 256) scale(${(0.44 + 0.14 * growth).toFixed(3)})`}><g className={className}>
    <ellipse cy="2" rx="22" ry="4" fill="#000" opacity=".14" />
    <g className="lg-sway slow">
      {RAMBUTAN.branches.map((branch, i) => grown[i] > 0 && <path key={i} d={branchOutline(branch, grown[i], 0.6)} fill={tint('#6e5038')} />)}
      {ready.map((anchor) => <g key={anchor.order} transform={`translate(${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)}) rotate(${anchor.rotate.toFixed(0)}) scale(1.7)`}><use href={`#${spray}`} style={{ color: tint(anchor.tone % 2 ? '#2f6b34' : '#3e7c3d') }} /></g>)}
      {ready.filter((anchor) => anchor.order % 3 === 0).slice(0, 10).map((anchor) => <g key={`f${anchor.order}`} transform={`translate(${anchor.x.toFixed(1)} ${(anchor.y + 4).toFixed(1)})`}>
        {[0, 1, 2].map((k) => <g key={k} transform={`translate(${k * 3.4 - 3.4} ${k % 2 ? 2.6 : 0})`}><circle r="2.6" fill={tint('#d0302c')} /><circle r="3.1" fill="none" stroke={tint('#e85a3c')} strokeWidth=".6" strokeDasharray=".6 .8" /></g>)}
      </g>)}
    </g>
  </g></g>;
}

export function LotusPond({ tint, motion, water, className }: { tint: Tint; motion: boolean; water: string; className: string }) {
  return <g transform="translate(268 236)"><g className={className}>
    <ellipse rx="40" ry="8.5" fill={tint('#7a6a4c')} />
    <ellipse rx="37" ry="7" fill={water} />
    {motion && <g className="lg-koi"><ellipse rx="3.4" ry="1.1" fill="#f08a3a" /><path d="M3.4 0 L6 -1.4 L6 1.4 Z" fill="#f08a3a" /><circle cx="-1.6" cy="-.2" r=".5" fill="#fff" opacity=".8" /></g>}
    {[[-22, 1], [-8, -2.4], [12, 2], [24, -1.4]].map(([px, py], i) => <g key={i} transform={`translate(${px} ${py})`}>
      <ellipse rx="4.6" ry="1.6" fill={tint('#4f8a46')} /><path d="M0 0 L4.6 -.2" stroke={tint('#3c6e36')} strokeWidth=".4" />
      {i % 2 === 0 && <g transform="translate(-1 -1.4)"><path d="M0 0 C-1.6 -2 -1 -4 0 -5 C1 -4 1.6 -2 0 0 Z" fill={tint('#f2a6c2')} /><path d="M0 0 C-3 -1 -3 -3 -2.6 -3.6 C-1.6 -2.6 -.8 -1.4 0 0 Z M0 0 C3 -1 3 -3 2.6 -3.6 C1.6 -2.6 .8 -1.4 0 0 Z" fill={tint('#f7c1d5')} /></g>}
    </g>)}
  </g></g>;
}

export function Pangkin({ tint, className }: { tint: Tint; className: string }) {
  return <g transform="translate(318 254)"><g className={className}>
    <ellipse cy="1" rx="20" ry="2.6" fill="#000" opacity=".14" />
    {[-15, -5, 5, 15].map((lx) => <rect key={lx} x={lx - 1} y="-7" width="2" height="7" fill={tint('#7a5234')} />)}
    <path d="M-18 -8 L18 -8 L15 -11 L-15 -11 Z" fill={tint('#b88a58')} />
    {[-12, -6, 0, 6, 12].map((slat) => <line key={slat} x1={slat} y1="-11" x2={slat * 1.1} y2="-8" stroke={tint('#8f6840')} strokeWidth=".5" />)}
    <path d="M-6 -11.6 Q-2 -14 4 -11.6" stroke={tint('#c9472f')} strokeWidth="2" fill="none" strokeLinecap="round" />
  </g></g>;
}

export function Coconut({ tint, className }: { tint: Tint; className: string }) {
  return <g transform="translate(384 214)"><g className={className}>
    <path d="M0 0 C1 -28 -6 -60 -16 -86 L-19.5 -85 C-10 -60 -4 -30 -4 0 Z" fill={tint('#8f7656')} />
    {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${-1 - i * 1.3} ${-i * 7.2} l-4 -1.2`} stroke={tint('#6e5a40')} strokeWidth=".7" />)}
    <g transform="translate(-18 -86)"><g className="lg-sway slow">
      {[-170, -140, -110, -80, -50, -20, 8, 30].map((angle, i) => <path key={i} transform={`rotate(${angle})`} d="M0 0 C12 -4 26 -2 36 6 C25 2 12 2 0 0 Z" fill={tint(i % 2 ? '#4f7f3a' : '#64944a')} />)}
      {[[-2, 4], [2.6, 5], [0, 7.4]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="2.8" fill={tint(i === 2 ? '#7a8f3a' : '#6c8435')} />)}
    </g></g>
  </g></g>;
}

export function PelitaRow({ tint, glow, lit, className }: { tint: Tint; glow: string; lit: number; className: string }) {
  const xs = Array.from({ length: 12 }, (_, i) => 16 + i * 33.5);
  return <g className={className}>{xs.map((x, i) => <g key={i} transform={`translate(${x} 216)`}>
    <rect x="-.8" y="-26" width="1.6" height="26" fill={tint('#a9894f')} />
    {[-20, -12, -4].map((ny) => <rect key={ny} x="-1" y={ny} width="2" height=".7" fill={tint('#7f6538')} />)}
    {lit > 0 && <circle className="lg-flicker" style={{ animationDelay: `${i * 0.27}s` }} cy="-30" r="8" fill={glow} opacity={lit} />}
    <path d="M-1.8 -26 H1.8 L1.2 -28 H-1.2 Z" fill={tint('#6a4a2b')} />
    <path className={lit > 0 ? 'lg-flicker' : undefined} d="M0 -28 C-1.4 -30 -.6 -32 0 -33.4 C.6 -32 1.4 -30 0 -28 Z" fill={lit > 0 ? '#ffcf5a' : tint('#6a4a2b')} />
  </g>)}</g>;
}

export function Bamboo({ tint, className }: { tint: Tint; className: string }) {
  const stalks = useMemo(() => {
    const random = seeded(87);
    return Array.from({ length: 9 }, (_, i) => ({ x: 20 + i * 6 + random() * 3, h: lerp(70, 105, random()), lean: (random() - 0.5) * 8 }));
  }, []);
  return <g transform="translate(0 214)"><g className={className}>{stalks.map((stalk, i) => <g key={i} className="lg-flower slow" style={{ animationDelay: `${-i * 0.8}s` }}>
    <path d={`M${stalk.x} 0 Q${stalk.x + stalk.lean * 0.4} ${-stalk.h / 2} ${stalk.x + stalk.lean} ${-stalk.h}`} stroke={tint(i % 2 ? '#6f9a3c' : '#80aa48')} strokeWidth="2.2" fill="none" />
    {[0.3, 0.5, 0.7, 0.88].map((t) => <g key={t} transform={`translate(${stalk.x + stalk.lean * t} ${-stalk.h * t})`}>
      <rect x="-1.4" y="-.4" width="2.8" height=".8" fill={tint('#5a7f30')} />
      <path d={`M0 0 C4 -2 8 -2 11 0 C8 1 4 1 0 0 Z`} transform={`rotate(${i % 2 ? -20 : 200})`} fill={tint('#5f8f38')} />
    </g>)}
  </g>)}</g></g>;
}

export function Bougainvillea({ tint, className }: { tint: Tint; className: string }) {
  const blooms = useMemo(() => {
    const random = seeded(19);
    return Array.from({ length: 60 }, () => ({ x: lerp(290, 400, random()), y: lerp(192, 214, random()) + Math.max(0, (random() - 0.6) * 18), r: lerp(1.4, 2.6, random()), pink: random() < 0.7 }));
  }, []);
  return <g className={className}>
    <path d="M286 200 C310 190 350 192 400 196 L400 214 C360 216 320 214 292 212 Z" fill={tint('#4f7a3a')} />
    {blooms.map((bloom, i) => <circle key={i} cx={bloom.x} cy={bloom.y} r={bloom.r} fill={tint(bloom.pink ? '#d63b8a' : '#e86aa8')} />)}
  </g>;
}

/** Orchids tied to the mango's trunk, as people do in kampung gardens. */
export function Orchids({ tint, at, className }: { tint: Tint; at: { x: number; y: number }; className: string }) {
  return <g transform={`translate(${at.x.toFixed(1)} ${at.y.toFixed(1)})`}><g className={className}>
    <path d="M0 0 C6 -2 10 2 14 6" stroke={tint('#4f6e3c')} strokeWidth=".8" fill="none" />
    {[[5, -1], [9, 1.4], [13, 4.6], [3, 2.4]].map(([ox, oy], i) => <g key={i} transform={`translate(${ox} ${oy})`}>
      {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} rx=".9" ry="1.6" cy="-1.3" transform={`rotate(${a})`} fill={tint(i % 2 ? '#b25ad1' : '#d68ae6')} />)}
      <circle r=".7" fill={tint('#f3d34a')} />
    </g>)}
    <path d="M-3 3 C-6 6 -6 10 -4 13" stroke={tint('#6a8a4a')} strokeWidth="1.2" fill="none" />
  </g></g>;
}

export function KampungFlowerHeads({ tint, prefix }: { tint: Tint; prefix: string }) {
  const petals = (count: number, rx: number, ry: number, fill: string, offset = 0) => Array.from({ length: count }, (_, i) =>
    <ellipse key={i} rx={rx} ry={ry} cy={-ry * 0.9} transform={`rotate(${(360 / count) * i + offset})`} fill={fill} />);
  return <>
    {/* Hibiscus, the bunga raya */}
    <g id={`${prefix}0`}>{petals(5, 1.9, 2.4, tint('#d8233a'))}<circle r=".9" fill={tint('#7a0f1f')} /><path d="M0 0 L2.6 -2.6" stroke={tint('#f4d35e')} strokeWidth=".5" /></g>
    {/* Ixora, the jejarum */}
    <g id={`${prefix}1`}>{[[0, 0], [1.8, .8], [-1.8, .8], [0, 1.8], [1, -1.4], [-1, -1.4]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>{petals(4, .55, .9, tint('#e2462f'))}</g>)}</g>
    {/* Orchid */}
    <g id={`${prefix}2`}>{petals(5, 1, 2, tint('#c27ae0'))}<ellipse cy=".8" rx="1.1" ry="1.3" fill={tint('#7d2f9e')} /></g>
    {/* Melur, Arabian jasmine */}
    <g id={`${prefix}3`}>{petals(8, .7, 1.6, tint('#fbf8ee'))}<circle r=".6" fill={tint('#e8d9a0')} /></g>
    {/* Marigold */}
    <g id={`${prefix}4`}>{petals(10, .9, 2, tint('#efa31e'))}<circle r=".9" fill={tint('#b9621a')} /></g>
    {/* Torch ginger, the kantan */}
    <g id={`${prefix}5`}><path d="M0 1 C-3 -1 -3 -5 0 -7 C3 -5 3 -1 0 1 Z" fill={tint('#e0457a')} /><path d="M0 -1 C-1.6 -2 -1.6 -4.4 0 -5.4 C1.6 -4.4 1.6 -2 0 -1 Z" fill={tint('#f27aa2')} /></g>
  </>;
}

export function KampungFrame({ golden, gold, className }: { golden: boolean; gold: string; className: string }) {
  const wood = golden ? gold : '#7a4a2a';
  return <g className={`lg-frame${golden ? ' golden' : ''}${className}`} fill="none" pointerEvents="none">
    <path d={KAMPUNG_FRAME} stroke={wood} strokeWidth={golden ? 4.2 : 3.4} />
    <path d="M5 300 L5 45 Q5 15 35 15 L365 15 Q395 15 395 45 L395 300" stroke={golden ? gold : '#c08a52'} strokeWidth=".7" opacity=".85" />
    {/* A carved cloud scroll (awan larat) at the head of the window. */}
    <g transform="translate(200 10)" stroke={golden ? gold : '#c08a52'} strokeWidth="1" strokeLinecap="round">
      <path d="M-26 0 C-20 -6 -12 -6 -10 -1 C-9 2 -13 3 -14 0" /><path d="M26 0 C20 -6 12 -6 10 -1 C9 2 13 3 14 0" />
      <path d="M-6 -1 C-3 -5 3 -5 6 -1" /><circle cy="-4" r="1.3" fill={golden ? gold : '#c08a52'} stroke="none" />
    </g>
  </g>;
}

