import { useMemo } from 'react';
import { APRICOT, damascusBed } from './layouts';
import { mix, type Tint } from './palette';
import { lerp, seeded } from './random';
import type { Ctx } from './scene';
import { branchGrowth, branchOutline } from './tree';

/**
 * The Damascus courtyard: a house turned inward, open only to the sky. Walls banded in pale
 * limestone and black basalt (ablaq), a tall iwan to sit in, an octagonal fountain (bahra)
 * in the paving, and a bitter orange in a bed of earth. Mount Qasyoun and a minaret show
 * above the walls.
 */

const BACK = 150;
const FLOOR = 226;
const STRIPES = ['#efe6d6', '#efe6d6', '#47424b', '#efe6d6', '#efe6d6', '#d8b47a'];

export function DamascusFar({ palette }: Ctx) {
  return <>
    <path d="M0 132 C40 112 90 106 140 120 C190 102 240 110 290 126 C330 118 370 122 400 130 L400 152 L0 152 Z" fill={mix(palette.hillFar, '#b09a7c', 0.35)} />
    <g fill={palette.skyline} opacity=".8">
      {/* A square Syrian minaret and a dome, over the roofs of the old city. */}
      <rect x="344" y="78" width="12" height="74" /><rect x="341" y="96" width="18" height="3" /><rect x="346" y="66" width="8" height="12" /><path d="M345 66 L350 56 L355 66 Z" />
      <path d="M282 152 V140 C282 128 292 122 302 122 C312 122 322 128 322 140 V152 Z" /><rect x="301" y="114" width="1.6" height="8" />
      <rect x="160" y="138" width="40" height="14" /><rect x="380" y="134" width="20" height="18" />
    </g>
  </>;
}

/** Bands of stone along a wall; `skew` maps a back-wall height to the wall's other edge. */
function Bands({ x0, x1, top, bottom, tint, skew }: { x0: number; x1: number; top: number; bottom: number; tint: Tint; skew?: (y: number) => number }) {
  const count = Math.ceil((bottom - top) / 5);
  return <g>{Array.from({ length: count }, (_, k) => {
    const y0 = top + k * 5; const y1 = Math.min(bottom, y0 + 5);
    const fill = tint(STRIPES[k % STRIPES.length]);
    if (!skew) return <rect key={k} x={x0} y={y0} width={x1 - x0} height={y1 - y0 + 0.3} fill={fill} />;
    return <path key={k} d={`M${x1} ${y0} L${x1} ${y1 + 0.3} L${x0} ${skew(y1) + 0.3} L${x0} ${skew(y0)} Z`} fill={fill} />;
  })}</g>;
}

const toFront = (y: number) => 96 + (y - BACK) * ((252 - 96) / (FLOOR - BACK));

export function DamascusWall(ctx: Ctx) {
  const { tint, lit, on, arrive } = ctx;
  const glow = lit > 0;
  return <>
    <Bands x0={0} x1={400} top={BACK} bottom={FLOOR} tint={tint} />
    <rect y={BACK - 3} width="400" height="4" fill={tint('#bfae92')} />
    {/* Side walls, coming forward to the doorway. */}
    <g opacity=".93"><Bands x0={0} x1={34} top={BACK} bottom={FLOOR} tint={(c) => tint(mix(c, '#6b5a50', 0.18))} skew={toFront} /></g>
    <g opacity=".93" transform="translate(400 0) scale(-1 1)"><Bands x0={0} x1={34} top={BACK} bottom={FLOOR} tint={(c) => tint(mix(c, '#6b5a50', 0.24))} skew={toFront} /></g>
    <path d={`M0 ${toFront(BACK) - 4} L34 ${BACK - 3} M400 ${toFront(BACK) - 4} L366 ${BACK - 3}`} stroke={tint('#bfae92')} strokeWidth="4" />
    {/* Upper windows of the house. */}
    {[78, 150].map((x) => <g key={x}>
      <path d={`M${x - 12} 186 V166 Q${x - 12} 156 ${x} 154 Q${x + 12} 156 ${x + 12} 166 V186 Z`} fill={glow ? '#ffd28a' : tint('#2e2a33')} opacity={glow ? 0.5 + 0.45 * lit : 1} />
      <path d={`M${x - 14} 187 H${x + 14}`} stroke={tint('#bfae92')} strokeWidth="2" />
      {on('mashrabiya') && <Mashrabiya x={x} tint={tint} className={arrive('mashrabiya')} />}
    </g>)}
    {on('qamariyya') && <Qamariyya tint={tint} glow={glow} lit={lit} className={arrive('qamariyya')} />}
    <Iwan ctx={ctx} />
    {on('jasmine') && <Jasmine tint={tint} className={arrive('jasmine')} />}
  </>;
}

