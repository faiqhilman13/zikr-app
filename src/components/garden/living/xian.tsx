import { useMemo } from 'react';
import { MOON_GATE, XIAN_POND, xianPath } from './layouts';
import { mix, type Tint } from './palette';
import { lerp, seeded } from './random';
import type { Ctx } from './scene';

/**
 * The Xi'an garden, by the Great Mosque of Xi'an: a Chinese courtyard seen through a moon
 * gate. The mosque's octagonal Introspection Tower rises behind a memorial archway, its
 * prayer hall roofed in blue-green tiles; the city wall and the Qinling mountains beyond.
 * A plum tree, a koi pond with a zigzag bridge, scholar's rocks, peonies and bamboo.
 */

const TILE = '#3f8a7a';
const TILE_DARK = '#2c6458';
const RED = '#a8322a';

export function XianFar({ palette, tint, lit }: Ctx) {
  const glow = lit > 0;
  return <>
    {/* The Qinling mountains. */}
    <path d="M0 140 C30 120 60 126 90 112 C120 100 150 116 180 108 C220 96 250 112 290 104 C330 96 360 110 400 104 L400 180 L0 180 Z" fill={mix(palette.hillFar, '#8aa0b4', 0.35)} />
    <path d="M0 156 C40 142 90 148 140 140 C200 132 260 142 320 134 C360 130 390 136 400 134 L400 184 L0 184 Z" fill={mix(palette.hillFar, '#9ab0a8', 0.25)} opacity=".9" />
    {/* The city wall, with a gate tower of many windows. */}
    <rect x="0" y="164" width="400" height="20" fill={tint('#8a8478')} />
    {Array.from({ length: 50 }, (_, i) => <rect key={i} x={i * 8} y="161" width="5" height="3.4" fill={tint('#8a8478')} />)}
    <g transform="translate(52 164)">
      <rect x="-30" y="-20" width="60" height="20" fill={tint('#8a7a68')} />
      {Array.from({ length: 4 }, (_, row) => Array.from({ length: 10 }, (_, k) => <rect key={`${row}${k}`} x={-27 + k * 5.6} y={-18 + row * 4.6} width="2" height="2.2" fill={glow ? '#ffd28a' : tint('#3f362e')} opacity={glow ? 0.8 : 1} />))}
      <path d="M-36 -20 Q-30 -24 -24 -25 H24 Q30 -24 36 -20 Z" fill={tint('#4a4a4a')} />
      <path d="M-24 -25 H24 L18 -32 H-18 Z" fill={tint('#5a5a58')} />
    </g>
  </>;
}

/** A Chinese roof: a curved hip with eaves that sweep up at the ends. */
function Roof({ x, y, w, h, tint, fill = TILE, ridge = true }: { x: number; y: number; w: number; h: number; tint: Tint; fill?: string; ridge?: boolean }) {
  const lift = h * 0.45;
  return <g>
    <path d={`M${x - w / 2 - 4} ${y - lift} Q${x - w / 2 + 2} ${y + 1} ${x - w / 2 + 10} ${y} H${x + w / 2 - 10} Q${x + w / 2 - 2} ${y + 1} ${x + w / 2 + 4} ${y - lift} Q${x + w / 4} ${y - h * 0.8} ${x + w / 5} ${y - h} H${x - w / 5} Q${x - w / 4} ${y - h * 0.8} ${x - w / 2 - 4} ${y - lift} Z`} fill={tint(fill)} />
    {Array.from({ length: Math.floor(w / 4) }, (_, k) => { const tx = x - w / 2 + 6 + k * 4; return <path key={k} d={`M${tx} ${y} L${lerp(x - w / 5, x + w / 5, (tx - (x - w / 2)) / w)} ${y - h + 1}`} stroke={tint(TILE_DARK)} strokeWidth=".45" opacity=".7" />; })}
    {ridge && <path d={`M${x - w / 5 - 2} ${y - h} H${x + w / 5 + 2}`} stroke={tint(TILE_DARK)} strokeWidth="1.8" strokeLinecap="round" />}
    {ridge && [-1, 1].map((s) => <path key={s} d={`M${x + s * (w / 5 + 2)} ${y - h} q${s * 2} -3 ${s * 1} -5`} stroke={tint(TILE_DARK)} strokeWidth="1.4" fill="none" />)}
  </g>;
}

