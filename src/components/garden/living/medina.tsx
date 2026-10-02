import { medinaChannel } from './layouts';
import { mix, type Tint } from './palette';
import { lerp } from './random';
import type { Ctx } from './scene';

/**
 * The Medina date grove: a garden of palms watered by a stone channel, with beds of mint
 * and roses along the water. A mud-brick wall with stepped crenellations, Uhud's red
 * mountains beyond it and, far off, a green dome and its minarets. The frame is the arish,
 * a shade of palm trunks and fronds.
 */

export function MedinaFar({ palette, lit }: Ctx) {
  const rock = mix(palette.hillFar, '#b0705a', palette.night ? 0.15 : 0.5);
  const far = mix(palette.hillFar, '#c49a84', palette.night ? 0.1 : 0.35);
  return <>
    <path d="M0 170 L40 150 L70 156 L110 128 L140 140 L176 118 L210 140 L240 132 L280 160 L300 200 L0 200 Z" fill={far} />
    {/* Uhud, its red rock in ridges. */}
    <path d="M0 184 L26 164 L50 170 L82 142 L106 152 L134 130 L160 148 L188 138 L216 162 L242 158 L266 182 L270 202 L0 202 Z" fill={rock} />
    <path d="M82 142 L92 160 L106 152 M134 130 L142 156 L160 148 M188 138 L196 160 L216 162" stroke={mix(rock, '#5a2e22', 0.35)} strokeWidth="1" fill="none" />
    {/* The green dome and the minarets of the city, far off. */}
    <g transform="translate(0 0)">
      <rect x="296" y="186" width="94" height="12" fill={palette.skyline} opacity=".8" />
      {[306, 380].map((x) => <g key={x} fill={palette.skyline} opacity=".85">
        <rect x={x - 1.6} y="150" width="3.2" height="38" /><rect x={x - 2.6} y="162" width="5.2" height="1.6" /><rect x={x - 2.4} y="174" width="4.8" height="1.4" />
        <path d={`M${x - 1.6} 150 L${x} 143 L${x + 1.6} 150 Z`} />
        {lit > 0 && <circle cx={x} cy="162" r="1.2" fill="#ffe6a0" opacity={lit} />}
      </g>)}
      <path d="M332 188 V182 C332 172 338 166 344 166 C350 166 356 172 356 182 V188 Z" fill={mix(palette.skyline, '#4f9a62', palette.night ? 0.35 : 0.75)} />
      <rect x="343.4" y="160" width="1.2" height="6" fill={palette.skyline} />
    </g>
  </>;
}

/** A date palm in the grove, drawn simply. */
function GrovePalm({ x, y, h, tint, tone = '#4f7a3f', trunk = '#8a6d4a' }: { x: number; y: number; h: number; tint: Tint; tone?: string; trunk?: string }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d={`M-1.6 0 C-1.4 ${-h * 0.5} ${h * 0.04} ${-h * 0.9} ${h * 0.06} ${-h} L${h * 0.06 + 2.4} ${-h} C${h * 0.04 + 1.8} ${-h * 0.9} 1.4 ${-h * 0.5} 1.6 0 Z`} fill={tint(trunk)} />
    <g transform={`translate(${h * 0.06 + 1.2} ${-h})`}><g className="lg-sway slow">
      {[-165, -135, -105, -75, -45, -15, 12, -190].map((a, i) => <path key={a} transform={`rotate(${a}) scale(${(h / 60).toFixed(2)})`} d="M0 0 C8 -3 18 -2 26 4 C18 1 8 2 0 0 Z" fill={tint(i % 2 ? tone : mix(tone, '#7aa65a', 0.25))} />)}
    </g></g>
  </g>;
}