function Iwan({ ctx }: { ctx: Ctx }) {
  const { tint, lit, on, arrive } = ctx;
  const glow = lit > 0;
  const arch = 'M222 226 V170 Q222 130 270 112 Q318 130 318 170 V226 Z';
  return <g>
    <Bands x0={206} x1={334} top={100} bottom={FLOOR} tint={tint} />
    <rect x="204" y="97" width="132" height="4" fill={tint('#bfae92')} />
    {/* A band of inscription over the arch. */}
    <rect x="212" y="104" width="116" height="6" fill={tint('#2f4f6e')} />
    <path d="M216 108 h4 m2 -2 v3 m3 -1 h6 m3 0 c2 -3 4 -3 4 0 m4 0 h8 m3 -2 v3 m3 -1 h5 m4 0 c2 -3 4 -3 4 0 m4 0 h9 m3 -2 v3 m3 -1 h6 m4 0 c2 -3 4 -3 4 0 m4 0 h8 m3 -2 v3" stroke={tint('#e8c96a')} strokeWidth=".6" fill="none" />
    <path d={arch} fill={glow ? mix('#3a3138', '#ffb85c', 0.25 * lit) : tint('#3a3138')} />
    <rect x="238" y="150" width="64" height="62" fill={tint(glow ? '#5f4a3e' : '#4d4247')} />
    {/* Muqarnas: tiers of little niches filling the head of the arch. */}
    <g fill={tint('#d9cdb8')} opacity=".85">{[0, 1, 2].map((row) => Array.from({ length: 6 - row * 2 }, (_, i) => {
      const n = 6 - row * 2; const x = 270 + (i - (n - 1) / 2) * 9; const y = 128 + row * 7;
      return <path key={`${row}${i}`} d={`M${x - 4.5} ${y} Q${x} ${y - 6} ${x + 4.5} ${y} Z`} />;
    }))}</g>
    <path d={arch} fill="none" stroke={tint('#efe6d6')} strokeWidth="5" />
    <path d={arch} fill="none" stroke={tint('#47424b')} strokeWidth="5" strokeDasharray="6 6" />
    <rect x="222" y="212" width="96" height="14" fill={tint('#ddd1bc')} />
    <rect x="222" y="212" width="96" height="2" fill={tint('#c4b59b')} />
    {on('iwanCushions') && <Cushions tint={tint} className={arrive('iwanCushions')} />}
    {on('teaTray') && <TeaTray tint={tint} className={arrive('teaTray')} />}
    {on('brassLantern') && <BrassLantern tint={tint} glow={ctx.url('lamp')} lit={lit} className={arrive('brassLantern')} />}
  </g>;
}

