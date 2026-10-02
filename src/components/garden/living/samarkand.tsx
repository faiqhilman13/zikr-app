import { samarkandPath, TIMURID } from './layouts';
import { mix, type Tint } from './palette';
import { lerp } from './random';
import type { Ctx } from './scene';

/**
 * The Samarkand garden below the Registan: three madrasas faced in blue tile, Ulugh Beg's,
 * Tilya-Kori with its turquoise dome and Sher-Dor with its tigers and suns, seen through a
 * Timurid arch of tile mosaic. Below them an orchard garden with an irrigation ditch (ariq),
 * a tapchan to sit on under the vine, melons, pomegranates and roses.
 */

const COBALT = '#1f4f9a';
const TURQUOISE = '#2fa8b8';
const BRICK = '#c9a87a';
const OCHRE = '#d9a64a';

/** A panel of tile mosaic: eight-pointed stars on cobalt. */
function Tiles({ x, y, w, h, tint }: { x: number; y: number; w: number; h: number; tint: Tint }) {
  const star = 'M0 -2.6 L.8 -.8 L2.6 0 L.8 .8 L0 2.6 L-.8 .8 L-2.6 0 L-.8 -.8 Z';
  const cols = Math.max(1, Math.floor(w / 6)); const rows = Math.max(1, Math.floor(h / 6));
  return <g>
    <rect x={x} y={y} width={w} height={h} fill={tint(COBALT)} />
    {Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => <path key={`${r}${c}`} d={star} transform={`translate(${(x + (c + 0.5) * (w / cols)).toFixed(1)} ${(y + (r + 0.5) * (h / rows)).toFixed(1)})`} fill={tint((r + c) % 2 ? TURQUOISE : '#f2ecdc')} />))}
  </g>;
}

function Minaret({ x, top, tint, lean = 0 }: { x: number; top: number; tint: Tint; lean?: number }) {
  return <g transform={`rotate(${lean} ${x} 204)`}>
    <path d={`M${x - 5} 204 L${x - 3.6} ${top + 8} H${x + 3.6} L${x + 5} 204 Z`} fill={tint(BRICK)} />
    {Array.from({ length: Math.floor((204 - top - 10) / 10) }, (_, k) => <rect key={k} x={x - 4.6 + k * 0.1} y={top + 12 + k * 10} width={9.2 - k * 0.2} height={k % 3 === 0 ? 3 : 1.6} fill={tint(k % 3 === 0 ? TURQUOISE : COBALT)} />)}
    <path d={`M${x - 3.6} ${top + 8} L${x - 5.4} ${top + 2} H${x + 5.4} L${x + 3.6} ${top + 8} Z`} fill={tint(TURQUOISE)} />
    {[-4, -2, 0, 2, 4].map((d) => <path key={d} d={`M${x + d} ${top + 2} V${top + 7}`} stroke={tint('#1f6f7a')} strokeWidth=".5" />)}
    <rect x={x - 5.4} y={top} width="10.8" height="2" fill={tint('#e8dcc4')} />
  </g>;
}

function RibbedDome({ x, base, w, h, tint }: { x: number; base: number; w: number; h: number; tint: Tint }) {
  return <g>
    <rect x={x - w * 0.42} y={base} width={w * 0.84} height={h * 0.35} fill={tint(COBALT)} />
    <path d={`M${x - w * 0.42} ${base + h * 0.06} H${x + w * 0.42}`} stroke={tint('#f2ecdc')} strokeWidth=".8" strokeDasharray="1.4 1" />
    <path d={`M${x - w / 2} ${base} C${x - w / 2} ${base - h * 0.7} ${x - w * 0.2} ${base - h} ${x} ${base - h} C${x + w * 0.2} ${base - h} ${x + w / 2} ${base - h * 0.7} ${x + w / 2} ${base} Z`} fill={tint(TURQUOISE)} />
    {Array.from({ length: 9 }, (_, k) => { const t = (k + 1) / 10; const bx = x - w / 2 + w * t; return <path key={k} d={`M${bx.toFixed(1)} ${base} Q${lerp(bx, x, 0.4).toFixed(1)} ${(base - h * 0.75).toFixed(1)} ${x} ${base - h}`} stroke={tint('#1f8494')} strokeWidth=".6" fill="none" />; })}
    <path d={`M${x} ${base - h} V${base - h - 5}`} stroke={tint('#c9a24a')} strokeWidth=".8" />
  </g>;
}

