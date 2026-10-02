import { useMemo } from 'react';
import { GroundTexture } from './andalusia';
import { KAMPUNG_FRAME, kampungPath, RAMBUTAN } from './layouts';
import type { Tint } from './palette';
import { mix } from './palette';
import { lerp, seeded } from './random';
import type { Ctx } from './scene';
import { branchGrowth, branchOutline } from './tree';

/**
 * The kampung garden: a Malay village garden seen through a carved wooden window with its
 * shutters open. A house on stilts with a tall gable, paddy terraces stepping down to the
 * hills, a mango tree, a laterite path to the house steps, and, as the days are tended, a
 * wakaf by a lotus pond, pelita along the path and fireflies over the water.
 */

export function KampungFar({ palette }: Ctx) {
  const paddy = palette.night ? '#1d2f3a' : mix(palette.hillNear, '#7fb04a', 0.55);
  const water = mix(palette.skyBottom, '#ffffff', palette.night ? 0.05 : 0.35);
  return <g>
    <path d="M0 150 C30 132 60 128 96 140 C130 120 170 118 204 136 C240 116 290 112 330 132 C360 122 386 124 400 130 L400 190 L0 190 Z" fill={mix(palette.hillFar, '#5f8aa0', 0.3)} />
    <path d="M0 168 C50 150 110 158 160 166 C220 150 290 148 340 160 C370 154 390 156 400 158 L400 200 L0 200 Z" fill={mix(palette.hillFar, '#6f9a6a', 0.4)} />
    {/* A village mosque with a tiered roof, across the fields. */}
    <g fill={palette.skyline} opacity=".75" transform="translate(96 172)">
      <rect x="-12" y="-2" width="24" height="9" />
      <path d="M-16 -2 L0 -10 L16 -2 Z" /><path d="M-11 -9 L0 -16 L11 -9 Z" /><path d="M-6 -15 L0 -21 L6 -15 Z" />
      <rect x="-.6" y="-25" width="1.2" height="5" />
    </g>
    {[30, 54, 150, 178, 214].map((x, i) => <g key={x} transform={`translate(${x} ${172 + (i % 2) * 4})`} opacity=".75">
      <path d="M0 0 C-1 -10 1 -18 3 -24" stroke={palette.skyline} strokeWidth="1.2" fill="none" />
      {[-150, -110, -70, -30, 10].map((a) => <path key={a} transform={`translate(3 -24) rotate(${a})`} d="M0 0 C3 -1 7 0 10 2" stroke={palette.skyline} strokeWidth="1.1" fill="none" />)}
    </g>)}
    {/* Paddy terraces, stepped down the near slope, with water standing between the rows. */}
    {[0, 1, 2, 3, 4, 5].map((row) => <g key={row}>
      <path d={`M0 ${178 + row * 6} C80 ${172 + row * 6} 160 ${176 + row * 6} 240 ${174 + row * 6} C310 ${172 + row * 6} 360 ${176 + row * 6} 400 ${174 + row * 6} L400 216 L0 216 Z`}
        fill={mix(paddy, row % 2 ? '#a9c95f' : '#8bb64e', palette.night ? 0.1 : 0.35)} />
      <path d={`M0 ${178.6 + row * 6} C80 ${172.6 + row * 6} 160 ${176.6 + row * 6} 240 ${174.6 + row * 6} C310 ${172.6 + row * 6} 360 ${176.6 + row * 6} 400 ${174.6 + row * 6}`} stroke={water} strokeWidth=".6" fill="none" opacity=".55" />
    </g>)}
  </g>;
}

export function KampungWall({ tint, on, arrive }: Ctx) {
  return <>
    {on('bamboo') && <Bamboo tint={tint} className={arrive('bamboo')} />}
    {on('coconut') && <Coconut tint={tint} className={arrive('coconut')} />}
  </>;
}

const PATH_EDGE = (() => {
  const left: string[] = []; const right: string[] = [];
  for (let y = 242; y <= 300; y += 4) { const p = kampungPath(y); left.push(`${(p.x - p.half).toFixed(1)} ${y}`); right.unshift(`${(p.x + p.half).toFixed(1)} ${y}`); }
  return `M${left.join(' L')} L${right.join(' L')} Z`;
})();