export function DamascusGround(ctx: Ctx) {
  const { tint, url, on, arrive, motion, days } = ctx;
  const bed = (y: number) => damascusBed(y);
  return <>
    <path d={`M0 252 L34 ${FLOOR} L366 ${FLOOR} L400 252 L400 300 L0 300 Z`} fill={tint('#e6dccb')} />
    {/* Paving in perspective. */}
    <g stroke={tint('#c9bba3')} strokeWidth=".6">
      {[-160, -100, -40, 20, 80, 140, 200, 260, 320, 380, 440, 500, 560].map((x) => <line key={x} x1={x} y1="300" x2={lerp(x, 200, (300 - FLOOR) / 180)} y2={FLOOR} />)}
      {[231, 238, 247, 258, 272, 289].map((y) => <line key={y} x1="0" y1={y} x2="400" y2={y} />)}
    </g>
    {on('inlaidFloor') && <Inlay tint={tint} className={arrive('inlaidFloor')} />}
    {/* The orange's bed, and the bed for roses. */}
    <path d={`M${bed(254).x0} 254 L${bed(254).x1} 254 L${bed(300).x1} 300 L${bed(300).x0} 300 Z`} fill={url('soil')} />
    <path d={`M${bed(254).x0} 254 L${bed(254).x1} 254 L${bed(300).x1} 300 M${bed(300).x0} 300 L${bed(254).x0} 254`} fill="none" stroke={tint('#bfae92')} strokeWidth="3" />
    <path d="M306 262 L396 262 L396 300 L298 300 Z" fill={url('soil')} />
    <path d="M298 300 L306 262 L396 262" fill="none" stroke={tint('#bfae92')} strokeWidth="3" />
    {on('apricot') && <Apricot tint={tint} days={days} className={arrive('apricot')} />}
    {on('citrusPots') && <g className={arrive('citrusPots')}><CitrusPot x={212} tint={tint} /><CitrusPot x={328} tint={tint} /></g>}
    {on('bahra') && <Bahra tint={tint} motion={motion} water={url('water')} className={arrive('bahra')} />}
    {on('doves') && <Doves tint={tint} className={arrive('doves')} />}
    {on('damaskRoses') && <g className={arrive('damaskRoses')}>{[[318, 270], [352, 266], [384, 272]].map(([x, y]) => <RoseBush key={x} x={x} y={y} tint={tint} />)}</g>}
  </>;
}

export function DamascusOver({ tint, on, arrive }: Ctx) {
  return on('grapeArbor') ? <GrapeArbor tint={tint} className={arrive('grapeArbor')} /> : null;
}

function Inlay({ tint, className }: { tint: Tint; className: string }) {
  const star = 'M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5 Z';
  const spots = [[200, 234, 0.6], [140, 234, 0.6], [260, 234, 0.6], [212, 280, 1.1], [266, 290, 1.2], [348, 244, 0.8], [192, 252, 0.8], [300, 252, 0.8]];
  return <g className={className}>{spots.map(([x, y, k], i) => <g key={i} transform={`translate(${x} ${y}) scale(${k * 1.6} ${k * 0.55})`}>
    <rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" fill={tint('#47424b')} />
    <path d={star} fill={tint(i % 2 ? '#b0413e' : '#d8b47a')} transform="scale(1.05)" />
    <circle r="1.4" fill={tint('#efe6d6')} />
  </g>)}</g>;
}