/** A madrasa's great portal: a pointed iwan in a tiled frame. */
function Pishtaq({ x, w, top, tint, glow, lit, tigers = false }: { x: number; w: number; top: number; tint: Tint; glow: boolean; lit: number; tigers?: boolean }) {
  const inner = w * 0.56;
  const arch = `M${x - inner / 2} 204 V${top + w * 0.5} C${x - inner / 2} ${top + w * 0.25} ${x - inner * 0.1} ${top + w * 0.18} ${x} ${top + w * 0.12} C${x + inner * 0.1} ${top + w * 0.18} ${x + inner / 2} ${top + w * 0.25} ${x + inner / 2} ${top + w * 0.5} V204 Z`;
  return <g>
    <Tiles x={x - w / 2} y={top} w={w} h={204 - top} tint={tint} />
    <rect x={x - w / 2} y={top} width={w} height="5" fill={tint(TURQUOISE)} />
    <path d={`M${x - w / 2 + 2} ${top + 2.6} H${x + w / 2 - 2}`} stroke={tint('#f2ecdc')} strokeWidth="1.4" strokeDasharray="2 1 .6 1" />
    <path d={arch} fill={glow ? mix('#2a2a3a', '#ffd28a', 0.45 * lit) : tint('#3a3550')} />
    <path d={arch} fill="none" stroke={tint(TURQUOISE)} strokeWidth="2.4" />
    <path d={arch} fill="none" stroke={tint('#f2ecdc')} strokeWidth=".8" strokeDasharray="1.6 1.6" />
    {/* Muqarnas in the head of the iwan, and a window below. */}
    {[0, 1, 2].map((row) => Array.from({ length: 5 - row }, (_, i) => { const n = 5 - row; const cx = x + (i - (n - 1) / 2) * (inner / 6); const cy = top + w * 0.36 + row * 4.4; return <path key={`${row}${i}`} d={`M${cx - inner / 12} ${cy} Q${cx} ${cy - 4} ${cx + inner / 12} ${cy} Z`} fill={tint(row % 2 ? COBALT : TURQUOISE)} opacity=".9" />; }))}
    <rect x={x - inner * 0.18} y={top + w * 0.62} width={inner * 0.36} height={inner * 0.5} fill={tint(COBALT)} opacity=".6" />
    {tigers && [-1, 1].map((s) => <g key={s} transform={`translate(${x + s * (inner / 2 + (w - inner) / 4)} ${top + w * 0.3}) scale(${s} 1)`}>
      {/* A tiger with a sun rising on its back, chasing a white deer: Sher-Dor's mosaic. */}
      <circle cx="1" cy="-5" r="3.6" fill={tint('#f2c12e')} />
      {Array.from({ length: 10 }, (_, k) => <path key={k} d={`M${1 + Math.cos((k / 10) * Math.PI * 2) * 4} ${-5 + Math.sin((k / 10) * Math.PI * 2) * 4} l${Math.cos((k / 10) * Math.PI * 2) * 1.6} ${Math.sin((k / 10) * Math.PI * 2) * 1.6}`} stroke={tint('#f2c12e')} strokeWidth=".6" />)}
      <circle cx=".2" cy="-5.4" r=".4" fill="#222" /><circle cx="1.8" cy="-5.4" r=".4" fill="#222" />
      <path d="M-6 2 C-6 -1 2 -2 5 0 L6 -2 L7 0 L6 3 L-6 3 Z" fill={tint('#e88a2a')} />
      {[-4, -2, 0, 2].map((sx) => <path key={sx} d={`M${sx} -.6 V2.6`} stroke={tint('#3a2a1a')} strokeWidth=".5" />)}
      <path d="M-6 2 C-8 1 -9 -1 -8 -2" stroke={tint('#e88a2a')} strokeWidth=".8" fill="none" />
      <path d="M-11 4 C-11 2 -14 2 -14 4 Z M-14 3 l-1 -2" fill={tint('#f2ecdc')} stroke={tint('#f2ecdc')} strokeWidth=".4" />
    </g>)}
  </g>;
}

