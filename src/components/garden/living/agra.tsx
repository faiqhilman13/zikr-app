import { agraChannel, CUSPED } from './layouts';
import { mix, type Tint } from './palette';
import { lerp } from './random';
import type { Ctx } from './scene';

/**
 * The Mughal garden before the Taj Mahal, seen through a cusped marble arch inlaid with
 * flowers of coloured stone. A charbagh: a long channel of water down the middle with
 * fountains, red sandstone walks, cypresses and flower beds, and the tomb on its plinth
 * with its minarets at the far end, rose at dawn, gold at dusk and silver at night.
 */

const MARBLE = '#f4f1ea';
const MARBLE_SHADE = '#ddd6c8';
const SANDSTONE = '#b5563c';

/** The Taj Mahal, drawn about its centre line; `flip` draws it upside down, for the reflection. */
function Taj({ tint, glow, lit, flip = false }: { tint: Tint; glow: boolean; lit: number; flip?: boolean }) {
  const marble = tint(MARBLE);
  const shade = tint(MARBLE_SHADE);
  const inlay = tint('#5a5a5a');
  const arch = (cx: number, top: number, bottom: number, w: number) => `M${cx - w / 2} ${bottom} V${top + w * 0.5} Q${cx - w / 2} ${top + w * 0.1} ${cx} ${top} Q${cx + w / 2} ${top + w * 0.1} ${cx + w / 2} ${top + w * 0.5} V${bottom} Z`;
  const niche = glow ? mix('#5a5a6a', '#ffd28a', 0.4 * lit) : tint('#b8b0a2');
  const onion = (cx: number, base: number, w: number, h: number) => `M${cx - w * 0.42} ${base} C${cx - w * 0.62} ${base - h * 0.25} ${cx - w * 0.62} ${base - h * 0.62} ${cx - w * 0.2} ${base - h * 0.8} C${cx - w * 0.07} ${base - h * 0.86} ${cx - w * 0.02} ${base - h * 0.92} ${cx} ${base - h} C${cx + w * 0.02} ${base - h * 0.92} ${cx + w * 0.07} ${base - h * 0.86} ${cx + w * 0.2} ${base - h * 0.8} C${cx + w * 0.62} ${base - h * 0.62} ${cx + w * 0.62} ${base - h * 0.25} ${cx + w * 0.42} ${base} Z`;
  const minaret = (x: number) => <g key={x}>
    <path d={`M${x - 3.4} 204 L${x - 2.4} 124 H${x + 2.4} L${x + 3.4} 204 Z`} fill={marble} />
    <path d={`M${x + 1} 204 L${x + 1.2} 124 H${x + 2.4} L${x + 3.4} 204 Z`} fill={shade} />
    {[182, 156, 132].map((y) => <g key={y}><rect x={x - 4.6} y={y} width="9.2" height="2" fill={marble} /><rect x={x - 4.6} y={y + 2} width="9.2" height=".7" fill={shade} /></g>)}
    {Array.from({ length: 8 }, (_, k) => <path key={k} d={`M${x - 3} ${196 - k * 9.4} H${x + 3}`} stroke={shade} strokeWidth=".4" />)}
    {[-2.4, 0, 2.4].map((d) => <rect key={d} x={x + d - 0.4} y="119" width=".8" height="5" fill={marble} />)}
    <path d={onion(x, 119, 7, 7)} fill={marble} />
    <path d={`M${x} 112 V108`} stroke={tint('#c9a24a')} strokeWidth=".7" />
  </g>;
  const chhatri = (x: number) => <g key={x}>
    {[-5, -1.6, 1.6, 5].map((d) => <rect key={d} x={x + d - 0.5} y="126" width="1" height="12" fill={marble} />)}
    <rect x={x - 7} y="125" width="14" height="1.6" fill={marble} />
    <path d={onion(x, 125, 13, 13)} fill={marble} />
    <path d={`M${x} 112 V108`} stroke={tint('#c9a24a')} strokeWidth=".7" />
  </g>;
  return <g transform={flip ? 'translate(0 412) scale(1 -1)' : undefined}>
    {/* The plinth. */}
    <rect x="92" y="196" width="216" height="10" fill={marble} />
    {Array.from({ length: 27 }, (_, k) => <path key={k} d={`M${96 + k * 8} 206 V200 A3 3 0 0 1 ${102 + k * 8} 200 V206`} fill="none" stroke={shade} strokeWidth=".6" />)}
    {[98, 302].map(minaret)}
    {/* The tomb: chamfered corners, a tall central iwan, two storeys of smaller arches either side. */}
    <path d="M148 196 V142 L156 138 H244 L252 142 V196 Z" fill={marble} />
    <path d="M148 196 V142 L156 138 V196 Z M244 138 L252 142 V196 H244 Z" fill={shade} />
    {[160, 172, 228, 240].map((cx, i) => <g key={cx}>
      <path d={arch(cx, 144, 164, 8)} fill={niche} /><path d={arch(cx, 144, 164, 8)} fill="none" stroke={inlay} strokeWidth=".4" />
      <path d={arch(cx, 170, 192, 8)} fill={niche} /><path d={arch(cx, 170, 192, 8)} fill="none" stroke={inlay} strokeWidth=".4" />
      {i % 2 === 0 && <path d={`M${cx - 6} 167 H${cx + 6}`} stroke={inlay} strokeWidth=".4" />}
    </g>)}
    <rect x="180" y="120" width="40" height="76" fill={marble} />
    <rect x="182" y="122" width="36" height="72" fill="none" stroke={inlay} strokeWidth=".7" />
    <rect x="182.6" y="122.6" width="34.8" height="70.8" fill="none" stroke={inlay} strokeWidth="1.1" strokeDasharray="2 1 .6 1" opacity=".6" />
    <path d={arch(200, 132, 194, 26)} fill={niche} />
    <path d={arch(200, 136, 194, 18)} fill={glow ? mix('#4a4a5a', '#ffd28a', 0.55 * lit) : tint('#a49c8e')} />
    <path d={arch(200, 132, 194, 26)} fill="none" stroke={inlay} strokeWidth=".6" />
    {[184, 216].map((x) => <path key={x} d={`M${x} 120 V114`} stroke={marble} strokeWidth="1.4" />)}
    {[160, 240].map(chhatri)}
    {/* The drum and the great onion dome, with its finial and crescent. */}
    <rect x="174" y="110" width="52" height="12" fill={marble} />
    <path d="M176 112 H224" stroke={shade} strokeWidth=".6" />
    <path d={onion(200, 112, 58, 62)} fill={marble} />
    <path d={`M${200 + 10} 64 C${200 + 22} 74 ${200 + 25} 92 ${200 + 17} 110 L${200 + 24} 110 C${200 + 31} 96 ${200 + 28} 76 ${200 + 16} 64 Z`} fill={shade} opacity=".7" />
    <ellipse cx="200" cy="51" rx="3.4" ry="2" fill={tint('#c9a24a')} />
    <path d="M200 50 V40" stroke={tint('#c9a24a')} strokeWidth="1.2" />
    <circle cx="200" cy="44" r="1.4" fill={tint('#c9a24a')} />
    <path d="M200 37 A3 3 0 1 0 202.6 40.6 A2.4 2.4 0 1 1 200 37 Z" fill={tint('#c9a24a')} />
  </g>;
}

