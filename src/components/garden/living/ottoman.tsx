import { useMemo } from 'react';
import { OGEE, ottomanWalk } from './layouts';
import { mix, type Tint } from './palette';
import { lerp, seeded } from './random';
import type { Ctx } from './scene';

/**
 * The Ottoman tulip garden on the Bosphorus: seen through an ogee arch faced with İznik
 * tiles, tulips set in rows in beds either side of a gravel walk, a great plane tree, a
 * marble balustrade over the water and a city of domes and pencil minarets on the far
 * shore. A kiosk with deep eaves arrives to sit in.
 */

export function OttomanFar({ palette, url, motion, on, arrive, tint }: Ctx) {
  const hill = mix(palette.hillFar, '#7f9a7a', palette.night ? 0.1 : 0.35);
  return <>
    <path d="M0 166 C60 148 120 154 170 162 C230 146 300 144 360 158 L400 160 L400 182 L0 182 Z" fill={hill} />
    {/* A mosque on the far shore: a great dome on half domes, four pencil minarets. */}
    <g fill={palette.skyline} opacity=".9">
      <rect x="208" y="156" width="64" height="20" />
      <path d="M216 158 C216 146 226 140 240 140 C254 140 264 146 264 158 Z" />
      <path d="M208 160 C208 154 214 150 220 150 C222 150 224 152 224 156 Z M272 160 C272 154 266 150 260 150 C258 150 256 152 256 156 Z" />
      <rect x="239.4" y="132" width="1.2" height="8" />
      {[198, 212, 268, 282].map((x, i) => <g key={x}>
        <rect x={x - 1.4} y={i === 0 || i === 3 ? 124 : 116} width="2.8" height={i === 0 || i === 3 ? 52 : 60} />
        <path d={`M${x - 1.6} ${i === 0 || i === 3 ? 124 : 116} L${x} ${i === 0 || i === 3 ? 114 : 104} L${x + 1.6} ${i === 0 || i === 3 ? 124 : 116} Z`} />
        <rect x={x - 2.4} y={i === 0 || i === 3 ? 140 : 134} width="4.8" height="1.4" />
      </g>)}
      <rect x="80" y="166" width="40" height="10" /><path d="M86 166 C86 160 92 157 96 157 C100 157 106 160 106 166 Z" />
      <rect x="320" y="162" width="30" height="14" /><rect x="350" y="166" width="20" height="10" />
    </g>
    {on('erguvan') && <Erguvan tint={tint} className={arrive('erguvan')} />}
    {/* The Bosphorus. */}
    <rect y="178" width="400" height="26" fill={url('water')} />
    <rect y="178" width="400" height="1.2" fill={mix(palette.skyBottom, '#ffffff', 0.4)} opacity=".6" />
    {motion && [30, 120, 210, 300, 350].map((x, i) => <rect key={x} className="lg-shimmer" style={{ animationDelay: `${i * 0.8}s` }} x={x} y={184 + (i % 3) * 5} width="26" height=".7" rx=".35" fill="#ffffff" opacity=".55" />)}
    {on('caiques') && <Caiques tint={tint} motion={motion} className={arrive('caiques')} />}
  </>;
}

export function OttomanWall(ctx: Ctx) {
  const { tint, on, arrive } = ctx;
  return <>
    {on('cypressRow') && <g className={arrive('cypressRow')}>{[[128, 74], [146, 86], [164, 70], [300, 64], [316, 78]].map(([x, h]) => <g key={x} transform={`translate(${x} 204)`}><g className="lg-sway slow">
      <path d={`M0 0 C-6 -${h * 0.3} -5.4 -${h * 0.7} 0 -${h} C5.4 -${h * 0.7} 6 -${h * 0.3} 0 0 Z`} fill={tint('#2a4f36')} />
    </g></g>)}</g>}
    {/* The marble balustrade over the water. */}
    <rect y="200" width="400" height="3.4" fill={tint('#efe9df')} />
    {Array.from({ length: 50 }, (_, i) => <path key={i} d={`M${4 + i * 8} 203 C${2.6 + i * 8} 206 ${2.2 + i * 8} 208 ${4 + i * 8} 210 C${2 + i * 8} 212 ${2.6 + i * 8} 214 ${4 + i * 8} 216 H${6.4 + i * 8} C${7.8 + i * 8} 214 ${8.4 + i * 8} 212 ${6.4 + i * 8} 210 C${8.2 + i * 8} 208 ${7.8 + i * 8} 206 ${6.4 + i * 8} 203 Z`} fill={tint('#e3dccf')} />)}
    <rect y="216" width="400" height="3.4" fill={tint('#d9d1c2')} />
    {on('kiosk') && <Kiosk ctx={ctx} />}
  </>;
}