/** The Introspection Tower: octagonal, two storeys, three tiers of eaves. */
function Tower({ tint, glow, lit }: { tint: Tint; glow: boolean; lit: number }) {
  const lattice = (x: number, y: number, w: number, h: number) => <g>
    <rect x={x} y={y} width={w} height={h} fill={glow ? '#ffd28a' : tint('#7a3a2a')} opacity={glow ? 0.55 + 0.4 * lit : 1} />
    {Array.from({ length: Math.floor(w / 2.4) }, (_, k) => <line key={`v${k}`} x1={x + 1.2 + k * 2.4} y1={y} x2={x + 1.2 + k * 2.4} y2={y + h} stroke={tint('#5a2a1e')} strokeWidth=".4" />)}
    {Array.from({ length: Math.floor(h / 2.4) }, (_, k) => <line key={`h${k}`} x1={x} y1={y + 1.2 + k * 2.4} x2={x + w} y2={y + 1.2 + k * 2.4} stroke={tint('#5a2a1e')} strokeWidth=".4" />)}
  </g>;
  return <g transform="translate(176 0)">
    <rect x="-30" y="176" width="60" height="16" fill={tint('#bdb5a6')} />
    {Array.from({ length: 12 }, (_, k) => <rect key={k} x={-29 + k * 5} y="174" width="1.4" height="5" fill={tint('#d9d2c4')} />)}
    <rect x="-30" y="173" width="60" height="1.6" fill={tint('#d9d2c4')} />
    {/* Lower storey. */}
    <rect x="-22" y="140" width="44" height="34" fill={tint('#c9bba0')} />
    {[-21, -11, 9, 19].map((cx) => <rect key={cx} x={cx} y="140" width="2.2" height="34" fill={tint(RED)} />)}
    {lattice(-8.6, 146, 17.2, 26)}
    {lattice(-18.6, 150, 7, 18)}{lattice(11.6, 150, 7, 18)}
    <rect x="-24" y="139" width="48" height="3" fill={tint('#3d6a8a')} />
    {Array.from({ length: 10 }, (_, k) => <rect key={k} x={-23 + k * 4.8} y="139.4" width="2.4" height="2.2" fill={tint(k % 2 ? '#e2b33c' : '#2f8a6e')} />)}
    <Roof x={0} y={139} w={64} h={14} tint={tint} ridge={false} />
    {/* Upper storey. */}
    <rect x="-15" y="108" width="30" height="20" fill={tint('#c9bba0')} />
    {[-14, -5, 3, 12].map((cx) => <rect key={cx} x={cx} y="108" width="2" height="20" fill={tint(RED)} />)}
    {lattice(-3, 111, 6, 15)}
    <Roof x={0} y={108} w={48} h={11} tint={tint} ridge={false} />
    {/* Crowning roof, octagonal and pointed. */}
    <rect x="-9" y="88" width="18" height="10" fill={tint('#c9bba0')} />
    <path d="M-20 92 Q-14 94 -10 93 L0 70 L10 93 Q14 94 20 92 Q12 88 8 86 L0 70 L-8 86 Q-12 88 -20 92 Z" fill={tint(TILE)} />
    <path d="M0 70 L-6 92 M0 70 L6 92 M0 70 V93" stroke={tint(TILE_DARK)} strokeWidth=".6" />
    <circle cy="66" r="2.4" fill={tint('#d4a017')} /><circle cy="61.6" r="1.6" fill={tint('#d4a017')} /><path d="M0 60 V54" stroke={tint('#d4a017')} strokeWidth=".8" />
  </g>;
}