export function AgraFar({ palette, tint, lit }: Ctx) {
  const glow = lit > 0;
  const red = tint(SANDSTONE);
  const sideBuilding = (x: number) => <g key={x}>
    <rect x={x} y="178" width="74" height="28" fill={red} />
    {[0, 1, 2, 3, 4].map((k) => <path key={k} d={`M${x + 6 + k * 14} 204 V192 Q${x + 6 + k * 14} 186 ${x + 11 + k * 14} 185 Q${x + 16 + k * 14} 186 ${x + 16 + k * 14} 192 V204 Z`} fill={glow ? '#ffc98a' : tint('#7a3220')} opacity={glow ? 0.6 : 1} />)}
    {[x + 18, x + 37, x + 56].map((cx, k) => <path key={cx} d={`M${cx - (k === 1 ? 9 : 6)} 178 C${cx - (k === 1 ? 9 : 6)} ${k === 1 ? 166 : 170} ${cx} ${k === 1 ? 162 : 167} ${cx} ${k === 1 ? 160 : 165} C${cx} ${k === 1 ? 162 : 167} ${cx + (k === 1 ? 9 : 6)} ${k === 1 ? 166 : 170} ${cx + (k === 1 ? 9 : 6)} 178 Z`} fill={tint(MARBLE)} />)}
  </g>;
  return <>
    {/* Trees around the garden's walls. */}
    {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={i * 19} cy={192 + (i % 2) * 4} r={9 + (i % 3) * 2} fill={mix(palette.hillNear, '#3f6a3a', 0.5)} />)}
    {sideBuilding(-4)}{sideBuilding(330)}
    <Taj tint={tint} glow={glow} lit={lit} />
  </>;
}

