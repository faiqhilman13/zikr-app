import { useMemo } from 'react';
import { djennePath, MUD_FRAME } from './layouts';
import { mix, type Tint } from './palette';
import { lerp, seeded } from './random';
import type { Ctx } from './scene';

/**
 * The Djenné garden: a Sahel garden beneath the Great Mosque of Djenné, the largest building
 * of mud in the world. Its three towers and rows of pinnacles are crowned with ostrich eggs;
 * palm-wood beams (toron) stud its walls for the yearly replastering. Seen through a window
 * in a mud wall; a baobab, the floodwater of the Bani, granaries, calabashes and roselle.
 */

const MUD = '#b9875a';
const MUD_SHADE = '#9c6c44';
const MUD_LIGHT = '#cc9c6c';
const TORON = '#5a3e26';

/** A buttress rising above the wall into a cone, an ostrich egg at its tip. */
function Pinnacle({ x, base, top, w, tint }: { x: number; base: number; top: number; w: number; tint: Tint }) {
  return <g>
    <path d={`M${x - w / 2} ${base} V${top + w * 1.4} C${x - w / 2} ${top + w * 0.6} ${x - w * 0.15} ${top + w * 0.2} ${x} ${top} C${x + w * 0.15} ${top + w * 0.2} ${x + w / 2} ${top + w * 0.6} ${x + w / 2} ${top + w * 1.4} V${base} Z`} fill={tint(MUD)} />
    <path d={`M${x + w * 0.15} ${base} V${top + w * 1.4} C${x + w * 0.2} ${top + w * 0.6} ${x + w * 0.1} ${top + w * 0.3} ${x} ${top} C${x + w * 0.15} ${top + w * 0.2} ${x + w / 2} ${top + w * 0.6} ${x + w / 2} ${top + w * 1.4} V${base} Z`} fill={tint(MUD_SHADE)} opacity=".55" />
    <ellipse cx={x} cy={top - 1.2} rx={Math.max(1, w * 0.18)} ry={Math.max(1.3, w * 0.24)} fill={tint('#f4efe2')} />
  </g>;
}

/** Rows of toron, the palm-wood beams standing out from the wall. */
function Torons({ x0, x1, ys, tint, step = 7 }: { x0: number; x1: number; ys: number[]; tint: Tint; step?: number }) {
  return <g stroke={tint(TORON)} strokeWidth="1.1" strokeLinecap="round">{ys.flatMap((y, r) => Array.from({ length: Math.floor((x1 - x0) / step) }, (_, k) => {
    const x = x0 + step / 2 + k * step + (r % 2) * (step / 2);
    return x < x1 ? <path key={`${r}${k}`} d={`M${x} ${y} l1.4 1.6`} /> : null;
  }))}</g>;
}

function Tower({ x, top, w, tint }: { x: number; top: number; w: number; tint: Tint }) {
  return <g>
    <path d={`M${x - w / 2} 196 V${top + 16} H${x + w / 2} V196 Z`} fill={tint(MUD)} />
    <path d={`M${x + w / 6} 196 V${top + 16} H${x + w / 2} V196 Z`} fill={tint(MUD_SHADE)} opacity=".45" />
    {/* Pilasters up the face, each ending in a little cone. */}
    {[-w / 2 + 3, -w / 6, w / 6, w / 2 - 3].map((d) => <Pinnacle key={d} x={x + d} base={196} top={top + 6} w={5} tint={tint} />)}
    <Pinnacle x={x} base={top + 18} top={top} w={9} tint={tint} />
    <Torons x0={x - w / 2} x1={x + w / 2} ys={[top + 30, top + 46, top + 62, top + 78, top + 94]} tint={tint} step={6} />
    <rect x={x - 2.4} y={top + 40} width="4.8" height="8" rx="2" fill={tint('#5a3a22')} />
  </g>;
}