export function XianWall(ctx: Ctx) {
  const { tint, lit, on, arrive } = ctx;
  const glow = lit > 0;
  return <>
    {/* The prayer hall: a broad hipped roof of glazed tiles over red columns. */}
    <g>
      <rect x="230" y="166" width="170" height="30" fill={tint('#c9bba0')} />
      {Array.from({ length: 9 }, (_, k) => <rect key={k} x={236 + k * 20} y="166" width="3" height="30" fill={tint(RED)} />)}
      {Array.from({ length: 8 }, (_, k) => <rect key={`d${k}`} x={242 + k * 20} y="170" width="12" height="22" fill={glow ? '#ffd28a' : tint('#7a3a2a')} opacity={glow ? 0.55 + 0.4 * lit : 0.9} />)}
      <rect x="226" y="163" width="178" height="4" fill={tint('#3d6a8a')} />
      <Roof x={318} y={163} w={200} h={30} tint={tint} />
      <path d="M262 133 l-4 -6 l6 2 Z M374 133 l4 -6 l-6 2 Z" fill={tint(TILE_DARK)} />
    </g>
    <Tower tint={tint} glow={glow} lit={lit} />
    {/* The courtyard wall, whitewashed under a coping of grey tiles. */}
    <rect x="0" y="186" width="400" height="18" fill={tint('#e9e3d6')} />
    <path d="M-2 186 L402 186 L398 181 L2 181 Z" fill={tint('#5f625f')} />
    {Array.from({ length: 67 }, (_, i) => <path key={i} d={`M${i * 6} 186 q3 -2 6 0`} stroke={tint('#454845')} strokeWidth=".5" fill="none" />)}
    {[60, 120].map((x) => <g key={x}>
      <rect x={x - 8} y="190" width="16" height="10" fill={tint('#c9c2b4')} />
      <path d={`M${x - 8} 195 H${x + 8} M${x} 190 V200 M${x - 4} 190 L${x + 4} 200 M${x + 4} 190 L${x - 4} 200`} stroke={tint('#7a756a')} strokeWidth=".6" />
    </g>)}
    <rect x="0" y="203" width="400" height="2" fill={tint('#c9c2b4')} />
    {on('xianBamboo') && <Bamboo tint={tint} className={arrive('xianBamboo')} />}
    {on('redLanterns') && <RedLanterns tint={tint} glow={ctx.url('lamp')} lit={lit} className={arrive('redLanterns')} />}
    {on('pailou') && <Pailou tint={tint} className={arrive('pailou')} />}
  </>;
}

const POND = (() => {
  const { x, y, rx, ry } = XIAN_POND;
  const random = seeded(73);
  const points = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const k = 1 + (random() - 0.5) * 0.16;
    return `${(x + Math.cos(a) * rx * k).toFixed(1)} ${(y + Math.sin(a) * ry * k).toFixed(1)}`;
  });
  return `M${points.join(' L')} Z`;
})();