function Jasmine({ tint, className }: { tint: Tint; className: string }) {
  const leaves = useMemo(() => {
    const random = seeded(33);
    return Array.from({ length: 60 }, (_, i) => {
      const t = i / 59;
      // Up the left wall, then along the top of the back wall.
      const x = t < 0.55 ? lerp(18, 30, random()) : lerp(30, 190, (t - 0.55) / 0.45);
      const y = t < 0.55 ? lerp(256, toFront(BACK) + 40, t / 0.55) - (x - 18) * 0.6 : BACK + 2 + random() * 10;
      return { x, y, r: random() * 360, flower: i % 3 === 0 };
    });
  }, []);
  return <g className={className}>
    <path d={`M20 256 C26 220 22 190 30 ${BACK + 4} C80 ${BACK + 8} 140 ${BACK + 2} 190 ${BACK + 8}`} stroke={tint('#5a4632')} strokeWidth="1" fill="none" />
    {leaves.map((leaf, i) => <g key={i} transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}) rotate(${leaf.r.toFixed(0)})`}>
      <path d="M0 0 C1.6 -1.6 1.6 -4.4 0 -5.6 C-1.6 -4.4 -1.6 -1.6 0 0 Z" fill={tint(i % 2 ? '#3f6d34' : '#4f7f3c')} />
      {leaf.flower && <g transform="translate(2 -3)">{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} rx=".6" ry="1.4" cy="-1.1" transform={`rotate(${a})`} fill="#fffdf6" />)}</g>}
    </g>)}
  </g>;
}

function Bahra({ tint, motion, water, className }: { tint: Tint; motion: boolean; water: string; className: string }) {
  const octagon = (rx: number, ry: number) => Array.from({ length: 8 }, (_, k) => {
    const a = ((k * 45 + 22.5) * Math.PI) / 180;
    return `${(Math.cos(a) * rx).toFixed(1)} ${(Math.sin(a) * ry).toFixed(1)}`;
  }).join(' L');
  return <g transform="translate(246 264)"><g className={className}>
    <ellipse cy="6" rx="46" ry="6" fill="#000" opacity=".12" />
    <path d={`M${octagon(46, 11.5)} Z`} transform="translate(0 4)" fill={tint('#cfc2ab')} />
    <path d={`M${octagon(46, 11.5)} Z`} fill={tint('#ebe2d2')} />
    <path d={`M${octagon(43, 10.2)} Z`} fill="none" stroke={tint('#b0413e')} strokeWidth="1.1" strokeDasharray="3 2" />
    <path d={`M${octagon(40, 9)} Z`} fill={water} />
    {motion && [0, 1, 2].map((i) => <ellipse key={i} className="lg-ripple" style={{ animationDelay: `${i * 1.1}s` }} rx="14" ry="2.6" fill="none" stroke="#fff" strokeWidth=".5" />)}
    <rect x="-2.6" y="-14" width="5.2" height="14" fill={tint('#e4d9c4')} />
    <ellipse cy="-14" rx="7" ry="1.8" fill={tint('#efe6d4')} />
    <g className={motion ? 'lg-water' : undefined} fill="none" stroke="#dff2ff" strokeWidth=".9" strokeLinecap="round" opacity=".9">
      <path d="M0 -15 V-30" /><path d="M0 -30 C-3 -34 -8 -28 -9 -16" /><path d="M0 -30 C3 -34 8 -28 9 -16" />
    </g>
  </g></g>;
}

function CitrusPot({ x, tint }: { x: number; tint: Tint }) {
  return <g transform={`translate(${x} ${FLOOR})`}>
    <ellipse cy="1" rx="11" ry="2.4" fill="#000" opacity=".15" />
    <path d="M-9 -14 L9 -14 L6.5 0 H-6.5 Z" fill={tint('#b9643a')} /><rect x="-10" y="-16.5" width="20" height="3" rx="1" fill={tint('#cc7448')} />
    <path d="M-7 -9 H7" stroke={tint('#9a4f2c')} strokeWidth=".7" />
    <path d="M0 -16 V-24" stroke={tint('#6b5038')} strokeWidth="1.4" />
    <g className="lg-sway slow"><circle cy="-32" r="11" fill={tint('#2f6633')} /><circle cx="-5" cy="-36" r="6.5" fill={tint('#3a7238')} /><circle cx="5" cy="-29" r="6.5" fill={tint('#285a2c')} />
      {[[-5, -28], [4, -36], [6, -26], [-7, -35], [0, -31]].map(([lx, ly], i) => <circle key={i} cx={lx} cy={ly} r="1.7" fill={tint('#f2d33c')} />)}</g>
  </g>;
}

function BrassLantern({ tint, glow, lit, className }: { tint: Tint; glow: string; lit: number; className: string }) {
  return <g transform="translate(270 114)"><g className={className}>
    <line y1="0" y2="34" stroke={tint('#4a3b2b')} strokeWidth=".6" />
    <g transform="translate(0 34)"><g className="lg-lantern">
      {lit > 0 && <circle className="lg-flicker" cy="8" r="30" fill={glow} opacity={lit} />}
      <path d="M-2 0 H2 L4 3 H-4 Z" fill={tint('#b98a2a')} />
      <path d="M-6 3 C-8 7 -8 11 -5 15 H5 C8 11 8 7 6 3 Z" fill={lit > 0 ? '#ffd27a' : tint('#c9982e')} stroke={tint('#8a6418')} strokeWidth=".6" />
      {[[-3, 7], [0, 6], [3, 7], [-3.4, 11], [0, 11], [3.4, 11]].map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r=".8" fill={lit > 0 ? '#fff3c4' : tint('#8a6418')} />)}
      <path d="M-4 15 H4 L1.6 18 H-1.6 Z" fill={tint('#b98a2a')} />
    </g></g>
  </g></g>;
}

function Cushions({ tint, className }: { tint: Tint; className: string }) {
  return <g className={className}>
    <rect x="232" y="210" width="76" height="4" fill={tint('#a8322f')} />
    <path d="M232 212 h76" stroke={tint('#e2b33c')} strokeWidth=".8" strokeDasharray="2 2" />
    {[242, 258, 282, 298].map((x, i) => <rect key={x} x={x - 6} y="200" width="12" height="10" rx="3" fill={tint(i % 2 ? '#2f56a8' : '#b0413e')} />)}
    {[242, 258, 282, 298].map((x) => <path key={x} d={`M${x - 4} 205 h8`} stroke={tint('#e2b33c')} strokeWidth=".6" />)}
  </g>;
}

function TeaTray({ tint, className }: { tint: Tint; className: string }) {
  return <g transform="translate(270 212)"><g className={className}>
    <path d="M-5 0 L-3 -6 M5 0 L3 -6" stroke={tint('#6b4a2b')} strokeWidth="1" />
    <ellipse cy="-6.5" rx="11" ry="2.4" fill={tint('#c9982e')} />
    <path d="M-2 -8 C-3 -13 3 -13 2 -8 Z M2 -11 l3 -1" fill={tint('#b98a2a')} stroke={tint('#8a6418')} strokeWidth=".4" />
    {[-7, -4, 5, 8].map((x) => <path key={x} d={`M${x - 1} -7.4 L${x - 0.8} -10 H${x + 0.8} L${x + 1} -7.4 Z`} fill="#d9472f" opacity=".85" />)}
  </g></g>;
}

function Mashrabiya({ x, tint, className }: { x: number; tint: Tint; className: string }) {
  return <g className={className}>
    <path d={`M${x - 15} 188 V166 Q${x - 15} 153 ${x} 151 Q${x + 15} 153 ${x + 15} 166 V188 Z`} fill={tint('#7a5232')} />
    <g stroke={tint('#4f321c')} strokeWidth=".6">
      {Array.from({ length: 7 }, (_, i) => <line key={`v${i}`} x1={x - 12 + i * 4} y1="158" x2={x - 12 + i * 4} y2="186" />)}
      {Array.from({ length: 8 }, (_, i) => <line key={`h${i}`} x1={x - 13} y1={160 + i * 3.6} x2={x + 13} y2={160 + i * 3.6} />)}
    </g>
    {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={x - 10 + (i % 6) * 4} cy={164 + Math.floor(i / 6) * 14} r=".9" fill={tint('#c99a5c')} />)}
  </g>;
}

function Qamariyya({ tint, glow, lit, className }: { tint: Tint; glow: boolean; lit: number; className: string }) {
  const panes = ['#c9433b', '#2f6fb0', '#e2b33c', '#3f9a6e', '#9a4fb0'];
  return <g className={className}>{[[114, 162], [356, 172], [270, 160]].map(([x, y], w) => <g key={w} transform={`translate(${x} ${y})`}>
    {glow && <circle r="14" fill="#ffd28a" opacity={0.35 * lit} />}
    <circle r="7.5" fill={tint('#bfae92')} />
    {panes.map((c, i) => <path key={i} d={`M0 0 L${(Math.cos((i * 72 * Math.PI) / 180) * 6).toFixed(2)} ${(Math.sin((i * 72 * Math.PI) / 180) * 6).toFixed(2)} A6 6 0 0 1 ${(Math.cos(((i + 1) * 72 * Math.PI) / 180) * 6).toFixed(2)} ${(Math.sin(((i + 1) * 72 * Math.PI) / 180) * 6).toFixed(2)} Z`} fill={glow ? mix(c, '#fff4c8', 0.3) : tint(c)} opacity={glow ? 0.95 : 0.8} />)}
    <circle r="1.6" fill={tint('#bfae92')} />
  </g>)}</g>;
}

function Doves({ tint, className }: { tint: Tint; className: string }) {
  const dove = (x: number, y: number, flip: boolean, k = 1) => <g transform={`translate(${x} ${y}) scale(${flip ? -k : k} ${k})`}>
    <path d="M-5 0 C-4 -3.4 1 -4 3.6 -2.2 L5.4 -2.6 L4.4 -1 C3 1.6 -2 2 -5 0 Z" fill={tint('#e9e6e0')} />
    <path d="M-1.6 -1.4 C-.4 -3.6 1.8 -3.6 2.6 -2" fill="none" stroke={tint('#b9b4ac')} strokeWidth=".7" />
    <circle cx="3.4" cy="-2.2" r=".4" fill="#222" /><path d="M-5 0 L-8 -1 L-7.4 1 Z" fill={tint('#cfcac2')} />
  </g>;
  return <g className={className}>{dove(222, 255, false)}{dove(276, 257, true)}{dove(250, 271, false, 1.1)}{dove(60, BACK - 3, true, 0.8)}</g>;
}

function RoseBush({ x, y, tint }: { x: number; y: number; tint: Tint }) {
  const blooms = [[-6, -12], [2, -16], [7, -9], [-2, -7], [-9, -5], [5, -4], [0, -11]];
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cy="1" rx="13" ry="2.5" fill="#000" opacity=".14" />
    <g className="lg-sway slow">
      <path d="M-12 0 C-13 -10 -6 -19 2 -19 C10 -18 14 -10 12 0 Z" fill={tint('#3e6b3a')} />
      {blooms.map(([bx, by], i) => <g key={i} transform={`translate(${bx} ${by})`}><circle r="2.6" fill={tint(i % 2 ? '#e88aa6' : '#f2b2c4')} /><circle r="1.1" fill={tint('#c65a7a')} /></g>)}
    </g>
  </g>;
}

function Apricot({ tint, days, className }: { tint: Tint; days: number; className: string }) {
  const tree = APRICOT;
  const growth = Math.min(1, 0.5 + (days - 63) / 80);
  const grown = tree.branches.map((branch) => branchGrowth(branch, growth, tree.maxDepth));
  const ready = tree.anchors.filter((anchor) => grown[anchor.branch] >= anchor.t);
  return <g transform={`translate(372 246) scale(${(0.36 + 0.12 * growth).toFixed(3)})`}><g className={className}>
    <ellipse cy="2" rx="22" ry="4" fill="#000" opacity=".14" />
    <g className="lg-sway slow">
      {tree.branches.map((branch, i) => grown[i] > 0 && <path key={i} d={branchOutline(branch, grown[i], 0.55)} fill={tint('#5e4436')} />)}
      {ready.map((anchor) => <g key={anchor.order} transform={`translate(${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)})`}>
        <circle r="7" fill={tint(anchor.tone % 2 ? '#f4c6cf' : '#efb3c0')} opacity=".95" />
        <circle cx="3" cy="2" r="4.5" fill={tint('#4f7f3c')} opacity=".8" />
        {anchor.order % 3 === 0 && <circle cx="-2" cy="4" r="2.4" fill={tint('#f09a3a')} />}
      </g>)}
    </g>
  </g></g>;
}

function GrapeArbor({ tint, className }: { tint: Tint; className: string }) {
  const leaves = useMemo(() => {
    const random = seeded(47);
    return Array.from({ length: 70 }, (_, i) => ({ x: lerp(10, 390, random()), y: 22 + random() * 16 + (i % 9 === 0 ? 14 : 0), r: random() * 360, grape: i % 8 === 3 }));
  }, []);
  return <g className={className}>
    {[24, 34].map((y) => <rect key={y} x="0" y={y} width="400" height="3" fill={tint('#6e4f33')} />)}
    {[60, 140, 220, 300, 380].map((x) => <rect key={x} x={x - 2} y="20" width="4" height="20" fill={tint('#5e4228')} />)}
    {leaves.map((leaf, i) => <g key={i} transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}) rotate(${leaf.r.toFixed(0)})`}>
      <path d="M0 0 C-4 -2 -5 -7 -2 -9 C-1 -7 0 -8 0 -10 C1 -8 2 -7 3 -9 C6 -7 4 -2 0 0 Z" fill={tint(i % 2 ? '#5f8b43' : '#6f9b4c')} />
      {leaf.grape && <g transform="translate(2 4)">{[[0, 0], [2.2, 0], [1.1, 1.9], [-1.1, 1.9], [3.3, 1.9], [0, 3.8], [2.2, 3.8], [1.1, 5.7]].map(([gx, gy], k) => <circle key={k} cx={gx} cy={gy} r="1.3" fill={tint('#b5c96a')} />)}</g>}
    </g>)}
  </g>;
}