export function AgraWall({ tint, on, arrive }: Ctx) {
  return on('champa') ? <g className={arrive('champa')}>{[[28, 214], [372, 214]].map(([x, y]) => <Champa key={x} x={x} y={y} tint={tint} />)}</g> : null;
}

const BEDS = (side: -1 | 1) => {
  const a: string[] = []; const b: string[] = [];
  for (let y = 222; y <= 300; y += 6) {
    const c = agraChannel(y);
    a.push(`${(200 + side * (c.half + c.walk + 3)).toFixed(1)} ${y}`);
    b.unshift(`${(200 + side * lerp(150, 196, (y - 222) / 78)).toFixed(1)} ${y}`);
  }
  return `M${a.join(' L')} L${b.join(' L')} Z`;
};

export function AgraGround(ctx: Ctx) {
  const { tint, url, on, arrive, motion, lit } = ctx;
  const edge = (offset: (c: ReturnType<typeof agraChannel>) => number) => {
    const l: string[] = []; const r: string[] = [];
    for (let y = 206; y <= 300; y += 6) { const c = agraChannel(y); l.push(`${(200 - offset(c)).toFixed(1)} ${y}`); r.unshift(`${(200 + offset(c)).toFixed(1)} ${y}`); }
    return `M${l.join(' L')} L${r.join(' L')} Z`;
  };
  return <>
    <rect y="206" width="400" height="94" fill={url('grass')} />
    {/* Red sandstone walks, then the marble-edged channel. */}
    <path d={edge((c) => c.half + c.walk)} fill={tint(SANDSTONE)} />
    <g stroke={tint('#93432e')} strokeWidth=".5">{[214, 224, 236, 250, 266, 284].map((y) => { const c = agraChannel(y); return <path key={y} d={`M${200 - c.half - c.walk} ${y} H${200 + c.half + c.walk}`} />; })}</g>
    <path d={edge((c) => c.half + 2.4)} fill={tint(MARBLE)} />
    <path d={edge((c) => c.half)} fill={on('channelWater') ? url('water') : tint('#c9c0ae')} className={arrive('channelWater')} />
    {on('reflection') && on('channelWater') && <g className={arrive('reflection')} opacity=".28"><clipPath id={ctx.idOf('chan')}><path d={edge((c) => c.half)} /></clipPath><g clipPath={`url(#${ctx.idOf('chan')})`} transform="translate(200 206) scale(1 1.1) translate(-200 -206)"><Taj tint={tint} glow={lit > 0} lit={lit} flip /></g></g>}
    {on('channelWater') && motion && [222, 240, 262, 286].map((y, i) => { const c = agraChannel(y); return <rect key={y} className="lg-shimmer" style={{ animationDelay: `${i * 0.7}s` }} x={200 - c.half * 0.6} y={y} width={c.half * 1.2} height=".7" fill="#fff" opacity=".6" />; })}
    {/* Flower beds in the quarters of the garden. */}
    {([-1, 1] as const).map((side) => <path key={side} d={BEDS(side)} fill={url('soil')} />)}
    {([-1, 1] as const).map((side) => <path key={`e${side}`} d={BEDS(side)} fill="none" stroke={tint(SANDSTONE)} strokeWidth="2" />)}
    {on('fountainJets') && <g className={arrive('fountainJets')}>{[214, 222, 232, 246, 264].map((y) => { const k = lerp(0.4, 1.3, (y - 214) / 50); return <g key={y} transform={`translate(200 ${y}) scale(${k.toFixed(2)})`} className={motion ? 'lg-water' : undefined}>
      <path d="M0 0 V-10 M0 -10 C-2 -12 -4 -8 -5 -2 M0 -10 C2 -12 4 -8 5 -2" stroke="#e6f4ff" strokeWidth="1" fill="none" strokeLinecap="round" />
    </g>; })}</g>}
    {on('lotusBasin') && <LotusBasin tint={tint} water={url('water')} motion={motion} className={arrive('lotusBasin')} />}
    {on('marbleBench') && <Bench tint={tint} className={arrive('marbleBench')} />}
    {on('cypressAvenue') && <g className={arrive('cypressAvenue')}>{[214, 226, 242, 264].flatMap((y, i) => { const c = agraChannel(y); const h = lerp(24, 64, i / 3); return [-1, 1].map((s) => <Cypress key={`${y}${s}`} x={200 + s * (c.half + c.walk + 6 + i * 2)} y={y} h={h} tint={tint} />); })}</g>}
    {on('diyas') && <g className={arrive('diyas')}>{[226, 240, 258, 280].flatMap((y) => { const c = agraChannel(y); return [-1, 1].map((s) => <Diya key={`${y}${s}`} x={200 + s * (c.half + 3.4)} y={y} k={lerp(0.6, 1.2, (y - 226) / 54)} tint={tint} glow={url('lamp')} lit={Math.max(lit, 0.25)} />); })}</g>}
    {on('chhatri') && <Chhatri tint={tint} className={arrive('chhatri')} />}
    {on('peacock') && <Peacock tint={tint} className={arrive('peacock')} />}
    {on('roseParterre') && <g className={arrive('roseParterre')}>{[[150, 232], [250, 232], [90, 292], [312, 292]].map(([x, y]) => <RoseBush key={x} x={x} y={y} tint={tint} />)}</g>}
  </>;
}