export function SamarkandFar({ palette, tint, lit, on }: Ctx) {
  const glow = lit > 0;
  const lightUp = on('illumination') && (palette.night || lit > 0);
  const arcade = (x0: number, x1: number, rows: number) => <g>
    <rect x={x0} y={204 - rows * 22} width={x1 - x0} height={rows * 22} fill={tint(BRICK)} />
    {Array.from({ length: rows }, (_, r) => Array.from({ length: Math.floor((x1 - x0) / 11) }, (_, k) => {
      const cx = x0 + 5.5 + k * 11; const y = 204 - (r + 1) * 22;
      return <g key={`${r}${k}`}>
        <rect x={cx - 4.4} y={y + 3} width="8.8" height="17" fill={tint(COBALT)} opacity=".5" />
        <path d={`M${cx - 3} ${y + 20} V${y + 9} Q${cx - 3} ${y + 5} ${cx} ${y + 4} Q${cx + 3} ${y + 5} ${cx + 3} ${y + 9} V${y + 20} Z`} fill={glow ? mix('#2a2a3a', '#ffd28a', 0.35 * lit) : tint('#3a3550')} />
      </g>;
    }))}
    <rect x={x0} y={204 - rows * 22 - 3} width={x1 - x0} height="3" fill={tint(TURQUOISE)} />
  </g>;
  return <>
    {/* The Zarafshan range, far off. */}
    <path d="M0 150 C40 132 80 140 120 128 C170 116 220 130 270 120 C320 110 360 126 400 118 L400 190 L0 190 Z" fill={mix(palette.hillFar, '#a8a8b8', 0.3)} />
    {/* Ulugh Beg's madrasa. */}
    <RibbedDome x={40} base={126} w={20} h={16} tint={tint} /><RibbedDome x={112} base={126} w={20} h={16} tint={tint} />
    {arcade(24, 128, 2)}
    <Pishtaq x={76} w={54} top={98} tint={tint} glow={glow} lit={lit} />
    <Minaret x={22} top={66} tint={tint} lean={-1.5} /><Minaret x={130} top={66} tint={tint} lean={1.2} />
    {/* Tilya-Kori, its dome to one side. */}
    <RibbedDome x={176} base={140} w={30} h={26} tint={tint} />
    {arcade(150, 252, 2)}
    <Pishtaq x={202} w={48} top={112} tint={tint} glow={glow} lit={lit} />
    {[150, 252].map((x) => <g key={x}><rect x={x - 3} y="150" width="6" height="54" fill={tint(BRICK)} /><rect x={x - 3.6} y="146" width="7.2" height="5" fill={tint(TURQUOISE)} /></g>)}
    {/* Sher-Dor, with its tigers. */}
    <RibbedDome x={288} base={126} w={20} h={16} tint={tint} /><RibbedDome x={360} base={126} w={20} h={16} tint={tint} />
    {arcade(272, 376, 2)}
    <Pishtaq x={324} w={54} top={98} tint={tint} glow={glow} lit={lit} tigers />
    <Minaret x={270} top={66} tint={tint} lean={-1.2} /><Minaret x={378} top={66} tint={tint} lean={1.5} />
    {lightUp && <g className="lg-flicker" opacity=".35">{[76, 202, 324].map((x) => <ellipse key={x} cx={x} cy="160" rx="60" ry="50" fill="#ffd28a" />)}</g>}
    {/* The square, paved in brick. */}
    <rect y="204" width="400" height="24" fill={tint('#d4b48a')} />
    <g stroke={tint('#b8966a')} strokeWidth=".4">{Array.from({ length: 60 }, (_, i) => <path key={i} d={`M${i * 7} 228 l6 -24`} />)}{[210, 217].map((y) => <path key={y} d={`M0 ${y} H400`} />)}</g>
  </>;
}