export function DamascusFlowerHeads({ tint, prefix }: { tint: Tint; prefix: string }) {
  const petals = (count: number, rx: number, ry: number, fill: string, offset = 0) => Array.from({ length: count }, (_, i) =>
    <ellipse key={i} rx={rx} ry={ry} cy={-ry * 0.9} transform={`rotate(${(360 / count) * i + offset})`} fill={fill} />);
  return <>
    {/* Damask rose */}
    <g id={`${prefix}0`}>{petals(6, 1.7, 2.1, tint('#e07a98'))}{petals(5, 1, 1.3, tint('#c9567a'), 30)}<circle r=".8" fill={tint('#9e3a5a')} /></g>
    {/* Jasmine */}
    <g id={`${prefix}1`}>{petals(5, 1.1, 2, tint('#fffdf4'))}<circle r=".6" fill={tint('#f1d27c')} /></g>
    {/* Narcissus */}
    <g id={`${prefix}2`}>{petals(6, 1.2, 2, tint('#fbf7e6'))}<circle r="1.2" fill={tint('#f2b51e')} /><circle r=".6" fill={tint('#d9781a')} /></g>
    {/* Violet */}
    <g id={`${prefix}3`}>{petals(5, 1.2, 1.8, tint('#6a45a8'))}<circle r=".6" fill={tint('#f4e3a0')} /></g>
    {/* Carnation */}
    <g id={`${prefix}4`}>{petals(10, .9, 2, tint('#d8343f'))}{petals(8, .6, 1.2, tint('#ef6a6f'), 20)}</g>
    {/* Calendula */}
    <g id={`${prefix}5`}>{petals(12, .8, 2.1, tint('#f08a1c'))}<circle r="1" fill={tint('#a5521a')} /></g>
  </>;
}