export function KampungGround(ctx: Ctx) {
  const { tint, url, on, arrive, motion, lit } = ctx;
  return <>
    <rect y="214" width="400" height="86" fill={url('grass')} />
    <GroundTexture tint={tint} color="#5f7f3a" count={44} top={218} />
    <path d={PATH_EDGE} fill={tint('#c0764a')} />
    <path d={PATH_EDGE} fill="none" stroke={tint('#a3603a')} strokeWidth=".8" />
    {on('steppingStones') && <SteppingStones tint={tint} className={arrive('steppingStones')} />}
    <RumahKampung ctx={ctx} />
    {on('banana') && <g className={arrive('banana')}><Banana x={222} y={238} tint={tint} /></g>}
    {on('doveCage') && <DoveCage tint={tint} className={arrive('doveCage')} />}
    {on('wakaf') && <Wakaf tint={tint} className={arrive('wakaf')} />}
    {on('lotusPond') && <LotusPond tint={tint} motion={motion} water={url('water')} className={arrive('lotusPond')} />}
    {on('lemongrass') && <g className={arrive('lemongrass')}><Lemongrass x={204} y={268} tint={tint} /><Lemongrass x={250} y={284} tint={tint} /></g>}
    {on('pelitaRow') && <PelitaRow tint={tint} glow={url('lamp')} lit={lit} className={arrive('pelitaRow')} />}
  </>;
}

export function KampungFront({ tint, on, arrive, limb }: Ctx) {
  return on('orchids') ? <Orchids tint={tint} at={limb('left', 0.5)} className={arrive('orchids')} /> : null;
}

export function KampungOver({ tint, on, arrive, days, idOf }: Ctx) {
  return on('rambutan') ? <Rambutan tint={tint} days={days} spray={idOf('hspray1')} className={arrive('rambutan')} /> : null;
}

/** A Malay house on stilts: a tall gable with sunburst boards, louvred windows and tiled steps. */
function RumahKampung({ ctx }: { ctx: Ctx }) {
  const { tint, lit, on, arrive } = ctx;
  const glow = lit > 0;
  const rays = Array.from({ length: 9 }, (_, i) => i / 8);
  return <g>
    <rect x="252" y="200" width="146" height="42" fill="#000" opacity=".14" />
    {on('pangkin') && <Pangkin tint={tint} className={arrive('pangkin')} />}
    {[262, 291, 320, 349, 378].map((x) => <g key={x}>
      <rect x={x - 1.8} y="200" width="3.6" height="42" fill={tint('#6b4a2e')} />
      <rect x={x - 3} y="240" width="6" height="3" rx="1" fill={tint('#b9ad98')} />
    </g>)}
    <rect x="250" y="196" width="150" height="5" fill={tint('#7a5232')} />
    <rect x="256" y="160" width="138" height="37" fill={tint('#a8743f')} />
    {Array.from({ length: 34 }, (_, i) => <line key={i} x1={258 + i * 4} y1="160" x2={258 + i * 4} y2="196" stroke={tint('#8f5f32')} strokeWidth=".5" opacity=".6" />)}
    {[270, 352].map((x) => <g key={x}>
      <rect x={x} y="166" width="22" height="24" fill={glow ? '#ffcf7a' : tint('#3b2a1e')} opacity={glow ? 0.55 + 0.4 * lit : 1} />
      <path d={`M${x + 11} 166 V190`} stroke={tint('#6b4a2e')} strokeWidth="1" />
      {[x - 9, x + 22].map((sx) => <g key={sx}>
        <rect x={sx} y="166" width="9" height="24" fill={tint('#8f5a30')} />
        {Array.from({ length: 7 }, (_, k) => <line key={k} x1={sx + 1} y1={168.5 + k * 3} x2={sx + 8} y2={168.5 + k * 3} stroke={tint('#6e4322')} strokeWidth=".6" />)}
      </g>)}
      {/* A carved panel of kerawang above the window. */}
      <rect x={x - 1} y="161.5" width="24" height="3.4" fill={tint('#c99a5c')} />
      {[0, 1, 2, 3, 4].map((k) => <circle key={k} cx={x + 2.4 + k * 4.4} cy="163.2" r=".9" fill={tint('#7a4a26')} />)}
    </g>)}
    <rect x="312" y="168" width="22" height="28" fill={glow ? '#ffd68a' : tint('#4a3222')} opacity={glow ? 0.5 + 0.4 * lit : 1} />
    <rect x="312" y="168" width="22" height="28" fill="none" stroke={tint('#6b4a2e')} strokeWidth="1.2" />
    {/* The railing along the front of the house. */}
    <rect x="252" y="188" width="146" height="1.6" fill={tint('#6e4322')} />
    {Array.from({ length: 29 }, (_, i) => <rect key={i} x={254 + i * 5} y="189.5" width="1.4" height="6.5" fill={tint('#7f5530')} />)}
    {/* The roof: a tall gable, its face boarded in a sunburst, crossed boards at the peak. */}
    <path d="M244 166 L325 96 L406 166 Z" fill={tint('#7c3b28')} />
    <path d="M262 161 L325 106 L388 161 Z" fill={tint('#c79a5c')} />
    {rays.map((t, i) => { const u = t < 0.5 ? t * 2 : (t - 0.5) * 2; const x = t < 0.5 ? lerp(262, 325, u) : lerp(325, 388, u); const y = t < 0.5 ? lerp(161, 106, u) : lerp(106, 161, u); return <line key={i} x1="325" y1="159" x2={x.toFixed(1)} y2={y.toFixed(1)} stroke={tint('#a7783f')} strokeWidth=".9" />; })}
    <circle cx="325" cy="150" r="5" fill={tint('#a7783f')} />
    <path d="M244 166 L325 96 L406 166" fill="none" stroke={tint('#5a2a1c')} strokeWidth="2.6" strokeLinejoin="round" />
    {Array.from({ length: 16 }, (_, i) => { const t = (i + 0.5) / 16; const x = lerp(246, 404, t); const y = 166 - (1 - Math.abs(t - 0.5) * 2) * 70; return <circle key={i} cx={x} cy={y + 2.6} r="1.3" fill={tint('#e8c48a')} />; })}
    <path d="M318 89 L332 103 M332 89 L318 103" stroke={tint('#5a2a1c')} strokeWidth="2.2" strokeLinecap="round" />
    {/* Steps down to the garden, their risers set with Melaka tiles. */}
    <path d="M262 198 L246 243 M272 198 L258 243" stroke={tint('#6b4a2e')} strokeWidth="2" />
    {[0, 1, 2, 3, 4].map((k) => { const y = 206 + k * 8.4; const x = lerp(260, 248, k / 4); return <g key={k}>
      <rect x={x - 1} y={y} width="13" height="2.2" fill={tint('#8f5f32')} />
      {[0, 1, 2].map((j) => <rect key={j} x={x + j * 4} y={y + 2.2} width="3.6" height="2.4" fill={tint(['#2f6fb0', '#e2b33c', '#3f9a6e'][(j + k) % 3])} />)}
    </g>; })}
    {on('bougainvillea') && <Bougainvillea tint={tint} className={arrive('bougainvillea')} />}
  </g>;
}