export function AgraFront({ tint, on, arrive, limb }: Ctx) {
  if (!on('parakeets')) return null;
  const at = limb('right', 0.8); const at2 = limb('left', 0.7);
  const parrot = (x: number, y: number, flip: boolean) => <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${flip ? -1 : 1} 1)`}>
    <path d="M-2 0 C-3 -3 -1 -6 2 -6 C4 -6 4.6 -4 4 -2 L1 1 L-4 7 L-3 2 Z" fill={tint('#5fbf4a')} />
    <path d="M3.6 -5.4 C5 -5.6 5.6 -4.4 5 -3.4 L3.8 -4 Z" fill="#d8232f" />
    <circle cx="2.4" cy="-4.6" r=".5" fill="#111" />
    <path d="M0 -2 C1 -1 2 -1 3 -2" stroke="#2f6a2a" strokeWidth=".4" fill="none" />
  </g>;
  return <g className={arrive('parakeets')}>{parrot(at.x, at.y - 2, false)}{parrot(at2.x, at2.y - 2, true)}</g>;
}

export function AgraOver({ tint, on, arrive }: Ctx) {
  if (!on('jaali')) return null;
  // Marble screens pierced in a lattice of hexagons, either side of the view.
  const screen = (x: number, flip: boolean) => <g key={x} transform={`translate(${x} 0) scale(${flip ? -1 : 1} 1)`}>
    <rect x="0" y="206" width="22" height="94" fill={tint(MARBLE)} />
    <rect x="2" y="210" width="18" height="86" fill={tint('#7a7468')} opacity=".55" />
    {Array.from({ length: 12 }, (_, r) => Array.from({ length: 3 }, (_, c) => <path key={`${r}${c}`} transform={`translate(${5 + c * 6 + (r % 2) * 3} ${214 + r * 7})`} d="M-3 0 L-1.5 -2.6 L1.5 -2.6 L3 0 L1.5 2.6 L-1.5 2.6 Z" fill="none" stroke={tint(MARBLE)} strokeWidth="1.1" />))}
    <rect x="0" y="204" width="22" height="3" fill={tint(MARBLE_SHADE)} />
  </g>;
  return <g className={arrive('jaali')}>{screen(0, false)}{screen(400, true)}</g>;
}

function Cypress({ x, y, h, tint }: { x: number; y: number; h: number; tint: Tint }) {
  return <g transform={`translate(${x.toFixed(1)} ${y})`}><g className="lg-sway slow">
    <path d={`M0 0 C-${h * 0.13} -${h * 0.3} -${h * 0.11} -${h * 0.7} 0 -${h} C${h * 0.11} -${h * 0.7} ${h * 0.13} -${h * 0.3} 0 0 Z`} fill={tint('#2a4f36')} />
    <path d={`M0 -2 C-${h * 0.05} -${h * 0.35} -${h * 0.04} -${h * 0.7} 0 -${h - 4}`} stroke={tint('#3a6a48')} strokeWidth="1.2" fill="none" opacity=".7" />
  </g></g>;
}

function Diya({ x, y, k, tint, glow, lit }: { x: number; y: number; k: number; tint: Tint; glow: string; lit: number }) {
  return <g transform={`translate(${x.toFixed(1)} ${y}) scale(${k.toFixed(2)})`}>
    <circle className="lg-flicker" cy="-3" r="5" fill={glow} opacity={lit} />
    <path d="M-2.6 0 C-2.6 -1.6 2.6 -1.6 2.6 0 C2 1 -2 1 -2.6 0 Z" fill={tint('#a8532e')} />
    <path className="lg-flicker" d="M1.4 -1 C.6 -2.2 1 -3.4 1.6 -4.2 C2.2 -3.4 2.4 -2.2 1.4 -1 Z" fill="#ffcf5a" />
  </g>;
}

function LotusBasin({ tint, water, motion, className }: { tint: Tint; water: string; motion: boolean; className: string }) {
  // The raised tank at the garden's heart, its basin shaped like a lotus.
  return <g transform="translate(200 236)"><g className={className}>
    <path d="M-34 0 L-30 -6 H30 L34 0 Z" fill={tint(MARBLE)} />
    <rect x="-34" y="0" width="68" height="4" fill={tint(MARBLE_SHADE)} />
    <ellipse cy="-6" rx="26" ry="4" fill={water} />
    {Array.from({ length: 9 }, (_, i) => { const a = (i / 8) * Math.PI; return <ellipse key={i} cx={Math.cos(a) * 24} cy={-6 + Math.sin(a) * 3.4} rx="4" ry="1.8" fill={tint(MARBLE)} stroke={tint(MARBLE_SHADE)} strokeWidth=".4" />; })}
    {motion && <g className="lg-water"><path d="M0 -6 V-16 M0 -16 C-3 -18 -5 -12 -6 -7 M0 -16 C3 -18 5 -12 6 -7" stroke="#e6f4ff" strokeWidth=".9" fill="none" /></g>}
  </g></g>;
}

function Bench({ tint, className }: { tint: Tint; className: string }) {
  return <g transform="translate(262 250)"><g className={className}>
    <ellipse cy="1" rx="18" ry="2" fill="#000" opacity=".15" />
    <rect x="-15" y="-6" width="3" height="6" fill={tint(MARBLE_SHADE)} /><rect x="12" y="-6" width="3" height="6" fill={tint(MARBLE_SHADE)} />
    <rect x="-17" y="-8.6" width="34" height="3" fill={tint(MARBLE)} />
    <path d="M-10 -5.6 C-6 -3 6 -3 10 -5.6" stroke={tint(MARBLE_SHADE)} strokeWidth=".7" fill="none" />
  </g></g>;
}

function Chhatri({ tint, className }: { tint: Tint; className: string }) {
  // A red sandstone pavilion with a white marble dome.
  return <g transform="translate(352 262)"><g className={className}>
    <ellipse cy="1.5" rx="24" ry="3.5" fill="#000" opacity=".15" />
    <rect x="-20" y="-6" width="40" height="6" fill={tint(SANDSTONE)} />
    {[-15, -5, 5, 15].map((x) => <rect key={x} x={x - 1.4} y="-30" width="2.8" height="24" fill={tint('#c4644a')} />)}
    {[-10, 0, 10].map((x) => <path key={x} d={`M${x - 4} -12 V-20 Q${x} -26 ${x + 4} -20 V-12`} fill="none" stroke={tint('#93432e')} strokeWidth=".7" />)}
    <path d="M-24 -30 H24 L20 -34 H-20 Z" fill={tint('#a64a32')} />
    <path d="M-14 -34 C-14 -46 -4 -50 0 -54 C4 -50 14 -46 14 -34 Z" fill={tint(MARBLE)} />
    <path d="M0 -54 V-59" stroke={tint('#c9a24a')} strokeWidth=".9" />
  </g></g>;
}

function Peacock({ tint, className }: { tint: Tint; className: string }) {
  return <g transform="translate(296 272)"><g className={className}>
    <ellipse cy="1" rx="14" ry="2" fill="#000" opacity=".14" />
    <path d="M-2 -4 C-14 -2 -30 0 -34 4 C-26 6 -12 4 -2 0 Z" fill={tint('#2f7a5a')} />
    {[-30, -24, -18, -12].map((x, i) => <g key={x}><ellipse cx={x} cy={2 - i * 0.6} rx="2" ry="1.4" fill={tint('#2f6fb0')} /><circle cx={x} cy={2 - i * 0.6} r=".7" fill={tint('#e2b33c')} /></g>)}
    <path d="M-1 0 L-1 0 M-3 0 V-1 M1 0 V-1" stroke={tint('#6a5a4a')} />
    <path d="M-6 -2 C-6 -8 2 -10 4 -6 L3 -1 C0 0 -4 0 -6 -2 Z" fill={tint('#1f5fa8')} />
    <path d="M3 -6 C4 -10 4 -13 5 -15" stroke={tint('#1f5fa8')} strokeWidth="1.8" fill="none" />
    <circle cx="5.2" cy="-15.4" r="1.6" fill={tint('#1f5fa8')} />
    <path d="M6.6 -15.4 L8.4 -15" stroke={tint('#b9a07a')} strokeWidth=".7" />
    {[-1, 0, 1].map((k) => <path key={k} d={`M${5 + k} -17 V-20`} stroke={tint('#1f5fa8')} strokeWidth=".4" />)}
    <path d="M-2 0 V4 M2 0 V4" stroke={tint('#8a7a6a')} strokeWidth=".6" />
  </g></g>;
}

function Champa({ x, y, tint }: { x: number; y: number; tint: Tint }) {
  // Frangipani: thick forked branches tipped with leaves and waxy white flowers.
  return <g transform={`translate(${x} ${y})`}><g className="lg-sway slow">
    <path d="M-2 0 C-2 -10 -8 -16 -14 -24 M-1 -8 C2 -16 8 -20 12 -28 M0 -12 C0 -20 -2 -26 0 -34" stroke={tint('#8a7a68')} strokeWidth="3" fill="none" strokeLinecap="round" />
    {[[-14, -24], [12, -28], [0, -34], [-6, -18], [6, -20]].map(([lx, ly], i) => <g key={i} transform={`translate(${lx} ${ly})`}>
      {[-60, -20, 20, 60, 120, 160].map((a) => <path key={a} transform={`rotate(${a})`} d="M0 0 C2 -2 2 -7 0 -9 C-2 -7 -2 -2 0 0 Z" fill={tint('#4f8a3a')} />)}
      {[0, 1, 2].map((k) => <g key={k} transform={`translate(${(k - 1) * 3} ${-2 - (k % 2) * 2})`}>{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} rx=".9" ry="1.7" cy="-1.4" transform={`rotate(${a})`} fill={tint('#fbf6e8')} />)}<circle r=".7" fill={tint('#f2c12e')} /></g>)}
    </g>)}
  </g></g>;
}

function RoseBush({ x, y, tint }: { x: number; y: number; tint: Tint }) {
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cy="1" rx="11" ry="2.2" fill="#000" opacity=".14" />
    <g className="lg-sway slow">
      <path d="M-10 0 C-11 -8 -5 -15 2 -15 C8 -14 11 -8 10 0 Z" fill={tint('#3e6b3a')} />
      {[[-5, -10], [2, -12], [6, -6], [-2, -5], [-7, -4]].map(([bx, by], i) => <circle key={i} cx={bx} cy={by} r="2.4" fill={tint(i % 2 ? '#d64566' : '#e8708a')} />)}
    </g>
  </g>;
}

export function AgraFlowerHeads({ tint, prefix }: { tint: Tint; prefix: string }) {
  const petals = (count: number, rx: number, ry: number, fill: string, offset = 0) => Array.from({ length: count }, (_, i) =>
    <ellipse key={i} rx={rx} ry={ry} cy={-ry * 0.9} transform={`rotate(${(360 / count) * i + offset})`} fill={fill} />);
  return <>
    {/* Marigold, saffron and yellow */}
    <g id={`${prefix}0`}>{petals(12, .9, 2, tint('#f08a1c'))}{petals(9, .7, 1.2, tint('#f5a83a'), 20)}</g>
    <g id={`${prefix}1`}>{petals(12, .9, 2, tint('#f5c62a'))}{petals(9, .7, 1.2, tint('#f8d85a'), 20)}</g>
    {/* Rose */}
    <g id={`${prefix}2`}>{petals(6, 1.6, 2, tint('#c8283a'))}<circle r="1.1" fill={tint('#8a1426')} /></g>
    {/* Mogra jasmine */}
    <g id={`${prefix}3`}>{petals(8, .8, 1.8, tint('#fbf8ee'))}{petals(5, .6, 1, tint('#f3eedd'), 20)}</g>
    {/* Cosmos */}
    <g id={`${prefix}4`}>{petals(8, 1, 2.2, tint('#e47aa8'))}<circle r=".9" fill={tint('#f2c12e')} /></g>
    {/* Iris */}
    <g id={`${prefix}5`}>{petals(3, 1.3, 2.4, tint('#5a4ab0'), 60)}{petals(3, 1, 2.1, tint('#8a7ad8'))}<circle r=".6" fill={tint('#f2cf4a')} /></g>
  </>;
}

/** A cusped arch of white marble, its spandrels inlaid with flowers of coloured stone. */
export function CuspedFrame({ gold, golden, className }: { gold: string; golden: boolean; className: string }) {
  const marble = golden ? '#f8efd2' : MARBLE;
  const line = golden ? gold : '#2f2f2f';
  const flower = (x: number, y: number, k: number) => <g key={`${x}${y}`} transform={`translate(${x} ${y}) scale(${k})`}>
    <path d="M0 8 C-1 2 1 -2 0 -6" stroke="#3f7a3a" strokeWidth=".8" fill="none" />
    <path d="M0 4 C-4 2 -6 -1 -6 -3 C-3 -2 -1 0 0 3 Z M0 2 C4 0 6 -3 6 -5 C3 -4 1 -2 0 1 Z" fill="#3f7a3a" />
    {[-30, 0, 30].map((a, i) => <ellipse key={a} transform={`rotate(${a}) translate(0 -8)`} rx="1.6" ry="3" fill={golden ? '#d4a017' : ['#c8283a', '#e2783a', '#c8283a'][i]} />)}
    <circle cy="-6" r="1" fill="#e2b33c" />
  </g>;
  return <g className={`lg-frame${golden ? ' golden' : ''}${className}`} pointerEvents="none">
    <path d={`M0 0 H400 V300 H0 Z ${CUSPED}`} fill={marble} fillRule="evenodd" />
    {/* The rectangular frame of inscription around the arch. */}
    <path d="M4 4 H396 V300 M4 4 V300" fill="none" stroke={line} strokeWidth="1.2" />
    <path d="M8 8 H392 V300 M8 8 V300" fill="none" stroke={line} strokeWidth="2.2" strokeDasharray="3 1.2 1 1.2 .6 1.2" opacity=".75" />
    <path d="M12 12 H388 V300 M12 12 V300" fill="none" stroke={line} strokeWidth=".8" />
    {flower(52, 46, 1.4)}{flower(348, 46, 1.4)}{flower(30, 96, 1)}{flower(370, 96, 1)}{flower(104, 26, 0.9)}{flower(296, 26, 0.9)}
    <path d={CUSPED} fill="none" stroke={golden ? gold : MARBLE_SHADE} strokeWidth="2.4" />
    <path d={CUSPED} fill="none" stroke={line} strokeWidth=".7" />
  </g>;
}