export function DjenneFar({ palette, tint }: Ctx) {
  const haze = mix(palette.skyBottom, '#e8c88a', palette.night ? 0.05 : 0.35);
  return <>
    <rect y="150" width="400" height="60" fill={haze} opacity=".6" />
    {/* The town of Djenné around the mosque: flat-roofed houses of mud, a doum palm. */}
    {[[0, 176, 26], [24, 182, 20], [44, 170, 22], [338, 172, 24], [360, 180, 22], [380, 168, 22]].map(([x, y, w], i) => <g key={i}>
      <rect x={x} y={y} width={w} height={206 - y} fill={tint(i % 2 ? MUD_LIGHT : MUD)} />
      <path d={`M${x} ${y} h${w}`} stroke={tint(MUD_SHADE)} strokeWidth="1.2" />
      {Array.from({ length: Math.floor(w / 6) }, (_, k) => <path key={k} d={`M${x + 3 + k * 6} ${y} v-3`} stroke={tint(MUD)} strokeWidth="2" strokeLinecap="round" />)}
      <rect x={x + w / 2 - 2} y={y + 8} width="4" height="6" fill={tint('#5a3a22')} />
    </g>)}
    {/* The platform, then the qibla wall with its three towers and rows of pinnacles. */}
    <path d="M56 206 V194 H344 V206 Z" fill={tint(MUD_SHADE)} />
    <path d="M56 194 H344" stroke={tint(MUD_LIGHT)} strokeWidth="1.4" />
    <rect x="66" y="112" width="268" height="84" fill={tint(MUD)} />
    <Torons x0={66} x1={334} ys={[126, 144, 162, 180]} tint={tint} />
    {Array.from({ length: 19 }, (_, k) => { const x = 70 + k * 14.4; return [118, 162, 238, 282].some((t) => Math.abs(t - x) < 20) ? null : <Pinnacle key={k} x={x} base={196} top={100} w={6} tint={tint} />; })}
    <Tower x={140} top={66} w={30} tint={tint} />
    <Tower x={200} top={46} w={36} tint={tint} />
    <Tower x={260} top={66} w={30} tint={tint} />
    {/* Steps up to the platform and the doors. */}
    {[0, 1, 2].map((k) => <rect key={k} x={176 - k * 4} y={196 + k * 3.4} width={48 + k * 8} height="3.4" fill={tint(k % 2 ? MUD_LIGHT : MUD)} />)}
    {[100, 300].map((x) => <path key={x} d={`M${x - 4} 196 V184 A4 4 0 0 1 ${x + 4} 184 V196 Z`} fill={tint('#5a3a22')} />)}
  </>;
}

export function DjenneWall({ tint, on, arrive, days }: Ctx) {
  return <>
    {on('sahelMango') && <SahelMango tint={tint} days={days} className={arrive('sahelMango')} />}
    {on('acacia') && <Acacia tint={tint} nests={on('weaverNests')} nestClass={arrive('weaverNests')} className={arrive('acacia')} />}
  </>;
}

const RIVER = 'M0 210 C80 206 160 214 240 210 C320 206 360 212 400 208 L400 226 C340 230 280 224 200 228 C120 232 60 226 0 230 Z';