export function SamarkandWall({ tint, on, arrive, days }: Ctx) {
  return on('mulberry') ? <Mulberry tint={tint} days={days} className={arrive('mulberry')} /> : null;
}

export function SamarkandGround(ctx: Ctx) {
  const { tint, url, on, arrive, motion, lit } = ctx;
  const path = (() => {
    const l: string[] = []; const r: string[] = [];
    for (let y = 228; y <= 300; y += 6) { const p = samarkandPath(y); l.push(`${(p.x - p.half).toFixed(1)} ${y}`); r.unshift(`${(p.x + p.half).toFixed(1)} ${y}`); }
    return `M${l.join(' L')} L${r.join(' L')} Z`;
  })();
  return <>
    <rect y="228" width="400" height="72" fill={url('grass')} />
    <path d="M0 236 C100 232 300 240 400 234 L400 300 L0 300 Z" fill={url('soil')} opacity=".35" />
    <path d={path} fill={tint('#d4b48a')} />
    <g stroke={tint('#b8966a')} strokeWidth=".4">{[236, 246, 258, 272, 288].map((y) => { const p = samarkandPath(y); return <path key={y} d={`M${p.x - p.half} ${y} H${p.x + p.half}`} />; })}</g>
    {on('ariq') && <g className={arrive('ariq')}>
      <path d="M0 238 C100 234 300 242 400 236 L400 242 C300 248 100 240 0 244 Z" fill={tint('#8a7050')} />
      <path d="M0 239 C100 235 300 243 400 237 L400 241 C300 247 100 239 0 243 Z" fill={url('water')} />
      {motion && [40, 150, 270, 360].map((x, i) => <rect key={x} className="lg-shimmer" style={{ animationDelay: `${i * 0.6}s` }} x={x} y="240" width="18" height=".6" fill="#fff" opacity=".6" />)}
    </g>}
    {on('roseRows') && <g className={arrive('roseRows')}>{[20, 52, 84, 116, 146, 250, 282, 314, 346, 378].map((x, i) => <RoseBush key={x} x={x} y={234 + (i % 2)} k={0.7} tint={tint} />)}</g>}
    {on('anor') && <Anor tint={tint} className={arrive('anor')} />}
    {on('melons') && <Melons tint={tint} className={arrive('melons')} />}
    {on('grapeTrellis') && <Trellis tint={tint} className={arrive('grapeTrellis')} back />}
    {on('tapchan') && <Tapchan ctx={ctx} />}
    {on('grapeTrellis') && <Trellis tint={tint} className={arrive('grapeTrellis')} />}
    {on('uzbekLanterns') && <Lanterns tint={tint} glow={url('lamp')} lit={lit} className={arrive('uzbekLanterns')} />}
    {on('hoopoe') && <Hoopoe tint={tint} className={arrive('hoopoe')} />}
    {on('ceramics') && <g className={arrive('ceramics')}><Jug x={250} y={290} tint={tint} /><Jug x={262} y={294} tint={tint} small /></g>}
  </>;
}