/** A doorway of black and white stones, interlocked in the Damascene way. */
export function DoorwayFrame({ gold, golden, className }: { gold: string; golden: boolean; className: string }) {
  const light = golden ? '#f1d98a' : '#efe6d6';
  const dark = golden ? '#c9971f' : '#47424b';
  return <g className={`lg-frame${golden ? ' golden' : ''}${className}`} pointerEvents="none">
    {[0, 1].map((side) => <g key={side} transform={side ? 'translate(400 0) scale(-1 1)' : undefined}>
      {Array.from({ length: 30 }, (_, k) => <rect key={k} x="0" y={k * 10} width="9" height="10" fill={k % 2 ? dark : light} />)}
      <path d="M9 0 V300" stroke={golden ? gold : '#bfae92'} strokeWidth="1.2" />
    </g>)}
    {/* The lintel: joggled voussoirs, each locking into the next. */}
    {Array.from({ length: 13 }, (_, k) => <rect key={k} x={k * 31} y="0" width="31" height="20" fill={k % 2 ? dark : light} />)}
    {Array.from({ length: 12 }, (_, k) => {
      // Each stone locks into the next with a rounded tongue.
      const x = (k + 1) * 31; const fill = k % 2 ? light : dark;
      return <path key={`j${k}`} d={`M${x} 5 C${x + 6} 5 ${x + 6} 15 ${x} 15 Z`} fill={fill} />;
    })}
    {Array.from({ length: 13 }, (_, k) => <path key={`l${k}`} d={`M${k * 31} 0 V20`} stroke={golden ? '#a87a12' : '#2f2c33'} strokeWidth=".5" opacity=".5" />)}
    <path d="M0 20.5 H400" stroke={golden ? gold : '#bfae92'} strokeWidth="1.4" />
  </g>;
}