export function XianGround(ctx: Ctx) {
  const { tint, url, on, arrive, motion } = ctx;
  const path = (() => {
    const left: string[] = []; const right: string[] = [];
    for (let y = 205; y <= 300; y += 5) { const p = xianPath(y); left.push(`${(p.x - p.half).toFixed(1)} ${y}`); right.unshift(`${(p.x + p.half).toFixed(1)} ${y}`); }
    return `M${left.join(' L')} L${right.join(' L')} Z`;
  })();
  return <>
    <rect y="205" width="400" height="95" fill={tint('#a9a08c')} />
    {/* Grey brick courtyard, laid in herringbone. */}
    <g stroke={tint('#8f8775')} strokeWidth=".45" opacity=".7">
      {[210, 216, 223, 231, 240, 250, 261, 273, 286].map((y) => <line key={y} x1="0" y1={y} x2="400" y2={y} />)}
      {Array.from({ length: 40 }, (_, i) => <line key={`v${i}`} x1={-200 + i * 20} y1="300" x2={lerp(-200 + i * 20, 200, 0.55)} y2="205" />)}
    </g>
    {/* Beds of earth for the peonies, either side of the walk. */}
    <path d="M14 300 L22 254 L158 254 L168 300 Z" fill={url('soil')} />
    <path d="M232 300 L240 276 L392 276 L396 300 Z" fill={url('soil')} />
    <path d="M14 300 L22 254 L158 254 L168 300 M232 300 L240 276 L392 276 L396 300" fill="none" stroke={tint('#bdb5a6')} strokeWidth="2.4" />
    <path d={path} fill={tint('#cfc7b6')} />
    {on('hexPavers') && <g className={arrive('hexPavers')}>{Array.from({ length: 13 }, (_, row) => {
      const y = 208 + row * row * 0.48 + row * 1.6; const p = xianPath(y); const k = lerp(0.35, 1.1, (y - 205) / 95);
      return Array.from({ length: 3 }, (_, i) => <path key={`${row}${i}`} transform={`translate(${(p.x + (i - 1) * p.half * 0.62).toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(2)} ${(k * 0.5).toFixed(2)})`}
        d="M-5 0 L-2.5 -4.3 L2.5 -4.3 L5 0 L2.5 4.3 L-2.5 4.3 Z" fill={tint(row % 2 ? '#bfb6a2' : '#b3aa95')} stroke={tint('#8f8775')} strokeWidth=".6" />);
    })}</g>}
    {on('stele') && <Stele tint={tint} className={arrive('stele')} />}
    {on('koiPond') && <g className={arrive('koiPond')}>
      <path d={POND} fill={tint('#7a7466')} transform="translate(0 2)" />
      <path d={POND} fill={url('water')} />
      <path d={POND} fill="none" stroke={tint('#8f897a')} strokeWidth="2.6" strokeDasharray="5 2" />
      {motion && <g className="lg-koi" transform={`translate(${XIAN_POND.x} ${XIAN_POND.y})`}><ellipse rx="3.6" ry="1.2" fill="#f08a3a" /><path d="M3.6 0 L6.2 -1.4 L6.2 1.4 Z" fill="#f08a3a" /><circle cx="-1.6" cy="-.3" r=".6" fill="#fff" /></g>}
      {[[-30, 4, '#f2f2f2'], [24, -4, '#f08a3a'], [44, 6, '#e2b33c']].map(([dx, dy, c], i) => <g key={i} transform={`translate(${XIAN_POND.x + Number(dx)} ${XIAN_POND.y + Number(dy)}) scale(${i % 2 ? -1 : 1} 1)`}><ellipse rx="3" ry="1" fill={String(c)} /><path d="M3 0 L5 -1.2 L5 1.2 Z" fill={String(c)} />{i === 0 && <circle cx="-.6" r=".8" fill="#e04a3a" />}</g>)}
    </g>}
    {on('pondLotus') && <Lotus tint={tint} className={arrive('pondLotus')} />}
    {on('zigzagBridge') && <Bridge tint={tint} className={arrive('zigzagBridge')} />}
    {on('tingPavilion') && <Ting tint={tint} className={arrive('tingPavilion')} />}
    {on('taihuRocks') && <g className={arrive('taihuRocks')}><Rock x={218} y={252} k={1} tint={tint} /><Rock x={384} y={262} k={0.8} tint={tint} /></g>}
    {on('cranes') && <Cranes tint={tint} className={arrive('cranes')} />}
    {on('peonies') && <g className={arrive('peonies')}>{[[30, 262], [150, 262], [250, 284], [384, 284]].map(([x, y], i) => <Peony key={i} x={x} y={y} tint={tint} white={i % 2 === 1} />)}</g>}
  </>;
}

export function XianOver({ tint, on, arrive }: Ctx) {
  return on('wisteria') ? <Wisteria tint={tint} className={arrive('wisteria')} /> : null;
}

function Pailou({ tint, className }: { tint: Tint; className: string }) {
  // A memorial archway of three bays, the middle one taller.
  return <g className={className}>
    {[[152, 166, 200], [168, 168, 210], [184, 166, 200], [200, 166, 210]].map(([x, top], i) => <g key={i}>
      <rect x={x - 1.6} y={top} width="3.2" height={212 - top} fill={tint('#bdb5a6')} />
      <rect x={x - 3} y="208" width="6" height="4" fill={tint('#a9a08c')} />
    </g>)}
    {[[160, 172, 16], [176, 168, 20], [192, 172, 16]].map(([x, y, w], i) => <g key={i}>
      <rect x={x - w / 2} y={y} width={w} height="6" fill={tint(i === 1 ? '#2f5a8a' : '#3d6a8a')} />
      <rect x={x - w / 2 + 2} y={y + 1.4} width={w - 4} height="3" fill={tint(i === 1 ? '#e2b33c' : '#2f8a6e')} />
      <Roof x={x} y={y} w={w + 8} h={i === 1 ? 9 : 7} tint={tint} fill={TILE} />
    </g>)}
  </g>;
}