function Tapchan({ ctx }: { ctx: Ctx }) {
  // A raised wooden bed for sitting and taking tea outdoors, spread with carpets.
  const { tint, on, arrive } = ctx;
  return <g transform="translate(320 270)"><g className={arrive('tapchan')}>
    <ellipse cy="2" rx="46" ry="5" fill="#000" opacity=".15" />
    {[-38, -14, 14, 38].map((x) => <rect key={x} x={x - 1.6} y="-14" width="3.2" height="14" fill={tint('#7a5232')} />)}
    <path d="M-44 -14 L-36 -24 H36 L44 -14 Z" fill={tint('#a87a4a')} />
    <path d="M-44 -14 H44 V-11 H-44 Z" fill={tint('#7a5232')} />
    {/* The rail around three sides, carved. */}
    <path d="M-36 -24 V-34 H36 V-24 M-44 -14 V-24 L-36 -34 M44 -14 V-24 L36 -34" stroke={tint('#6e4322')} strokeWidth="1.6" fill="none" />
    {Array.from({ length: 12 }, (_, k) => <path key={k} d={`M${-33 + k * 6} -24 V-34`} stroke={tint('#8f5f32')} strokeWidth=".8" />)}
    {on('suzani') && <g className={arrive('suzani')}>
      <rect x="-32" y="-34" width="64" height="10" fill={tint('#f2e6cf')} />
      {[-24, -8, 8, 24].map((x, i) => <g key={x}><circle cx={x} cy="-29" r="3.4" fill={tint(i % 2 ? '#2f5f8a' : '#c8283a')} /><circle cx={x} cy="-29" r="1.6" fill={tint('#f2c12e')} /></g>)}
    </g>}
    <path d="M-40 -15 L-33 -23 H33 L40 -15 Z" fill={tint('#a8322f')} />
    <path d="M-36 -16 L-30 -22 H30 L36 -16 Z" fill="none" stroke={tint('#f2c12e')} strokeWidth=".6" strokeDasharray="2 1" />
    {[-26, 26].map((x) => <rect key={x} x={x - 6} y="-27" width="12" height="7" rx="2.4" fill={tint(x < 0 ? '#2f5f8a' : '#3f8a5a')} />)}
    {/* A low table, the dastarkhan. */}
    <rect x="-14" y="-21" width="28" height="2" fill={tint('#6e4322')} />
    {on('choynak') && <g className={arrive('choynak')}>
      <path d="M-6 -21 C-8 -24 -6 -27 -3 -27 H1 C4 -27 5 -24 3 -21 Z" fill={tint(COBALT)} /><path d="M-3 -27 C-3 -29 1 -29 1 -27" fill={tint(COBALT)} />
      <path d="M3 -24 C6 -25 7 -27 8 -28" stroke={tint(COBALT)} strokeWidth="1" fill="none" /><path d="M-6 -24 C-9 -24 -9 -21 -6 -22" stroke={tint(COBALT)} strokeWidth=".8" fill="none" />
      {[6, 10].map((x) => <path key={x} d={`M${x - 1.6} -22.6 Q${x} -20.6 ${x + 1.6} -22.6`} fill={tint('#f2ecdc')} stroke={tint(COBALT)} strokeWidth=".4" />)}
      <circle cx="-11" cy="-22.2" r="2.6" fill={tint('#c99a5c')} /><circle cx="-11" cy="-22.2" r="1.2" fill={tint('#e8c48a')} />
    </g>}
    {on('ceramics') && <g transform="translate(18 -23)"><ellipse rx="4" ry="1.4" fill={tint('#f2ecdc')} /><ellipse rx="3" ry=".9" fill={tint(COBALT)} /><ellipse rx="1.4" ry=".4" fill={tint(TURQUOISE)} /></g>}
  </g></g>;
}

function Trellis({ tint, className, back = false }: { tint: Tint; className: string; back?: boolean }) {
  // The vine over the tapchan, on poles: the back poles behind it, the leaves and grapes over it.
  if (back) return <g className={className}>{[282, 358].map((x) => <rect key={x} x={x - 1.4} y="212" width="2.8" height="44" fill={tint('#6e4322')} />)}</g>;
  return <g className={className}>
    {[272, 368].map((x) => <rect key={x} x={x - 1.6} y="212" width="3.2" height="62" fill={tint('#6e4322')} />)}
    <path d="M266 212 H374 M276 206 H364" stroke={tint('#6e4322')} strokeWidth="2" />
    {Array.from({ length: 30 }, (_, i) => <g key={i} transform={`translate(${268 + (i % 15) * 7.4} ${208 + Math.floor(i / 15) * 5 + (i % 3)}) rotate(${(i * 47) % 360})`}>
      <path d="M0 0 C-4 -2 -5 -7 -2 -9 C-1 -7 0 -8 0 -10 C1 -8 2 -7 3 -9 C6 -7 4 -2 0 0 Z" fill={tint(i % 2 ? '#5f8b43' : '#6f9b4c')} />
    </g>)}
    {[284, 304, 330, 352].map((x, i) => <g key={x} transform={`translate(${x} 216)`}>{[[0, 0], [2.2, 0], [1.1, 1.9], [-1.1, 1.9], [3.3, 1.9], [0, 3.8], [2.2, 3.8], [1.1, 5.7]].map(([gx, gy], k) => <circle key={k} cx={gx} cy={gy} r="1.3" fill={tint(i % 2 ? '#c4c86a' : '#6a3a6a')} />)}</g>)}
  </g>;
}