export function DjenneGround(ctx: Ctx) {
  const { tint, url, on, arrive, motion, lit } = ctx;
  const path = (() => {
    const l: string[] = []; const r: string[] = [];
    for (let y = 226; y <= 300; y += 6) { const p = djennePath(y); l.push(`${(p.x - p.half).toFixed(1)} ${y}`); r.unshift(`${(p.x + p.half).toFixed(1)} ${y}`); }
    return `M${l.join(' L')} L${r.join(' L')} Z`;
  })();
  return <>
    <defs><linearGradient id={ctx.idOf('laterite')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={tint('#c98a56')} /><stop offset="1" stopColor={tint('#a8603a')} /></linearGradient></defs>
    <rect y="206" width="400" height="94" fill={url('laterite')} />
    {/* The floodwater of the Bani, with reeds along it. */}
    <path d={RIVER} fill={url('water')} />
    {motion && [40, 140, 260, 340].map((x, i) => <rect key={x} className="lg-shimmer" style={{ animationDelay: `${i * 0.7}s` }} x={x} y={216 + (i % 2) * 4} width="24" height=".7" fill="#fff" opacity=".55" />)}
    {Array.from({ length: 30 }, (_, i) => { const x = 6 + i * 13.4; const y = 228 + (i % 3); return <path key={i} d={`M${x} ${y} l-1.6 -7 M${x} ${y} l.4 -9 M${x} ${y} l2 -6`} stroke={tint(i % 2 ? '#7a8a3a' : '#8f9a4a')} strokeWidth=".8" />; })}
    {on('waterLilies') && <g className={arrive('waterLilies')}>{[[60, 220], [120, 222], [300, 216], [350, 218], [190, 224]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>
      <ellipse rx="5" ry="1.6" fill={tint('#4f8a46')} />
      {i % 2 === 0 && <g transform="translate(0 -1)">{[0, 60, 120, 180, 240, 300].map((a) => <ellipse key={a} rx=".8" ry="1.8" cy="-1.4" transform={`rotate(${a})`} fill={tint('#8ab0f0')} />)}<circle r=".7" fill={tint('#f2c12e')} /></g>}
    </g>)}</g>}
    {on('pirogue') && <Pirogue tint={tint} motion={motion} className={arrive('pirogue')} />}
    <path d={path} fill={tint('#dcae7a')} />
    {on('millet') && <Millet tint={tint} className={arrive('millet')} />}
    {on('granary') && <Granaries tint={tint} className={arrive('granary')} />}
    {on('bogolan') && <Bogolan tint={tint} className={arrive('bogolan')} />}
    {on('canari') && <Canari tint={tint} className={arrive('canari')} />}
    {on('bissap') && <g className={arrive('bissap')}>{[[24, 262], [168, 268], [372, 274]].map(([x, y]) => <Bissap key={x} x={x} y={y} tint={tint} />)}</g>}
    {on('calabash') && <Calabash tint={tint} className={arrive('calabash')} />}
    {on('guineaFowl') && <GuineaFowl tint={tint} className={arrive('guineaFowl')} />}
    {on('sahelLamps') && <g className={arrive('sahelLamps')}>{[238, 256, 278].flatMap((y) => { const p = djennePath(y); return [-1, 1].map((s) => <Lamp key={`${y}${s}`} x={p.x + s * (p.half + 4)} y={y} k={lerp(0.7, 1.15, (y - 238) / 40)} tint={tint} glow={url('lamp')} lit={lit} />); })}</g>}
  </>;
}

function Pirogue({ tint, motion, className }: { tint: Tint; motion: boolean; className: string }) {
  return <g transform="translate(250 218)"><g className={className}><g className={motion ? 'lg-flower slow' : undefined}>
    <path d="M-30 -2 C-20 4 20 4 30 -2 L32 -5 C20 -1 -20 -1 -32 -5 Z" fill={tint('#6e4a2c')} />
    <path d="M-26 -2 H26" stroke={tint('#c9a24a')} strokeWidth=".6" strokeDasharray="2 2" />
    <path d="M-10 -4 C-10 -10 10 -10 10 -4 Z" fill={tint('#c8a46a')} />
    {[-6, 0, 6].map((x) => <path key={x} d={`M${x} -4 V-8.6`} stroke={tint('#8a6a3a')} strokeWidth=".5" />)}
    <path d="M20 -4 L28 -24" stroke={tint('#5a3e26')} strokeWidth=".9" />
  </g></g></g>;
}

function Canari({ tint, className }: { tint: Tint; className: string }) {
  // Big clay water jars that keep water cool through the heat.
  return <g className={className}>{[[176, 254, 1], [190, 258, 0.8], [164, 260, 0.7]].map(([x, y, k], i) => <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
    <ellipse cy="1" rx="10" ry="2.4" fill="#000" opacity=".15" />
    <path d="M-5 -16 H5 L6 -14 C11 -12 12 -4 8 0 H-8 C-12 -4 -11 -12 -6 -14 Z" fill={tint(i % 2 ? '#a8603a' : '#b8703f')} />
    <path d="M-9 -8 H9" stroke={tint('#7a4a2a')} strokeWidth=".6" strokeDasharray="1.4 1" />
    <ellipse cy="-16" rx="5" ry="1.2" fill={tint('#7a4a2a')} />
    {i === 0 && <path d="M-3 -18 C-2 -22 2 -22 3 -18" fill={tint('#e8c48a')} stroke={tint('#a8803a')} strokeWidth=".4" />}
  </g>)}</g>;
}

function Bissap({ x, y, tint }: { x: number; y: number; tint: Tint }) {
  // Roselle, its red calyces brewed into bissap.
  return <g transform={`translate(${x} ${y})`}><g className="lg-sway slow">
    <ellipse cy="1" rx="9" ry="2" fill="#000" opacity=".12" />
    {[-6, -2, 2, 6].map((dx, i) => <path key={dx} d={`M0 0 Q${dx * 0.6} -8 ${dx} -${16 + (i % 2) * 4}`} stroke={tint('#8a2a3a')} strokeWidth="1" fill="none" />)}
    {[[-5, -10], [3, -14], [6, -8], [-2, -17], [-6, -15], [1, -6]].map(([lx, ly], i) => <g key={i} transform={`translate(${lx} ${ly})`}>
      <path d="M0 0 L-2.6 -2 L-1 -2.4 L0 -4.4 L1 -2.4 L2.6 -2 Z" fill={tint('#3f7a34')} />
      {i % 2 === 0 && <path d="M-1.6 1 C-2 3 2 3 1.6 1 L0 -1 Z" fill={tint('#c8283a')} />}
    </g>)}
  </g></g>;
}

function Granaries({ tint, className }: { tint: Tint; className: string }) {
  // Round granaries of mud on stone feet, capped in conical thatch.
  return <g className={className}>{[[330, 240, 1], [358, 236, 0.85], [384, 242, 0.95]].map(([x, y, k], i) => <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
    <ellipse cy="1" rx="12" ry="2.6" fill="#000" opacity=".16" />
    {[-6, 0, 6].map((d) => <rect key={d} x={d - 1.6} y="-3" width="3.2" height="3" fill={tint('#8a7a68')} />)}
    <path d="M-9 -3 C-11 -12 -10 -20 -8 -24 H8 C10 -20 11 -12 9 -3 Z" fill={tint(i % 2 ? MUD_LIGHT : MUD)} />
    <path d="M3 -3 C5 -12 5 -20 4 -24 H8 C10 -20 11 -12 9 -3 Z" fill={tint(MUD_SHADE)} opacity=".45" />
    <rect x="-2.6" y="-16" width="5.2" height="5" fill={tint('#5a3a22')} />
    <path d="M-13 -22 L0 -40 L13 -22 Q0 -20 -13 -22 Z" fill={tint('#c9a35a')} />
    {Array.from({ length: 7 }, (_, l) => <path key={l} d={`M${-12 + l * 4} -22 L0 -40`} stroke={tint('#a8843a')} strokeWidth=".5" />)}
    <path d="M0 -40 V-44" stroke={tint('#a8843a')} strokeWidth="1" />
  </g>)}</g>;
}

function Bogolan({ tint, className }: { tint: Tint; className: string }) {
  // Mud cloth drying on a line: white figures on dark brown.
  return <g className={className}>
    {[214, 274].map((x) => <rect key={x} x={x - 1} y="226" width="2" height="22" fill={tint('#5a3e26')} />)}
    <path d="M214 228 Q244 232 274 228" stroke={tint('#3d3226')} strokeWidth=".5" fill="none" />
    {[[218, 26], [246, 24]].map(([x, w], i) => <g key={x} className="lg-flower slow" style={{ animationDelay: `${-i}s` }}>
      <rect x={x} y="229.6" width={w} height="14" fill={tint(i ? '#4a3220' : '#5a3e26')} />
      {Array.from({ length: 4 }, (_, r) => Array.from({ length: Math.floor(w / 5) }, (_, c) => <path key={`${r}${c}`} d={(r + c) % 2 ? `M${x + 2 + c * 5} ${232 + r * 3.2} h3` : `M${x + 3.4 + c * 5} ${231 + r * 3.2} v2.4`} stroke={tint('#efe6d6')} strokeWidth=".7" />))}
    </g>)}
  </g>;
}

function Calabash({ tint, className }: { tint: Tint; className: string }) {
  return <g className={className}>
    <path d="M248 292 C262 284 276 292 292 286" stroke={tint('#4f7f3c')} strokeWidth=".9" fill="none" />
    {[[256, 288], [270, 290], [286, 286]].map(([x, y], i) => <path key={i} d={`M${x} ${y} c-4 -3 -1 -7 2 -6 c2 -3 6 0 3 3 Z`} fill={tint('#5f8f3c')} />)}
    {[[262, 292, 1], [282, 292, 0.8]].map(([x, y, k], i) => <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
      <ellipse cy="1" rx="7" ry="1.6" fill="#000" opacity=".15" />
      <path d="M0 -12 C3 -12 3 -9 2 -7 C7 -6 8 0 0 0 C-8 0 -7 -6 -2 -7 C-3 -9 -3 -12 0 -12 Z" fill={tint(i ? '#d8b45a' : '#c9a24a')} />
      <ellipse cx="-2" cy="-4" rx="1.6" ry="1" fill="#fff" opacity=".25" />
    </g>)}
  </g>;
}

function GuineaFowl({ tint, className }: { tint: Tint; className: string }) {
  const bird = (x: number, y: number, flip: boolean) => <g key={x} transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
    <path d="M-1 0 V3 M1 0 V3" stroke={tint('#c9783a')} strokeWidth=".5" />
    <path d="M-6 0 C-7 -6 3 -7 4 -2 L3 1 C-1 2 -5 2 -6 0 Z" fill={tint('#3a3a44')} />
    {[[-4, -3], [-2, -1], [0, -3], [-3, -.6], [1, -1], [-1, -4.4]].map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r=".45" fill="#f2f2f2" />)}
    <path d="M3 -2 C4 -4 5 -6 5 -6" stroke={tint('#3a3a44')} strokeWidth="1" />
    <circle cx="5.2" cy="-6.6" r="1.3" fill={tint('#2f6fb0')} /><path d="M5 -8 L5.6 -9.6 L6 -8 Z" fill={tint('#c9a24a')} /><circle cx="5.6" cy="-5.6" r=".6" fill="#d8232f" />
  </g>;
  return <g className={className}>{bird(214, 270, false)}{bird(232, 276, true)}</g>;
}