export function MedinaWall({ tint, on, arrive, url, lit }: Ctx) {
  return <>
    {[[40, 64], [96, 56], [356, 60]].map(([x, h]) => <GrovePalm key={x} x={x} y={204} h={h} tint={tint} tone="#456f38" />)}
    {on('grove') && <g className={arrive('grove')}>{[[18, 52], [68, 70], [128, 50], [198, 62], [262, 54], [318, 68], [392, 56]].map(([x, h]) => <GrovePalm key={x} x={x} y={204} h={h} tint={tint} tone="#3f6834" />)}</g>}
    {/* A wall of mud brick, its top stepped in the Najdi way. */}
    <path d="M0 200 Q0 197 4 197 H396 Q400 197 400 200 V216 H0 Z" fill={tint('#c8955f')} />
    <rect y="210" width="400" height="6" fill={tint('#b58550')} />
    {Array.from({ length: 25 }, (_, i) => <path key={i} d={`M${4 + i * 16} 197 L${8 + i * 16} 191 L${12 + i * 16} 197 Z`} fill={tint('#c8955f')} />)}
    {Array.from({ length: 13 }, (_, i) => <path key={`t${i}`} d={`M${20 + i * 30} 204 l3 -4 l3 4 Z`} fill={tint('#f2e6cf')} />)}
    {/* Where the water comes in under the wall. */}
    <path d="M230 216 V209 Q236 204 242 209 V216 Z" fill={tint('#6e4f33')} />
    {on('wallLamps') && <g className={arrive('wallLamps')}>{[30, 100, 170, 300, 370].map((x, i) => <g key={x} transform={`translate(${x} 191)`}>
      {lit > 0 && <circle className="lg-flicker" style={{ animationDelay: `${i * 0.4}s` }} cy="-4" r="9" fill={url('lamp')} opacity={lit} />}
      <path d="M-2.4 0 H2.4 L2 -6 L0 -8.6 L-2 -6 Z" fill={lit > 0 ? '#ffd27a' : tint('#c9982e')} stroke={tint('#8a6418')} strokeWidth=".4" />
    </g>)}</g>}
  </>;
}

const strip = (side: -1 | 1, inner: number, outer: number) => {
  const pts: string[] = []; const back: string[] = [];
  for (let y = 214; y <= 300; y += 6) {
    const c = medinaChannel(y);
    pts.push(`${(c.x + side * (c.half + inner)).toFixed(1)} ${y}`);
    back.unshift(`${(c.x + side * (c.half + inner + (outer < 0 ? c.bed : outer))).toFixed(1)} ${y}`);
  }
  return `M${pts.join(' L')} L${back.join(' L')} Z`;
};