function Stele({ tint, className }: { tint: Tint; className: string }) {
  // A stone stele on the back of a tortoise (bixi), carved in Arabic and Chinese.
  return <g transform="translate(150 232) scale(.85)"><g className={className}>
    <ellipse cy="2" rx="14" ry="3" fill="#000" opacity=".15" />
    <path d="M-12 0 C-12 -6 -4 -9 4 -8 C10 -7 13 -4 13 0 Z" fill={tint('#8a8476')} />
    <path d="M13 -3 C16 -4 18 -2 17 0 L13 0 Z" fill={tint('#8a8476')} />
    <path d="M-8 -6 L-6 -8 L-2 -8 M2 -8 L6 -7" stroke={tint('#6e6a5e')} strokeWidth=".6" fill="none" />
    <rect x="-5" y="-38" width="10" height="31" fill={tint('#7a766a')} />
    <path d="M-6 -38 C-6 -44 6 -44 6 -38 Z" fill={tint('#6e6a5e')} />
    {Array.from({ length: 6 }, (_, k) => <path key={k} d={`M-3 ${-34 + k * 4} h${2 + (k % 3)} m1 0 h${1 + (k % 2)}`} stroke={tint('#c9c2b4')} strokeWidth=".5" />)}
  </g></g>;
}

function Rock({ x, y, k, tint }: { x: number; y: number; k: number; tint: Tint }) {
  // A Taihu scholar's rock, worn into holes by water.
  return <g transform={`translate(${x} ${y}) scale(${k})`}>
    <ellipse cy="1" rx="10" ry="2.4" fill="#000" opacity=".15" />
    <path d="M-8 0 C-10 -8 -6 -12 -7 -20 C-8 -28 -2 -32 2 -28 C6 -32 10 -26 7 -20 C10 -14 9 -6 8 0 Z" fill={tint('#a9a49a')} />
    <path d="M-7 -20 C-4 -18 0 -22 2 -28" stroke={tint('#8a857a')} strokeWidth=".7" fill="none" />
    {[[-2, -22, 2.2, 1.6], [3, -14, 1.6, 2.2], [-4, -9, 1.4, 1.2], [4, -24, 1.2, 1]].map(([hx, hy, rx, ry], i) => <ellipse key={i} cx={hx} cy={hy} rx={rx} ry={ry} fill={tint('#6e6a62')} />)}
  </g>;
}

function Bridge({ tint, className }: { tint: Tint; className: string }) {
  // Across the pond in zigzags, so that ill spirits, who go only straight, cannot follow.
  const { x, y, rx } = XIAN_POND;
  const points = [[x - rx - 6, y + 8], [x - 26, y - 2], [x + 4, y + 8], [x + 30, y - 4], [x + rx + 6, y + 6]];
  return <g className={className}>
    {points.slice(1).map(([px, py], i) => { const [qx, qy] = points[i]; return <g key={i}>
      <path d={`M${qx} ${qy} L${px} ${py} L${px} ${py + 3} L${qx} ${qy + 3} Z`} fill={tint('#d9d2c4')} />
      <path d={`M${qx} ${qy - 4} L${px} ${py - 4}`} stroke={tint(RED)} strokeWidth="1" />
      {[0, 0.5, 1].map((t) => <rect key={t} x={lerp(qx, px, t) - 0.5} y={lerp(qy, py, t) - 4} width="1" height="4" fill={tint(RED)} />)}
    </g>; })}
  </g>;
}