function Lamp({ x, y, k, tint, glow, lit }: { x: number; y: number; k: number; tint: Tint; glow: string; lit: number }) {
  return <g transform={`translate(${x.toFixed(1)} ${y}) scale(${k.toFixed(2)})`}>
    {lit > 0 && <circle className="lg-flicker" cy="-4" r="6" fill={glow} opacity={lit} />}
    <path d="M-2.4 0 C-3 -2 -2 -3.4 0 -3.4 C2 -3.4 3 -2 2.4 0 Z" fill={tint('#a8603a')} />
    <path className={lit > 0 ? 'lg-flicker' : undefined} d="M0 -3.4 C-.8 -4.6 -.4 -5.8 0 -6.6 C.4 -5.8 .8 -4.6 0 -3.4 Z" fill={lit > 0 ? '#ffcf5a' : tint('#6a4a2b')} />
  </g>;
}

function Millet({ tint, className }: { tint: Tint; className: string }) {
  const stalks = useMemo(() => {
    const random = seeded(97);
    return Array.from({ length: 16 }, (_, i) => ({ x: 4 + i * 4 + random() * 2, h: lerp(26, 40, random()), lean: (random() - 0.5) * 6 }));
  }, []);
  return <g className={className}>{stalks.map((s, i) => <g key={i} className="lg-flower slow" style={{ animationDelay: `${-i * 0.5}s` }}>
    <path d={`M${s.x} 246 Q${s.x + s.lean * 0.4} ${246 - s.h / 2} ${s.x + s.lean} ${246 - s.h}`} stroke={tint('#a8a24a')} strokeWidth="1" fill="none" />
    <path d={`M${s.x} ${246 - s.h * 0.4} q4 -2 6 -6`} stroke={tint('#8a9a3a')} strokeWidth=".8" fill="none" />
    <ellipse cx={s.x + s.lean} cy={246 - s.h - 4} rx="1.6" ry="5" fill={tint(i % 2 ? '#c9a24a' : '#b8903a')} />
  </g>)}</g>;
}