function Lanterns({ tint, glow, lit, className }: { tint: Tint; glow: string; lit: number; className: string }) {
  return <g className={className}>{[290, 320, 350].map((x, i) => <g key={x} transform={`translate(${x} 212)`}><g className="lg-lantern" style={{ animationDelay: `${i * 0.5}s` }}>
    <line y2="8" stroke={tint('#3d3226')} strokeWidth=".5" />
    {lit > 0 && <circle className="lg-flicker" cy="13" r="14" fill={glow} opacity={lit} />}
    <path d="M-3 8 H3 L4 10 C5 13 4 16 2 18 H-2 C-4 16 -5 13 -4 10 Z" fill={lit > 0 ? '#ffd27a' : tint('#c9982e')} stroke={tint('#8a6418')} strokeWidth=".5" />
    {[10.6, 13, 15.4].map((y) => <path key={y} d={`M-3.6 ${y} H3.6`} stroke={tint('#8a6418')} strokeWidth=".4" strokeDasharray=".8 .8" />)}
    <path d="M0 18 V21" stroke={tint('#8a6418')} strokeWidth=".6" />
  </g></g>)}</g>;
}

function Anor({ tint, className }: { tint: Tint; className: string }) {
  return <g transform="translate(30 286)"><g className={className}><g className="lg-sway slow">
    <ellipse cy="2" rx="16" ry="3" fill="#000" opacity=".14" />
    <path d="M-2 0 C-3 -8 -8 -14 -10 -20 M0 0 C1 -10 6 -16 9 -22 M-1 -4 C-1 -12 0 -18 0 -26" stroke={tint('#6a4a34')} strokeWidth="1.4" fill="none" />
    {Array.from({ length: 22 }, (_, i) => <ellipse key={i} cx={-12 + (i % 6) * 5} cy={-12 - Math.floor(i / 6) * 5 + (i % 2) * 2} rx="1.4" ry="3" transform={`rotate(${(i * 37) % 180} ${-12 + (i % 6) * 5} ${-12 - Math.floor(i / 6) * 5})`} fill={tint(i % 2 ? '#3a7634' : '#2f6a2c')} />)}
    {[[-8, -14], [6, -18], [0, -10], [-4, -22], [9, -10]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}><circle r="2.8" fill={tint('#c3262f')} /><path d="M-1 -2.6 L0 -4 L1 -2.6" fill={tint('#8c1a22')} /></g>)}
  </g></g></g>;
}

function Melons({ tint, className }: { tint: Tint; className: string }) {
  return <g className={className}>
    {[[240, 278, 1], [226, 286, 0.9], [258, 282, 1.1]].map(([x, y, k], i) => <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
      <ellipse cy="1" rx="8" ry="2" fill="#000" opacity=".14" />
      <ellipse rx="7.4" ry="3.8" fill={tint(i === 1 ? '#3f7a34' : '#e8c84a')} />
      {i === 1 ? [-4, -1, 2, 5].map((sx) => <path key={sx} d={`M${sx} -3.6 Q${sx + 1} 0 ${sx} 3.6`} stroke={tint('#2a5a24')} strokeWidth=".8" fill="none" />) : <path d="M-6 -1 Q0 -3 6 -1 M-6 1 Q0 -1 6 1" stroke={tint('#c9a83a')} strokeWidth=".5" fill="none" />}
      <ellipse cx="-2" cy="-1.6" rx="2" ry=".8" fill="#fff" opacity=".25" />
    </g>)}
    <path d="M214 290 C224 284 236 290 246 284" stroke={tint('#4f7f3c')} strokeWidth=".8" fill="none" />
    {[[218, 288], [232, 288], [244, 285]].map(([x, y], i) => <path key={i} d={`M${x} ${y} c-3 -3 -1 -6 2 -5 c2 -2 5 0 3 3 Z`} fill={tint('#5f8f3c')} />)}
  </g>;
}