export function OttomanGround(ctx: Ctx) {
  const { tint, url, on, arrive, motion, lit } = ctx;
  const walk = (() => {
    const left: string[] = []; const right: string[] = [];
    for (let y = 219; y <= 300; y += 9) { const w = ottomanWalk(y); left.push(`${(w.x - w.half).toFixed(1)} ${y}`); right.unshift(`${(w.x + w.half).toFixed(1)} ${y}`); }
    return `M${left.join(' L')} L${right.join(' L')} Z`;
  })();
  const bed = (side: -1 | 1) => {
    const a: string[] = []; const b: string[] = [];
    for (let y = 238; y <= 300; y += 6) {
      const w = ottomanWalk(y);
      const inner = side < 0 ? w.x - w.half - 3 : w.x + w.half + 3;
      const outer = side < 0 ? lerp(128, 104, (y - 238) / 62) : lerp(346, 372, (y - 238) / 62);
      a.push(`${inner.toFixed(1)} ${y}`); b.unshift(`${outer.toFixed(1)} ${y}`);
    }
    return `M${a.join(' L')} L${b.join(' L')} Z`;
  };
  return <>
    <rect y="219" width="400" height="81" fill={url('grass')} />
    <path d={walk} fill={tint('#e6dcc8')} />
    <path d={walk} fill="none" stroke={tint('#cbbfa8')} strokeWidth=".6" />
    {([-1, 1] as const).map((side) => <path key={side} d={bed(side)} fill={url('soil')} />)}
    {on('boxHedges') && <g className={arrive('boxHedges')}>{([-1, 1] as const).map((side) => <path key={side} d={bed(side)} fill="none" stroke={tint('#2f5a32')} strokeWidth="3.2" strokeLinejoin="round" />)}</g>}
    {on('cesme') && <Cesme tint={tint} water={url('water')} motion={motion} className={arrive('cesme')} />}
    {on('carnations') && <g className={arrive('carnations')}>{[206, 266].map((x) => <CarnationPot key={x} x={x} tint={tint} />)}</g>}
    {on('havuz') && <Havuz tint={tint} water={url('water')} motion={motion} className={arrive('havuz')} />}
    {on('hyacinths') && <g className={arrive('hyacinths')}>{[[132, 242], [200, 242], [272, 242], [340, 242], [112, 292], [362, 292]].map(([x, y]) => <Hyacinth key={x} x={x} y={y} tint={tint} />)}</g>}
    {on('tulipLamps') && <g className={arrive('tulipLamps')}>{[248, 268, 290].flatMap((y) => { const w = ottomanWalk(y); return [w.x - w.half - 1, w.x + w.half + 1].map((x, i) => <TulipLamp key={`${y}${i}`} x={x} y={y} k={lerp(0.8, 1.2, (y - 248) / 42)} tint={tint} glow={url('lamp')} lit={lit} />); })}</g>}
  </>;
}

export function OttomanOver({ tint, on, arrive }: Ctx) {
  return on('ottomanRoses') ? <g className={arrive('ottomanRoses')}>{[[20, 296], [384, 294]].map(([x, y]) => <g key={x} transform={`translate(${x} ${y})`}>
    <ellipse cy="1" rx="14" ry="2.6" fill="#000" opacity=".14" />
    <g className="lg-sway slow">
      <path d="M-13 0 C-14 -10 -6 -20 2 -20 C10 -19 14 -10 13 0 Z" fill={tint('#3e6b3a')} />
      {[[-6, -13], [2, -16], [7, -9], [-2, -7], [-9, -5], [5, -4]].map(([bx, by], i) => <g key={i} transform={`translate(${bx} ${by})`}><circle r="2.7" fill={tint(i % 2 ? '#c8283a' : '#e04a5a')} /><circle r="1.1" fill={tint('#8a1426')} /></g>)}
    </g>
  </g>)}</g> : null;
}