function Acacia({ tint, nests, nestClass, className }: { tint: Tint; nests: boolean; nestClass: string; className: string }) {
  // A flat-topped acacia of the Sahel; weaver birds hang their nests from it.
  return <g transform="translate(352 212)"><g className={className}><g className="lg-sway slow">
    <path d="M0 0 C-1 -12 2 -22 -2 -32 M-1 -20 C-8 -26 -18 -30 -26 -36 M0 -24 C8 -30 18 -32 26 -38" stroke={tint('#5a4a3a')} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <path d="M-40 -36 C-30 -46 -10 -48 0 -46 C14 -48 34 -46 42 -38 C30 -34 -24 -32 -40 -36 Z" fill={tint('#6f8a3a')} />
    <path d="M-34 -40 C-20 -46 20 -46 36 -40" stroke={tint('#8aa04a')} strokeWidth="1.4" fill="none" />
    {nests && <g className={nestClass}>{[[-24, -34], [-12, -33], [10, -33], [26, -35]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>
      <path d="M0 0 V2" stroke={tint('#8a7a4a')} strokeWidth=".4" />
      <path d="M0 2 C-3 3 -3 8 0 9 C3 8 3 3 0 2 Z" fill={tint('#a8a05a')} />
      <path d="M0 9 V11" stroke={tint('#a8a05a')} strokeWidth="1.4" />
    </g>)}</g>}
  </g></g></g>;
}