function Hoopoe({ tint, className }: { tint: Tint; className: string }) {
  return <g transform="translate(190 258)"><g className={className}>
    <path d="M-1 0 V3 M1 0 V3" stroke={tint('#3a3a3a')} strokeWidth=".5" />
    <path d="M-6 0 C-6 -4 2 -5 4 -2 L3 1 C-1 2 -5 2 -6 0 Z" fill={tint('#e0a06a')} />
    <path d="M-6 0 L-9 -1 L-8 1 Z M-5 -2 L1 -2 M-4 0 L2 0" stroke={tint('#2a2a2a')} strokeWidth=".9" fill={tint('#2a2a2a')} />
    <circle cx="4" cy="-3" r="2" fill={tint('#e0a06a')} />
    <path d="M5.6 -3 L10 -2" stroke={tint('#3a3a3a')} strokeWidth=".6" />
    <path d="M2 -4 C1 -8 3 -10 5 -9 C6 -10 8 -9 7 -6 L5 -4.4 Z" fill={tint('#e88a3a')} />
    {[2.4, 4.2, 6].map((x) => <circle key={x} cx={x} cy={-8.6 + (x - 4) * 0.3} r=".5" fill="#222" />)}
  </g></g>;
}

function Jug({ x, y, tint, small = false }: { x: number; y: number; tint: Tint; small?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${small ? 0.7 : 1})`}>
    <ellipse cy="1" rx="5" ry="1.4" fill="#000" opacity=".15" />
    <path d="M-4 0 C-6 -4 -5 -8 -2 -9 V-12 H2 V-9 C5 -8 6 -4 4 0 Z" fill={tint(COBALT)} />
    <path d="M-4.6 -4 H4.6" stroke={tint('#f2ecdc')} strokeWidth="1" strokeDasharray="1 1" />
    <path d="M2 -11 C5 -11 6 -7 4 -5" stroke={tint(COBALT)} strokeWidth=".9" fill="none" />
  </g>;
}

function Mulberry({ tint, days, className }: { tint: Tint; days: number; className: string }) {
  const k = Math.min(1, 0.6 + (days - 49) / 100);
  return <g transform={`translate(386 232) scale(${k.toFixed(2)})`}><g className={className}><g className="lg-sway slow">
    <path d="M0 0 C-1 -10 2 -18 0 -26" stroke={tint('#6a4e3c')} strokeWidth="3" fill="none" />
    <circle cy="-36" r="16" fill={tint('#4f7f34')} /><circle cx="-10" cy="-30" r="10" fill={tint('#5a8a3c')} /><circle cx="8" cy="-42" r="10" fill={tint('#46762e')} />
    {Array.from({ length: 10 }, (_, i) => <ellipse key={i} cx={-12 + (i % 5) * 6} cy={-28 - Math.floor(i / 5) * 12} rx=".9" ry="1.6" fill={tint(i % 2 ? '#4a1a3a' : '#f2ecdc')} />)}
  </g></g></g>;
}

function RoseBush({ x, y, k, tint }: { x: number; y: number; k: number; tint: Tint }) {
  return <g transform={`translate(${x} ${y}) scale(${k})`}>
    <g className="lg-sway slow">
      <path d="M-10 0 C-11 -8 -5 -14 2 -14 C8 -13 11 -8 10 0 Z" fill={tint('#3e6b3a')} />
      {[[-5, -9], [2, -11], [6, -5], [-2, -4], [-7, -3]].map(([bx, by], i) => <circle key={i} cx={bx} cy={by} r="2.4" fill={tint(i % 2 ? '#c8283a' : '#e8708a')} />)}
    </g>
  </g>;
}

export function SamarkandFlowerHeads({ tint, prefix }: { tint: Tint; prefix: string }) {
  const petals = (count: number, rx: number, ry: number, fill: string, offset = 0) => Array.from({ length: count }, (_, i) =>
    <ellipse key={i} rx={rx} ry={ry} cy={-ry * 0.9} transform={`rotate(${(360 / count) * i + offset})`} fill={fill} />);
  return <>
    {/* Wild tulip of the steppe, red and yellow */}
    <g id={`${prefix}0`}><path d="M0 .6 C-2.4 -1 -2.6 -4.4 -1.2 -6.6 L0 -4.6 L1.2 -6.6 C2.6 -4.4 2.4 -1 0 .6 Z" fill={tint('#d8232f')} /></g>
    <g id={`${prefix}1`}><path d="M0 .6 C-2.4 -1 -2.6 -4.4 -1.2 -6.6 L0 -4.6 L1.2 -6.6 C2.6 -4.4 2.4 -1 0 .6 Z" fill={tint('#f2c12e')} /></g>
    {/* Poppy */}
    <g id={`${prefix}2`}>{petals(4, 2, 2.2, tint('#e2382a'))}<circle r=".9" fill={tint('#2a1a1a')} /></g>
    {/* Iris */}
    <g id={`${prefix}3`}>{petals(3, 1.3, 2.4, tint('#5a4ab0'), 60)}{petals(3, 1, 2.1, tint('#8a7ad8'))}<circle r=".6" fill={tint('#f2cf4a')} /></g>
    {/* Rose */}
    <g id={`${prefix}4`}>{petals(6, 1.6, 2, tint('#e8708a'))}<circle r="1" fill={tint('#c8283a')} /></g>
    {/* Marigold */}
    <g id={`${prefix}5`}>{petals(10, .9, 2, tint('#efa31e'))}<circle r=".9" fill={tint('#b9621a')} /></g>
  </>;
}

/** A Timurid arch in a frame of tile mosaic. */
export function TimuridFrame({ gold, golden, className, ctx }: { gold: string; golden: boolean; className: string; ctx: Ctx }) {
  const id = ctx.idOf('girih');
  const ground = golden ? '#c9971f' : COBALT;
  return <g className={`lg-frame${golden ? ' golden' : ''}${className}`} pointerEvents="none">
    <defs><pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
      <rect width="18" height="18" fill={ground} />
      {/* Girih: an eight-pointed star in an octagon, with crosses between. */}
      <path d="M9 2.4 L10.9 6.2 L15 7.1 L12 10 L12.7 14.2 L9 12.2 L5.3 14.2 L6 10 L3 7.1 L7.1 6.2 Z" fill="none" stroke={golden ? '#f6dc8e' : TURQUOISE} strokeWidth=".9" />
      <path d="M9 5.6 L9.9 8.1 L12.4 9 L9.9 9.9 L9 12.4 L8.1 9.9 L5.6 9 L8.1 8.1 Z" fill={golden ? '#fff3c4' : '#f2ecdc'} />
      <path d="M0 0 L2 0 L0 2 Z M18 0 L16 0 L18 2 Z M0 18 L2 18 L0 16 Z M18 18 L16 18 L18 16 Z" fill={golden ? '#fff3c4' : OCHRE} />
    </pattern></defs>
    <path d={`M0 0 H400 V300 H0 Z ${TIMURID}`} fill={`url(#${id})`} fillRule="evenodd" />
    {/* A band of square kufic around the frame, and a twisted turquoise rope along the arch. */}
    <path d="M3 300 V3 H397 V300" fill="none" stroke={golden ? '#fff3c4' : '#f2ecdc'} strokeWidth="5" />
    <path d="M3 300 V3 H397 V300" fill="none" stroke={golden ? gold : COBALT} strokeWidth="3" strokeDasharray="3 1.5 1.5 1.5" />
    <path d={TIMURID} fill="none" stroke={golden ? gold : TURQUOISE} strokeWidth="4.4" />
    <path d={TIMURID} fill="none" stroke={golden ? '#fff3c4' : '#f2ecdc'} strokeWidth="4.4" strokeDasharray="2 3" />
  </g>;
}