function Kiosk({ ctx }: { ctx: Ctx }) {
  const { tint, on, arrive, lit } = ctx;
  const glow = lit > 0;
  const columns = [290, 316, 342, 368, 392];
  return <g className={arrive('kiosk')}>
    <rect x="282" y="226" width="118" height="10" fill={tint('#e9e3d8')} />
    <path d="M326 236 H358 L362 244 H322 Z" fill={tint('#ddd5c6')} />
    <path d="M324 240 H360" stroke={tint('#c9bfae')} strokeWidth=".8" />
    {/* Tiled walls behind the columns, with windows. */}
    <rect x="288" y="188" width="108" height="38" fill={tint('#2f5fa8')} />
    {Array.from({ length: 36 }, (_, i) => <circle key={i} cx={292 + (i % 12) * 9} cy={192 + Math.floor(i / 12) * 12} r="1.1" fill={tint(i % 3 ? '#f2ecdc' : '#c8283a')} />)}
    {[303, 329, 355, 381].map((x) => <path key={x} d={`M${x - 7} 224 V206 C${x - 7} 200 ${x - 2} 198 ${x} 195 C${x + 2} 198 ${x + 7} 200 ${x + 7} 206 V224 Z`} fill={glow ? '#ffd28a' : tint('#20304a')} opacity={glow ? 0.5 + 0.45 * lit : 1} />)}
    {on('divan') && <g className={arrive('divan')}>
      <rect x="290" y="218" width="104" height="8" fill={tint('#a8322f')} />
      {[298, 312, 326, 340, 354, 368, 382].map((x, i) => <rect key={x} x={x - 5} y="211" width="10" height="8" rx="2.4" fill={tint(i % 2 ? '#e2b33c' : '#c8283a')} />)}
    </g>}
    {columns.map((x) => <g key={x}><rect x={x - 1.8} y="188" width="3.6" height="38" fill={tint('#f3eee6')} /><rect x={x - 3} y="186" width="6" height="3" fill={tint('#e3dccf')} /></g>)}
    {/* Deep eaves on carved brackets, and a lead dome with its finial. */}
    <path d="M270 186 H404 L398 180 H276 Z" fill={tint('#8a5a34')} />
    {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${282 + i * 10} 186 l2 3 l2 -3`} stroke={tint('#6e4322')} strokeWidth=".8" fill="none" />)}
    <path d="M276 180 L300 168 H372 L398 180 Z" fill={tint('#7f8a99')} />
    <rect x="316" y="160" width="40" height="9" fill={tint('#e9e3d8')} />
    <path d="M314 161 C314 146 324 138 336 138 C348 138 358 146 358 161 Z" fill={tint('#8a95a3')} />
    <path d="M320 152 C326 146 346 146 352 152" stroke={tint('#a6b0bc')} strokeWidth=".8" fill="none" />
    <rect x="335.2" y="128" width="1.6" height="10" fill={tint('#d4a017')} />
    <path d="M336 121 A4 4 0 1 0 339 127 A3 3 0 1 1 336 121 Z" fill={tint('#d4a017')} />
    {on('storks') && <Storks tint={tint} className={arrive('storks')} />}
  </g>;
}

function Storks({ tint, className }: { tint: Tint; className: string }) {
  return <g className={className}>
    <g transform="translate(296 168)">
      <ellipse rx="10" ry="3" fill={tint('#7a5a3a')} /><path d="M-10 -1 C-4 -4 4 -4 10 -1" stroke={tint('#5a4028')} strokeWidth="1" fill="none" />
      <g transform="translate(0 -3)">
        <path d="M-5 0 C-5 -5 2 -7 5 -4 L4 0 Z" fill={tint('#f6f4ef')} /><path d="M-5 -1 C-3 -3 0 -3 1 -1 L-2 1 Z" fill="#222" />
        <path d="M4 -4 C5 -8 5 -12 6 -14" stroke={tint('#f6f4ef')} strokeWidth="1.6" fill="none" />
        <circle cx="6" cy="-14" r="1.4" fill={tint('#f6f4ef')} /><path d="M7 -14 L12 -12.6" stroke={tint('#d8432f')} strokeWidth="1" />
      </g>
    </g>
  </g>;
}

function Cesme({ tint, water, motion, className }: { tint: Tint; water: string; motion: boolean; className: string }) {
  return <g transform="translate(172 236)"><g className={className}>
    <ellipse cy="1" rx="18" ry="2.4" fill="#000" opacity=".14" />
    <rect x="-15" y="-34" width="30" height="34" fill={tint('#efe9df')} />
    <path d="M-15 -34 L-12 -38 H12 L15 -34 Z" fill={tint('#e3dccf')} />
    <rect x="-11" y="-32" width="22" height="5" fill={tint('#2f5fa8')} />
    <path d="M-8 -30 h3 m2 0 c1 -2 3 -2 3 0 m3 0 h4" stroke={tint('#e8c96a')} strokeWidth=".6" fill="none" />
    <path d="M-8 -6 V-18 C-8 -22 -3 -23 0 -26 C3 -23 8 -22 8 -18 V-6 Z" fill={tint('#ddd5c6')} stroke={tint('#c9bfae')} strokeWidth=".6" />
    <path d="M-3 -16 C-3 -19 3 -19 3 -16 L2 -12 H-2 Z" fill={tint('#c9bfae')} />
    <rect x="-.8" y="-12" width="1.6" height="3" fill={tint('#b98a2a')} />
    {motion && <path className="lg-water" d="M0 -9 V-3" stroke="#dff2ff" strokeWidth=".8" />}
    <path d="M-12 -4 H12 L10 0 H-10 Z" fill={tint('#e3dccf')} /><rect x="-10" y="-4" width="20" height="1.6" fill={water} />
  </g></g>;
}

function CarnationPot({ x, tint }: { x: number; tint: Tint }) {
  return <g transform={`translate(${x} 236)`}>
    <ellipse cy="1" rx="7" ry="1.8" fill="#000" opacity=".14" />
    <path d="M-5 -7 L5 -7 L4 0 H-4 Z" fill={tint('#2f5fa8')} /><path d="M-4 -4 H4" stroke={tint('#f2ecdc')} strokeWidth=".7" strokeDasharray="1 1" />
    {[[-4, -14], [0, -17], [4, -13], [-2, -11], [2, -10]].map(([fx, fy], i) => <g key={i}>
      <path d={`M0 -7 Q${fx * 0.4} ${(fy - 7) / 2} ${fx} ${fy}`} stroke={tint('#5f8a6a')} strokeWidth=".6" fill="none" />
      <circle cx={fx} cy={fy} r="1.7" fill={tint(i % 2 ? '#e04a5a' : '#f07a8a')} />
    </g>)}
  </g>;
}

function Havuz({ tint, water, motion, className }: { tint: Tint; water: string; motion: boolean; className: string }) {
  return <g transform="translate(236 264)"><g className={className}>
    <ellipse cy="2" rx="27" ry="6.5" fill="#000" opacity=".12" />
    <ellipse rx="27" ry="7" fill={tint('#efe9df')} />
    <ellipse rx="23" ry="5.4" fill={water} />
    {motion && [0, 1].map((i) => <ellipse key={i} className="lg-ripple" style={{ animationDelay: `${i * 1.3}s` }} rx="9" ry="1.6" fill="none" stroke="#fff" strokeWidth=".5" />)}
    <path d="M-1.2 0 V-6 H1.2 V0 Z" fill={tint('#e3dccf')} />
    <g className={motion ? 'lg-water' : undefined} fill="none" stroke="#dff2ff" strokeWidth=".8" strokeLinecap="round"><path d="M0 -6 V-16" /><path d="M0 -16 C-3 -18 -6 -12 -7 -4" /><path d="M0 -16 C3 -18 6 -12 7 -4" /></g>
  </g></g>;
}

function Hyacinth({ x, y, tint }: { x: number; y: number; tint: Tint }) {
  return <g transform={`translate(${x} ${y})`}>
    {[-3, 0, 3].map((dx, i) => <g key={dx} className="lg-flower" style={{ animationDelay: `${-i * 0.6}s` }}>
      <path d={`M${dx} 0 V-7`} stroke={tint('#4f7f3c')} strokeWidth=".8" />
      {[0, 1, 2, 3, 4].map((k) => <circle key={k} cx={dx + (k % 2 ? 0.8 : -0.8)} cy={-7 - k * 1.4} r="1.1" fill={tint(i === 1 ? '#f2a0c6' : '#5a6fd0')} />)}
    </g>)}
  </g>;
}

function TulipLamp({ x, y, k, tint, glow, lit }: { x: number; y: number; k: number; tint: Tint; glow: string; lit: number }) {
  return <g transform={`translate(${x.toFixed(1)} ${y}) scale(${k.toFixed(2)})`}>
    <rect x="-.6" y="-12" width="1.2" height="12" fill={tint('#8a6418')} />
    {lit > 0 && <circle className="lg-flicker" cy="-15" r="8" fill={glow} opacity={lit} />}
    <path d="M-2.6 -12 C-3 -15 -2 -18 -1.2 -18.6 L0 -16.8 L1.2 -18.6 C2 -18 3 -15 2.6 -12 Z" fill={lit > 0 ? '#ffcf7a' : tint('#c8283a')} opacity=".95" />
  </g>;
}

function Caiques({ tint, motion, className }: { tint: Tint; motion: boolean; className: string }) {
  const boat = (x: number, y: number, k: number, flip: boolean) => <g transform={`translate(${x} ${y}) scale(${flip ? -k : k} ${k})`}><g className={motion ? 'lg-flower slow' : undefined}>
    <path d="M-14 0 C-10 3 10 3 14 -1 L16 -4 C10 -2 -10 -2 -16 -4 Z" fill={tint('#7a3f24')} />
    <path d="M-12 -2 H12" stroke={tint('#d4a017')} strokeWidth=".6" />
    <path d="M-4 -2 L-12 3 M4 -2 L-4 3" stroke={tint('#5a3a22')} strokeWidth=".7" />
    <circle cx="-8" cy="-4" r="1.2" fill={tint('#c8283a')} /><circle cx="2" cy="-4" r="1.2" fill={tint('#2f5fa8')} />
  </g></g>;
  return <g className={className}>{boat(150, 190, 0.9, false)}{boat(330, 196, 0.7, true)}</g>;
}

function Erguvan({ tint, className }: { tint: Tint; className: string }) {
  const trees = useMemo(() => {
    const random = seeded(29);
    return Array.from({ length: 16 }, () => ({ x: lerp(10, 390, random()), y: lerp(160, 176, random()), r: lerp(3, 6, random()) }));
  }, []);
  return <g className={className}>{trees.map((t, i) => <g key={i}><circle cx={t.x} cy={t.y} r={t.r} fill={tint(i % 2 ? '#d779b4' : '#c95fa3')} opacity=".85" /><circle cx={t.x + t.r * 0.5} cy={t.y - t.r * 0.3} r={t.r * 0.6} fill={tint('#e59ccb')} opacity=".8" /></g>)}</g>;
}

export function OttomanFlowerHeads({ tint, prefix }: { tint: Tint; prefix: string }) {
  const tulip = (body: string, light: string, streak?: string) => <>
    <path d="M-2.4 0 C-3 -3 -2.2 -5 -1.2 -5.6 L0 -3.6 L1.2 -5.6 C2.2 -5 3 -3 2.4 0 C1.4 1.2 -1.4 1.2 -2.4 0 Z" fill={tint(body)} />
    <path d="M-1 -.5 C-1.2 -2.8 -.4 -4 0 -3.6 C.4 -4 1.2 -2.8 1 -.5 Z" fill={tint(light)} />
    {streak && <path d="M-1.6 -.4 L-1.4 -4.4 M0 0 V-3.4 M1.6 -.4 L1.4 -4.4" stroke={tint(streak)} strokeWidth=".5" />}
  </>;
  // The almond-shaped Ottoman tulip, long and pointed.
  const lale = (fill: string) => <path d="M0 .6 C-2.2 -1 -2.6 -4 -1.2 -7.4 L0 -5 L1.2 -7.4 C2.6 -4 2.2 -1 0 .6 Z" fill={tint(fill)} />;
  return <>
    <g id={`${prefix}0`}>{lale('#c8283a')}</g>
    <g id={`${prefix}1`}>{tulip('#f2c12e', '#f8dc6e')}</g>
    <g id={`${prefix}2`}>{tulip('#fbf3ea', '#ffffff', '#c8283a')}</g>
    <g id={`${prefix}3`}>{lale('#6a3a9a')}</g>
    <g id={`${prefix}4`}>{tulip('#e8557a', '#f48aa6')}</g>
    <g id={`${prefix}5`}>{lale('#f07a1c')}</g>
  </>;
}

/** The ogee arch, faced with a border of İznik tiles. */
export function OgeeFrame({ gold, golden, className }: { gold: string; golden: boolean; className: string }) {
  return <g className={`lg-frame${golden ? ' golden' : ''}${className}`} fill="none" pointerEvents="none">
    <path d={OGEE} stroke={golden ? gold : '#1f4f9a'} strokeWidth="10" />
    <path d={OGEE} stroke={golden ? '#fff3c4' : '#f2ecdc'} strokeWidth="5" />
    <path d={OGEE} stroke={golden ? '#d4a017' : '#c8283a'} strokeWidth="2.6" strokeDasharray="0.1 9" strokeLinecap="round" />
    <path d={OGEE} stroke={golden ? gold : '#3aa6a0'} strokeWidth="1.8" strokeDasharray="0.1 9" strokeDashoffset="4.5" strokeLinecap="round" />
    <g transform="translate(200 2)"><path d="M0 -6 C3 -2 3 2 0 6 C-3 2 -3 -2 0 -6 Z" fill={golden ? gold : '#c8283a'} stroke="none" /></g>
  </g>;
}