function SahelMango({ tint, days, className }: { tint: Tint; days: number; className: string }) {
  const k = Math.min(1, 0.6 + (days - 49) / 100);
  return <g transform={`translate(30 226) scale(${k.toFixed(2)})`}><g className={className}><g className="lg-sway slow">
    <path d="M0 0 C-1 -10 2 -18 0 -24" stroke={tint('#5e4a3a')} strokeWidth="3.4" fill="none" />
    <circle cy="-36" r="17" fill={tint('#2f5f2c')} /><circle cx="-11" cy="-30" r="11" fill={tint('#3b6f33')} /><circle cx="10" cy="-42" r="11" fill={tint('#2a5428')} />
    {[[-6, -26], [8, -30], [-12, -36], [2, -40]].map(([x, y], i) => <path key={i} d={`M${x} ${y} c1.6 0 2 2 1.4 3.4 c-.6 1.4 -2.6 1.4 -3 0 c-.4 -1.4 0 -3.4 1.6 -3.4 Z`} fill={tint('#f2a33a')} />)}
  </g></g></g>;
}

export function DjenneFlowerHeads({ tint, prefix }: { tint: Tint; prefix: string }) {
  const petals = (count: number, rx: number, ry: number, fill: string, offset = 0) => Array.from({ length: count }, (_, i) =>
    <ellipse key={i} rx={rx} ry={ry} cy={-ry * 0.9} transform={`rotate(${(360 / count) * i + offset})`} fill={fill} />);
  return <>
    {/* Desert rose */}
    <g id={`${prefix}0`}>{petals(5, 1.7, 2.2, tint('#e8608a'))}<circle r="1" fill={tint('#fbe0e6')} /></g>
    {/* Hibiscus */}
    <g id={`${prefix}1`}>{petals(5, 1.9, 2.4, tint('#d8233a'))}<path d="M0 0 L2.6 -2.6" stroke={tint('#f4d35e')} strokeWidth=".5" /></g>
    {/* Acacia puffs */}
    <g id={`${prefix}2`}><circle r="2.2" fill={tint('#f2c12e')} />{Array.from({ length: 10 }, (_, i) => <circle key={i} cx={Math.cos(i * 0.63) * 2.4} cy={Math.sin(i * 0.63) * 2.4} r=".5" fill={tint('#f8d85a')} />)}</g>
    {/* Morning glory */}
    <g id={`${prefix}3`}><circle r="2.6" fill={tint('#7a5ad0')} /><circle r="1.2" fill={tint('#f2f0f8')} /></g>
    {/* Sesame */}
    <g id={`${prefix}4`}><path d="M-1.6 0 C-2 -3 -1 -5 0 -5 C1 -5 2 -3 1.6 0 Z" fill={tint('#fbf6ee')} /><path d="M-1 -.4 C-.6 -1 .6 -1 1 -.4" stroke={tint('#c9a0b8')} strokeWidth=".5" fill="none" /></g>
    {/* Marigold */}
    <g id={`${prefix}5`}>{petals(10, .9, 2, tint('#f08a1c'))}<circle r=".9" fill={tint('#a5521a')} /></g>
  </>;
}