function Lotus({ tint, className }: { tint: Tint; className: string }) {
  const { x, y } = XIAN_POND;
  return <g className={className}>{[[-50, 2], [-38, -6], [52, -2], [40, 8], [-10, 10], [62, 6]].map(([dx, dy], i) => <g key={i} transform={`translate(${x + dx} ${y + dy})`}>
    <ellipse rx="5" ry="1.8" fill={tint('#4f8a46')} /><path d="M0 0 L5 -.2" stroke={tint('#3c6e36')} strokeWidth=".4" />
    {i % 2 === 0 && <g transform="translate(-1 -1.6)"><path d="M0 0 C-1.6 -2 -1 -4.4 0 -5.4 C1 -4.4 1.6 -2 0 0 Z" fill={tint('#f2a6c2')} /><path d="M0 0 C-3.2 -1 -3.2 -3.2 -2.8 -3.8 C-1.6 -2.8 -.8 -1.4 0 0 Z M0 0 C3.2 -1 3.2 -3.2 2.8 -3.8 C1.6 -2.8 .8 -1.4 0 0 Z" fill={tint('#f7c1d5')} /></g>}
  </g>)}</g>;
}

function Ting({ tint, className }: { tint: Tint; className: string }) {
  // A hexagonal pavilion by the water.
  return <g transform="translate(352 226)"><g className={className}>
    <ellipse cy="1" rx="18" ry="3" fill="#000" opacity=".15" />
    <rect x="-16" y="-3" width="32" height="3" fill={tint('#bdb5a6')} />
    {[-13, -4.4, 4.4, 13].map((cx) => <rect key={cx} x={cx - 1} y="-24" width="2" height="21" fill={tint(RED)} />)}
    <path d="M-14 -10 H14" stroke={tint(RED)} strokeWidth="1" />
    <path d="M-22 -22 Q-16 -21 -12 -24 L0 -38 L12 -24 Q16 -21 22 -22 Q14 -26 10 -28 L0 -38 L-10 -28 Q-14 -26 -22 -22 Z" fill={tint(TILE)} />
    <path d="M0 -38 L-6 -24 M0 -38 L6 -24" stroke={tint(TILE_DARK)} strokeWidth=".6" />
    <circle cy="-40" r="1.6" fill={tint('#d4a017')} />
  </g></g>;
}

function Cranes({ tint, className }: { tint: Tint; className: string }) {
  const crane = (x: number, y: number, flip: boolean, head = 0) => <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
    <path d="M-1 0 L-2 -10 M1 0 L0 -10" stroke={tint('#3a3a3a')} strokeWidth=".6" />
    <path d="M-6 -12 C-6 -16 2 -17 5 -13 L3 -9 C-1 -8 -5 -9 -6 -12 Z" fill={tint('#f6f4ef')} />
    <path d="M-6 -12 C-8 -11 -9 -9 -9 -7 C-7 -8 -5 -9 -4 -10 Z" fill={tint('#2a2a2a')} />
    <path d={`M4 -13 C5 -18 ${4 + head} -22 ${5 + head} -25`} stroke={tint('#2a2a2a')} strokeWidth="1.2" fill="none" />
    <circle cx={5 + head} cy="-25.4" r="1.3" fill={tint('#f6f4ef')} /><circle cx={5 + head} cy="-26.4" r=".7" fill="#d8232f" />
    <path d={`M${6 + head} -25.4 L${10 + head} -24.6`} stroke={tint('#b9a77a')} strokeWidth=".7" />
  </g>;
  return <g className={className}>{crane(232, 262, false)}{crane(250, 268, true, 1.5)}</g>;
}

function Peony({ x, y, tint, white }: { x: number; y: number; tint: Tint; white: boolean }) {
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cy="1" rx="12" ry="2.4" fill="#000" opacity=".14" />
    <g className="lg-sway slow">
      <path d="M-11 0 C-12 -8 -5 -14 1 -14 C8 -13 12 -7 11 0 Z" fill={tint('#4f7f3c')} />
      {[[-5, -9], [4, -11], [6, -4], [-4, -3]].map(([bx, by], i) => <g key={i} transform={`translate(${bx} ${by})`}>
        <circle r="3.6" fill={tint(white ? '#f8eef0' : '#e47aa0')} /><circle r="2.4" fill={tint(white ? '#f1d7de' : '#d0567e')} /><circle r="1" fill={tint('#f2cf4a')} />
      </g>)}
    </g>
  </g>;
}