export function SteppingStones({ tint, className }: { tint: Tint; className: string }) {
  const stones = [292, 279, 267, 256, 247].map((y, i) => { const p = kampungPath(y); return [p.x + (i % 2 ? 3 : -3), y, p.half * 0.55, lerp(2.6, 5, (y - 244) / 50)]; });
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
  return <g transform="translate(40 238) scale(.78)"><g className={className}>
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

export function Banana({ x, y = 246, tint }: { x: number; y?: number; tint: Tint }) {
  return <g transform={`translate(${x} ${y})`}><g className="lg-sway slow">
    <path d="M-1.6 0 C-2 -12 -1 -24 0 -32 L2 -32 C2.4 -24 2.6 -12 1.6 0 Z" fill={tint('#7f9a4f')} />
    {[-140, -100, -60, -25, 15].map((a, i) => <path key={a} transform={`translate(1 -31) rotate(${a})`} d="M0 0 C6 -5 16 -5 24 0 C16 2 6 3 0 0 Z" fill={tint(i % 2 ? '#5f8f3c' : '#71a447')} />)}
    <path d="M1 -31 C4 -26 4 -20 3 -16" stroke={tint('#6b4a2b')} strokeWidth="1" fill="none" />
    {[0, 1, 2].map((k) => <ellipse key={k} cx={3 + (k % 2)} cy={-24 + k * 2.6} rx="2.6" ry="1.2" fill={tint('#d8c24a')} />)}
  </g></g>;
}

export function DoveCage({ tint, className }: { tint: Tint; className: string }) {
  return <g transform="translate(200 256)"><g className={className}>
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
  return <g transform={`translate(372 293) scale(${(0.44 + 0.14 * growth).toFixed(3)})`}><g className={className}>
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
  return <g transform="translate(62 257)"><g className={className}>
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
  return <g transform="translate(322 240)"><g className={className}>
    <ellipse cy="1" rx="20" ry="2.6" fill="#000" opacity=".14" />
    {[-15, -5, 5, 15].map((lx) => <rect key={lx} x={lx - 1} y="-7" width="2" height="7" fill={tint('#7a5234')} />)}
    <path d="M-18 -8 L18 -8 L15 -11 L-15 -11 Z" fill={tint('#b88a58')} />
    {[-12, -6, 0, 6, 12].map((slat) => <line key={slat} x1={slat} y1="-11" x2={slat * 1.1} y2="-8" stroke={tint('#8f6840')} strokeWidth=".5" />)}
    <path d="M-6 -11.6 Q-2 -14 4 -11.6" stroke={tint('#c9472f')} strokeWidth="2" fill="none" strokeLinecap="round" />
  </g></g>;
}

export function Coconut({ tint, className }: { tint: Tint; className: string }) {
  return <g transform="translate(390 214)"><g className={className}>
    <path d="M0 0 C1 -28 -6 -60 -16 -86 L-19.5 -85 C-10 -60 -4 -30 -4 0 Z" fill={tint('#8f7656')} />
    {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${-1 - i * 1.3} ${-i * 7.2} l-4 -1.2`} stroke={tint('#6e5a40')} strokeWidth=".7" />)}
    <g transform="translate(-18 -86)"><g className="lg-sway slow">
      {[-170, -140, -110, -80, -50, -20, 8, 30].map((angle, i) => <path key={i} transform={`rotate(${angle})`} d="M0 0 C12 -4 26 -2 36 6 C25 2 12 2 0 0 Z" fill={tint(i % 2 ? '#4f7f3a' : '#64944a')} />)}
      {[[-2, 4], [2.6, 5], [0, 7.4]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="2.8" fill={tint(i === 2 ? '#7a8f3a' : '#6c8435')} />)}
    </g></g>
  </g></g>;
}

export function PelitaRow({ tint, glow, lit, className }: { tint: Tint; glow: string; lit: number; className: string }) {
  // Bamboo pelita lining the path, as they are at Raya.
  const spots = [252, 266, 281, 296].flatMap((y) => { const p = kampungPath(y); return [{ x: p.x - p.half - 5, y }, { x: p.x + p.half + 5, y }]; });
  return <g className={className}>{spots.map(({ x, y }, i) => { const k = lerp(0.7, 1.15, (y - 252) / 44); return <g key={i} transform={`translate(${x.toFixed(1)} ${y}) scale(${k.toFixed(2)})`}>
    <rect x="-.8" y="-26" width="1.6" height="26" fill={tint('#a9894f')} />
    {[-20, -12, -4].map((ny) => <rect key={ny} x="-1" y={ny} width="2" height=".7" fill={tint('#7f6538')} />)}
    {lit > 0 && <circle className="lg-flicker" style={{ animationDelay: `${i * 0.27}s` }} cy="-30" r="8" fill={glow} opacity={lit} />}
    <path d="M-1.8 -26 H1.8 L1.2 -28 H-1.2 Z" fill={tint('#6a4a2b')} />
    <path className={lit > 0 ? 'lg-flicker' : undefined} d="M0 -28 C-1.4 -30 -.6 -32 0 -33.4 C.6 -32 1.4 -30 0 -28 Z" fill={lit > 0 ? '#ffcf5a' : tint('#6a4a2b')} />
  </g>; })}</g>;
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
  // Spilling over the railing by the steps and down the first post.
  const blooms = useMemo(() => {
    const random = seeded(19);
    return Array.from({ length: 70 }, (_, i) => i < 50
      ? { x: lerp(250, 312, random()), y: lerp(182, 192, random()) + Math.max(0, (random() - 0.55) * 14), r: lerp(1.4, 2.5, random()), pink: random() < 0.7 }
      : { x: 262 + (random() - 0.5) * 9, y: lerp(196, 232, random()), r: lerp(1.2, 2.2, random()), pink: random() < 0.7 });
  }, []);
  return <g className={className}>
    <path d="M248 186 C266 180 296 180 314 186 L314 194 C296 196 266 196 250 194 Z" fill={tint('#4f7a3a')} />
    <path d="M262 194 C258 206 266 218 260 234" stroke={tint('#4f7a3a')} strokeWidth="3" fill="none" />
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
  const trim = golden ? gold : '#c08a52';
  return <g className={`lg-frame${golden ? ' golden' : ''}${className}`} fill="none" pointerEvents="none">
    {/* The window's shutters, folded open against the frame. */}
    {[0, 1].map((side) => <g key={side} transform={side ? 'translate(400 0) scale(-1 1)' : undefined}>
      <path d="M0 40 Q0 14 14 13 V300 H0 Z" fill="#8f5a30" />
      {Array.from({ length: 26 }, (_, k) => <line key={k} x1="1.5" y1={30 + k * 10.4} x2="12.5" y2={33 + k * 10.4} stroke="#6e4322" strokeWidth="1.2" />)}
      <path d="M14 13 V300" stroke="#5a3519" strokeWidth="1.2" />
    </g>)}
    <path d={KAMPUNG_FRAME} stroke={wood} strokeWidth={golden ? 4.2 : 3.4} />
    <path d="M5 300 L5 45 Q5 15 35 15 L365 15 Q395 15 395 45 L395 300" stroke={trim} strokeWidth=".7" opacity=".85" />
    {/* A carved cloud scroll (awan larat) at the head of the window. */}
    <g transform="translate(200 10)" stroke={trim} strokeWidth="1" strokeLinecap="round">
      <path d="M-26 0 C-20 -6 -12 -6 -10 -1 C-9 2 -13 3 -14 0" /><path d="M26 0 C20 -6 12 -6 10 -1 C9 2 13 3 14 0" />
      <path d="M-6 -1 C-3 -5 3 -5 6 -1" /><circle cy="-4" r="1.3" fill={trim} stroke="none" />
    </g>
  </g>;
}