/** A window in a wall of mud, its top a row of pinnacles, its sides studded with toron. */
export function MudFrame({ gold, golden, className }: { gold: string; golden: boolean; className: string }) {
  const mud = golden ? '#e8c46a' : MUD;
  const shade = golden ? '#b8861a' : MUD_SHADE;
  const toron = golden ? '#8a6414' : TORON;
  return <g className={`lg-frame${golden ? ' golden' : ''}${className}`} pointerEvents="none">
    <path d={`M0 0 H400 V300 H0 Z ${MUD_FRAME}`} fill={mud} fillRule="evenodd" />
    <path d={MUD_FRAME} fill="none" stroke={shade} strokeWidth="2" />
    {/* Pinnacles along the top, each crowned with an ostrich egg. */}
    {Array.from({ length: 12 }, (_, k) => { const x = 18 + k * 33.1; return <g key={k}>
      <path d={`M${x - 6} 22 V10 C${x - 6} 4 ${x - 1} 1 ${x} -2 C${x + 1} 1 ${x + 6} 4 ${x + 6} 10 V22 Z`} fill={mud} />
      <path d={`M${x + 2} 22 V10 C${x + 3} 5 ${x + 1} 1 ${x} -2 C${x + 1} 1 ${x + 6} 4 ${x + 6} 10 V22 Z`} fill={shade} opacity=".5" />
      <ellipse cx={x} cy="-1" rx="1.6" ry="2.2" fill={golden ? gold : '#f4efe2'} />
    </g>; })}
    {/* Toron along the sides and the lintel. */}
    <g stroke={toron} strokeWidth="1.8" strokeLinecap="round">
      {Array.from({ length: 12 }, (_, k) => <path key={`l${k}`} d={`M8 ${48 + k * 22} h-6 M392 ${48 + k * 22} h6`} />)}
      {Array.from({ length: 16 }, (_, k) => <path key={`t${k}`} d={`M${28 + k * 23.6} 24 v-2.6`} />)}
    </g>
    <path d="M0 26 H400" stroke={shade} strokeWidth="1" opacity=".6" />
  </g>;
}