function Bamboo({ tint, className }: { tint: Tint; className: string }) {
  const stalks = useMemo(() => {
    const random = seeded(57);
    return Array.from({ length: 8 }, (_, i) => ({ x: 352 + i * 6 + random() * 3, h: lerp(70, 110, random()), lean: (random() - 0.6) * 10 }));
  }, []);
  return <g transform="translate(0 206)"><g className={className}>{stalks.map((s, i) => <g key={i} className="lg-flower slow" style={{ animationDelay: `${-i * 0.7}s` }}>
    <path d={`M${s.x} 0 Q${s.x + s.lean * 0.4} ${-s.h / 2} ${s.x + s.lean} ${-s.h}`} stroke={tint(i % 2 ? '#5f8a3a' : '#6f9a44')} strokeWidth="2.2" fill="none" />
    {[0.25, 0.45, 0.65, 0.85].map((t) => <g key={t} transform={`translate(${s.x + s.lean * t} ${-s.h * t})`}>
      <rect x="-1.4" y="-.4" width="2.8" height=".8" fill={tint('#4a7030')} />
      {[0, 1, 2].map((k) => <path key={k} d="M0 0 C4 -1.6 8 -1.4 11 0 C8 .8 4 .8 0 0 Z" transform={`rotate(${(i % 2 ? -30 : 210) + k * 18})`} fill={tint(k % 2 ? '#4f7f34' : '#5f8f3c')} />)}
    </g>)}
  </g>)}</g></g>;
}

function RedLanterns({ tint, glow, lit, className }: { tint: Tint; glow: string; lit: number; className: string }) {
  return <g className={className}>{[40, 88, 136, 226, 270, 316, 362].map((x, i) => <g key={x} transform={`translate(${x} ${i > 3 ? 167 : 186})`}><g className="lg-lantern" style={{ animationDelay: `${i * 0.4}s` }}>
    <line y2="5" stroke={tint('#3d3226')} strokeWidth=".5" />
    {lit > 0 && <circle className="lg-flicker" cy="10" r="11" fill={glow} opacity={lit} />}
    <rect x="-2.4" y="4.4" width="4.8" height="1.4" fill={tint('#d4a017')} />
    <ellipse cy="10" rx="5" ry="4.4" fill={lit > 0 ? '#ff6a4a' : tint('#d42a2a')} />
    <path d="M-2.6 6.6 C-3.4 9 -3.4 11 -2.6 13.4 M0 5.6 V14.4 M2.6 6.6 C3.4 9 3.4 11 2.6 13.4" stroke={tint('#a81e1e')} strokeWidth=".4" fill="none" />
    <rect x="-2.4" y="14" width="4.8" height="1.2" fill={tint('#d4a017')} />
    <path d="M-1 15.2 V19 M0 15.2 V19.6 M1 15.2 V19" stroke={tint('#e2b33c')} strokeWidth=".5" />
  </g></g>)}</g>;
}

function Wisteria({ tint, className }: { tint: Tint; className: string }) {
  // Hanging over the top of the moon gate.
  const racemes = useMemo(() => {
    const random = seeded(63);
    return Array.from({ length: 34 }, () => {
      const a = lerp(-2.6, -0.54, random());
      return { x: 200 + Math.cos(a) * 186, y: 180 + Math.sin(a) * 186, len: lerp(10, 22, random()), tone: random() };
    });
  }, []);
  return <g className={className}>
    <path d={`M${200 + Math.cos(-2.7) * 188} ${180 + Math.sin(-2.7) * 188} A188 188 0 0 1 ${200 + Math.cos(-0.44) * 188} ${180 + Math.sin(-0.44) * 188}`} stroke={tint('#6e5236')} strokeWidth="2" fill="none" />
    {racemes.map((r, i) => <g key={i} transform={`translate(${r.x.toFixed(1)} ${r.y.toFixed(1)})`} className="lg-flower slow" style={{ animationDelay: `${-i * 0.3}s` }}>
      <path d="M0 0 C3 -1 6 1 8 3" fill={tint('#5f8f3c')} />
      {Array.from({ length: 7 }, (_, k) => <circle key={k} cx={(k % 2 ? 0.8 : -0.8) * (1 - k / 8)} cy={2 + k * (r.len / 7)} r={1.8 * (1 - k / 9)} fill={tint(r.tone < 0.5 ? (k % 2 ? '#9a7fd1' : '#b49ae0') : (k % 2 ? '#8a6ec4' : '#c4b0ea'))} />)}
    </g>)}
  </g>;
}