export function MedinaGround({ tint, url, idOf, on, arrive, motion }: Ctx) {
  const inner = (() => {
    const left: string[] = []; const right: string[] = [];
    for (let y = 216; y <= 300; y += 6) { const c = medinaChannel(y); left.push(`${(c.x - c.half).toFixed(1)} ${y}`); right.unshift(`${(c.x + c.half).toFixed(1)} ${y}`); }
    return `M${left.join(' L')} L${right.join(' L')} Z`;
  })();
  return <>
    <defs><linearGradient id={idOf('sand')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={tint('#e7cb98')} /><stop offset="1" stopColor={tint('#d4ae74')} /></linearGradient></defs>
    <rect y="216" width="400" height="84" fill={url('sand')} />
    <g stroke={tint('#c9a167')} strokeWidth=".7" fill="none" opacity=".7">
      {[[20, 236, 60], [70, 262, 50], [290, 228, 40], [330, 272, 60], [10, 290, 40], [120, 248, 30]].map(([x, y, w], i) => <path key={i} d={`M${x} ${y} q${w / 4} -3 ${w / 2} 0 t${w / 2} 0`} />)}
    </g>
    {/* Beds either side of the channel. */}
    {([-1, 1] as const).map((side) => <path key={side} d={strip(side, 3.5, -1)} fill={tint('#8a6a45')} />)}
    {([-1, 1] as const).map((side) => <path key={`g${side}`} d={strip(side, 3.5, -1)} fill={tint('#6f8a44')} opacity=".35" />)}
    {/* The channel, lined with stone; dry until the water is brought to it. */}
    {([-1, 1] as const).map((side) => <path key={`e${side}`} d={strip(side, 0, 3.5)} fill={tint('#e8dcc4')} />)}
    <path d={inner} fill={on('channels') ? url('water') : tint('#b99566')} className={arrive('channels')} />
    {on('channels') && motion && [240, 258, 276, 292].map((y, i) => { const c = medinaChannel(y); return <rect key={y} className="lg-shimmer" style={{ animationDelay: `${i * 0.7}s` }} x={c.x - c.half * 0.6} y={y} width={c.half * 1.2} height=".7" fill="#fff" opacity=".6" />; })}
    {on('mint') && <g className={arrive('mint')}>{[236, 250, 264, 278, 292].flatMap((y) => { const c = medinaChannel(y); return [-1, 1].map((side) => <Mint key={`${y}${side}`} x={c.x + side * (c.half + 7)} y={y} k={lerp(0.7, 1.2, (y - 236) / 56)} tint={tint} />); })}</g>}
    {on('arish') && <Arish tint={tint} className={arrive('arish')} />}
    {on('dallah') && <Dallah tint={tint} className={arrive('dallah')} />}
    {on('well') && <Well tint={tint} water={url('water')} className={arrive('well')} />}
    {on('youngPalms') && <g className={arrive('youngPalms')}><GrovePalm x={300} y={252} h={36} tint={tint} /><GrovePalm x={384} y={268} h={44} tint={tint} /></g>}
    {on('camel') && <Camel tint={tint} className={arrive('camel')} />}
    {on('medinaDoves') && <Pigeons tint={tint} className={arrive('medinaDoves')} />}
    {on('dateBaskets') && <g className={arrive('dateBaskets')}><Basket x={86} y={282} tint={tint} /><Basket x={118} y={292} tint={tint} big /></g>}
    {on('taifRoses') && <g className={arrive('taifRoses')}>{[[184, 294], [330, 296]].map(([x, y]) => <TaifRose key={x} x={x} y={y} tint={tint} />)}</g>}
  </>;
}

export function MedinaFront({ tint, on, arrive, limb, url, lit }: Ctx) {
  if (!on('fanous')) return null;
  const at = limb('right', 0.6);
  return <g transform={`translate(${at.x.toFixed(1)} ${at.y.toFixed(1)})`}><g className={arrive('fanous')}><g className="lg-lantern">
    <line y2="10" stroke={tint('#3d3226')} strokeWidth=".5" />
    {lit > 0 && <circle className="lg-flicker" cy="17" r="24" fill={url('lamp')} opacity={lit} />}
    <path d="M-3 10 H3 L4.4 12 H-4.4 Z" fill={tint('#2f6f5a')} />
    <path d="M-4.4 12 L-3.4 22 H3.4 L4.4 12 Z" fill={lit > 0 ? '#ffd782' : tint('#e9d6a8')} stroke={tint('#2f6f5a')} strokeWidth=".8" />
    <path d="M0 12 V22 M-2 12 L-1.6 22 M2 12 L1.6 22" stroke={tint('#2f6f5a')} strokeWidth=".4" />
    <path d="M-3.4 22 H3.4 L0 26 Z" fill={tint('#2f6f5a')} />
  </g></g></g>;
}

function Mint({ x, y, k, tint }: { x: number; y: number; k: number; tint: Tint }) {
  return <g transform={`translate(${x.toFixed(1)} ${y}) scale(${k.toFixed(2)})`}>
    {[[-3, -2], [0, -4], [3, -2], [-1.5, -1], [1.5, -1]].map(([dx, dy], i) => <ellipse key={i} cx={dx} cy={dy} rx="2.2" ry="1.7" fill={tint(i % 2 ? '#5f9a48' : '#72ab55')} />)}
  </g>;
}

function Well({ tint, water, className }: { tint: Tint; water: string; className: string }) {
  return <g transform="translate(106 246)"><g className={className}>
    <ellipse cy="2" rx="18" ry="3.5" fill="#000" opacity=".14" />
    <path d="M-15 -10 V0 C-15 3 15 3 15 0 V-10 Z" fill={tint('#bfa27a')} />
    {[-11, -4, 4, 11].map((sx) => <path key={sx} d={`M${sx} -10 V1`} stroke={tint('#9e8360')} strokeWidth=".6" />)}
    <path d="M-15 -5 C-10 -3 10 -3 15 -5" stroke={tint('#9e8360')} strokeWidth=".6" fill="none" />
    <ellipse cy="-10" rx="15" ry="3.4" fill={tint('#d4b98f')} /><ellipse cy="-10" rx="11.5" ry="2.3" fill={water} />
    <path d="M-12 -10 L-4 -32 M12 -10 L4 -32 M-6 -30 H6" stroke={tint('#6e4f33')} strokeWidth="1.6" />
    <circle cy="-30" r="2" fill={tint('#8a6d4a')} />
    <path d="M1.6 -30 V-18" stroke={tint('#a58a62')} strokeWidth=".5" />
    <path d="M-1.4 -18 H4.4 L3.6 -13 H-.6 Z" fill={tint('#7a5a3a')} />
  </g></g>;
}

function Arish({ tint, className }: { tint: Tint; className: string }) {
  return <g className={className}>
    <ellipse cx="44" cy="238" rx="40" ry="5" fill="#000" opacity=".12" />
    <path d="M14 232 H76 L80 240 H10 Z" fill={tint('#b5432f')} />
    {[18, 30, 42, 54, 66].map((x) => <path key={x} d={`M${x} 232 l-1 8`} stroke={tint('#e2b33c')} strokeWidth=".6" />)}
    {[14, 74].map((x) => <rect key={x} x={x - 1.2} y="204" width="2.4" height="34" fill={tint('#7a5a3a')} />)}
    {[8, 80].map((x) => <rect key={x} x={x - 1.2} y="206" width="2.4" height="26" fill={tint('#6e4f33')} />)}
    <path d="M2 206 H86 L82 200 H6 Z" fill={tint('#9b8a52')} />
    {Array.from({ length: 22 }, (_, i) => <path key={i} d={`M${4 + i * 4} 206 l${(i % 2 ? 1 : -1) * 1.4} 4`} stroke={tint('#7f7040')} strokeWidth="1" />)}
  </g>;
}

function Dallah({ tint, className }: { tint: Tint; className: string }) {
  return <g transform="translate(40 232)"><g className={className}>
    <path d="M-3 0 C-5 -3 -4 -7 -2 -8 L-2 -10 C-2 -12 2 -12 2 -10 L2 -8 C4 -7 5 -3 3 0 Z" fill={tint('#d4a33a')} stroke={tint('#8a6418')} strokeWidth=".4" />
    <path d="M-3 -6 C-7 -8 -9 -11 -10 -12" stroke={tint('#d4a33a')} strokeWidth="1.2" fill="none" />
    <path d="M3 -7 C6 -7 6 -3 3 -2" stroke={tint('#8a6418')} strokeWidth=".6" fill="none" />
    <path d="M0 -12 L0 -14" stroke={tint('#8a6418')} strokeWidth="1" />
    {[10, 15].map((x) => <path key={x} d={`M${x - 2} -3 H${x + 2} L${x + 1.4} 0 H${x - 1.4} Z`} fill={tint('#f2ecdc')} />)}
    <ellipse cx="25" cy="-.6" rx="5" ry="1.4" fill={tint('#c9b08a')} />
    {[23, 25, 27, 24.4, 26].map((x, i) => <ellipse key={i} cx={x} cy={i < 3 ? -1.6 : -2.6} rx="1" ry=".7" fill={tint('#6e2a18')} />)}
  </g></g>;
}

function Camel({ tint, className }: { tint: Tint; className: string }) {
  // A camel couched on the sand, at rest.
  return <g transform="translate(348 240)"><g className={className}>
    <ellipse cy="1" rx="24" ry="3" fill="#000" opacity=".14" />
    <path d="M-16 0 C-18 -8 -12 -14 -4 -14 C0 -22 8 -22 12 -14 C16 -12 18 -6 16 0 Z" fill={tint('#c89a62')} />
    <path d="M-14 -6 C-20 -8 -22 -14 -21 -20 C-20 -24 -16 -26 -13 -24 L-12 -21 C-15 -20 -16 -15 -12 -11 Z" fill={tint('#c89a62')} />
    <path d="M-21 -21 C-24 -21 -26 -19 -25 -17 L-21 -17" fill={tint('#b88a52')} />
    <circle cx="-19" cy="-22" r=".5" fill="#222" />
    <path d="M-12 0 l-3 -3 M10 0 l4 -3" stroke={tint('#a77a48')} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M-6 -14 C-2 -12 6 -12 10 -14 L10 -11 C6 -9 -2 -9 -6 -11 Z" fill={tint('#b5432f')} />
  </g></g>;
}

function Pigeons({ tint, className }: { tint: Tint; className: string }) {
  const bird = (x: number, y: number, flip: boolean, peck = false) => <g key={`${x}${y}`} transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
    <path d={peck ? 'M-5 -3 C-3 -6 2 -5 4 -1 L6 1 L3 1 C0 1 -4 0 -5 -3 Z' : 'M-5 0 C-4 -3.4 1 -4 3.6 -2.2 L5.4 -2.6 L4.4 -1 C3 1.6 -2 2 -5 0 Z'} fill={tint('#9aa0aa')} />
    <circle cx={peck ? 4 : 3} cy={peck ? 0 : -2.2} r="1.2" fill={tint('#6f7f8f')} />
    <path d="M-1 -1.4 C0 -2.6 2 -2.6 2.6 -1.6" stroke={tint('#6a8a7a')} strokeWidth=".8" fill="none" />
  </g>;
  return <g className={className}>{bird(206, 250, false, true)}{bird(218, 258, true)}{bird(284, 248, true, true)}{bird(160, 196, false)}{bird(330, 196, true)}</g>;
}

function Basket({ x, y, big = false, tint }: { x: number; y: number; big?: boolean; tint: Tint }) {
  const k = big ? 1.2 : 1;
  return <g transform={`translate(${x} ${y}) scale(${k})`}>
    <ellipse cy="1" rx="10" ry="2.2" fill="#000" opacity=".14" />
    <path d="M-9 -8 L9 -8 L7 0 H-7 Z" fill={tint('#c9a35a')} />
    {[-6, -2, 2, 6].map((bx) => <path key={bx} d={`M${bx} -8 V0`} stroke={tint('#a07f3a')} strokeWidth=".6" />)}
    <path d="M-8 -5 H8" stroke={tint('#a07f3a')} strokeWidth=".6" />
    {[[-6, -9], [-3, -10], [0, -9.4], [3, -10.2], [6, -9], [-4.4, -11.4], [1.4, -11.6], [4.6, -11.2], [-1.4, -12.6]].map(([dx, dy], i) => <ellipse key={i} cx={dx} cy={dy} rx="1.3" ry="1" fill={tint(i % 2 ? '#6e2a18' : '#8a3a1f')} />)}
  </g>;
}

function TaifRose({ x, y, tint }: { x: number; y: number; tint: Tint }) {
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cy="1" rx="12" ry="2.4" fill="#000" opacity=".14" />
    <g className="lg-sway slow">
      <path d="M-11 0 C-12 -9 -5 -17 2 -17 C9 -16 12 -9 11 0 Z" fill={tint('#4a7340')} />
      {[[-5, -11], [2, -14], [6, -8], [-2, -6], [-8, -5], [4, -3]].map(([bx, by], i) => <g key={i} transform={`translate(${bx} ${by})`}><circle r="2.5" fill={tint(i % 2 ? '#f0a4bd' : '#f7c4d4')} /><circle r=".9" fill={tint('#d0668a')} /></g>)}
    </g>
  </g>;
}

export function MedinaFlowerHeads({ tint, prefix }: { tint: Tint; prefix: string }) {
  const petals = (count: number, rx: number, ry: number, fill: string, offset = 0) => Array.from({ length: count }, (_, i) =>
    <ellipse key={i} rx={rx} ry={ry} cy={-ry * 0.9} transform={`rotate(${(360 / count) * i + offset})`} fill={fill} />);
  return <>
    {/* Taif rose */}
    <g id={`${prefix}0`}>{petals(6, 1.7, 2.1, tint('#f2a0bb'))}{petals(5, 1, 1.3, tint('#e07a9c'), 30)}</g>
    {/* Chamomile */}
    <g id={`${prefix}1`}>{petals(12, .6, 1.9, tint('#fbf8ee'))}<circle r="1.1" fill={tint('#f2c12e')} /></g>
    {/* Desert marigold */}
    <g id={`${prefix}2`}>{petals(10, .9, 2, tint('#f5c62a'))}<circle r=".9" fill={tint('#d0901a')} /></g>
    {/* Mint in flower */}
    <g id={`${prefix}3`}>{[0, 1, 2, 3].map((k) => <ellipse key={k} cy={-k * 1.4} rx={1.4 - k * 0.2} ry=".9" fill={tint(k % 2 ? '#b89ad6' : '#c9b0e2')} />)}</g>
    {/* Henna blossom */}
    <g id={`${prefix}4`}>{[[0, 0], [1.6, .6], [-1.6, .6], [0, -1.6], [1, 1.8], [-1, 1.8]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r=".9" fill={tint('#fff6e6')} />)}</g>
    {/* Sea lavender */}
    <g id={`${prefix}5`}>{petals(5, 1.1, 1.8, tint('#8a74c9'))}<circle r=".6" fill={tint('#f2f0f8')} /></g>
  </>;
}

/** The arish: posts of palm trunk and a fringe of fronds overhead. */
export function ArishFrame({ gold, golden, className }: { gold: string; golden: boolean; className: string }) {
  const wood = golden ? '#d9a92a' : '#8a6d4a';
  const ring = golden ? '#b8861a' : '#6e5436';
  const frond = golden ? '#e6c45a' : '#6f8a44';
  return <g className={`lg-frame${golden ? ' golden' : ''}${className}`} pointerEvents="none">
    {[0, 1].map((side) => <g key={side} transform={side ? 'translate(400 0) scale(-1 1)' : undefined}>
      <rect x="0" y="0" width="13" height="300" fill={wood} />
      {Array.from({ length: 50 }, (_, k) => <path key={k} d={`M0 ${k * 6 + 3} L6.5 ${k * 6} L13 ${k * 6 + 3}`} stroke={ring} strokeWidth="1" fill="none" />)}
      {golden && <path d="M13 0 V300" stroke={gold} strokeWidth="1.4" />}
    </g>)}
    <rect x="0" y="0" width="400" height="9" fill={wood} />
    {Array.from({ length: 58 }, (_, i) => <path key={i} d={`M${i * 7 + 2} 8 l${(i % 3) - 1} ${10 + (i % 4) * 3} l3 ${-10 - (i % 4) * 3} Z`} fill={i % 2 ? frond : mix(frond, '#4f6a32', 0.4)} />)}
    <path d="M0 9 H400" stroke={golden ? gold : ring} strokeWidth="1.2" />
  </g>;
}