export function XianFlowerHeads({ tint, prefix }: { tint: Tint; prefix: string }) {
  const petals = (count: number, rx: number, ry: number, fill: string, offset = 0) => Array.from({ length: count }, (_, i) =>
    <ellipse key={i} rx={rx} ry={ry} cy={-ry * 0.9} transform={`rotate(${(360 / count) * i + offset})`} fill={fill} />);
  return <>
    {/* Peony, pink and white */}
    <g id={`${prefix}0`}>{petals(8, 1.8, 2.4, tint('#e47aa0'))}{petals(6, 1.2, 1.5, tint('#d0567e'), 20)}<circle r=".8" fill={tint('#f2cf4a')} /></g>
    <g id={`${prefix}1`}>{petals(8, 1.8, 2.4, tint('#f8eef0'))}{petals(6, 1.2, 1.5, tint('#f1d7de'), 20)}<circle r=".8" fill={tint('#f2cf4a')} /></g>
    {/* Chrysanthemum */}
    <g id={`${prefix}2`}>{petals(14, .5, 2.2, tint('#f2c12e'))}{petals(10, .4, 1.3, tint('#e8a21a'), 10)}</g>
    {/* Camellia */}
    <g id={`${prefix}3`}>{petals(6, 1.8, 2.1, tint('#c8283a'))}<circle r="1" fill={tint('#f2cf4a')} /></g>
    {/* Chinese sacred lily */}
    <g id={`${prefix}4`}>{petals(6, 1.1, 2, tint('#fbf8ee'))}<circle r="1.1" fill={tint('#f2b51e')} /></g>
    {/* Orchid */}
    <g id={`${prefix}5`}>{petals(5, 1, 2, tint('#b98ad6'))}<ellipse cy=".8" rx="1.1" ry="1.3" fill={tint('#7d3f9e')} /></g>
  </>;
}

/** The moon gate in a whitewashed wall, ringed in grey brick under a tiled coping. */
export function MoonGateFrame({ gold, golden, className }: { gold: string; golden: boolean; className: string }) {
  const ring = golden ? gold : '#8a8a84';
  return <g className={`lg-frame${golden ? ' golden' : ''}${className}`} pointerEvents="none">
    <path d={`M0 0 H400 V300 H0 Z ${MOON_GATE}`} fill={golden ? '#f6ecd0' : '#ece6da'} fillRule="evenodd" />
    <path d="M0 0 H400 V7 H0 Z" fill={golden ? '#b8861a' : '#4f524f'} />
    {Array.from({ length: 67 }, (_, i) => <path key={i} d={`M${i * 6} 7 q3 2 6 0`} stroke={golden ? '#8a6414' : '#3a3c3a'} strokeWidth=".6" fill="none" />)}
    <path d={MOON_GATE} fill="none" stroke={ring} strokeWidth="9" />
    <path d={MOON_GATE} fill="none" stroke={golden ? '#fff3c4' : '#b9b9b2'} strokeWidth="9" strokeDasharray="1 6" />
    <path d={MOON_GATE} fill="none" stroke={golden ? '#8a6414' : '#5f605c'} strokeWidth="1" />
    {/* Lattice windows in the wall either side. */}
    {[[24, 40], [376, 40]].map(([x, y]) => <g key={x} transform={`translate(${x} ${y})`}>
      <circle r="12" fill={golden ? '#e9d48a' : '#d9d2c4'} stroke={ring} strokeWidth="1.6" />
      <path d="M-8 -8 L8 8 M8 -8 L-8 8 M-11 0 H11 M0 -11 V11" stroke={golden ? '#8a6414' : '#7a756a'} strokeWidth=".9" />
    </g>)}
  </g>;
}
