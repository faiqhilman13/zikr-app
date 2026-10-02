import { useMemo } from 'react';
import { maturity } from './growth';
import { mix, type Tint } from './palette';
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

export function AndalusiaFar({ palette, tint, lit }: Ctx) {
  const snow = palette.night ? '#c9d2e8' : '#f6f8fb';
  const peaks: [number, number][] = [[96, 112], [150, 104], [210, 98], [270, 106], [340, 102], [400, 112]];
  const red = tint(mix('#b8673f', palette.wall, 0.15));
  const redShade = tint('#9a5232');
  // The towers of the Alhambra along the Sabika hill, from the Comares to the Vela.
  const towers: [number, number, number][] = [[198, 10, 150], [224, 9, 152], [250, 12, 147], [276, 9, 151], [328, 10, 147], [348, 13, 141], [374, 15, 136], [394, 10, 145]];
  const windowFill = lit > 0 ? '#ffd28a' : tint('#4a2a1e');
  return <>
    {/* The Sierra Nevada, snow on its peaks. */}
    <path d="M0 150 L30 132 L58 140 L96 112 L120 124 L150 104 L176 118 L210 98 L240 116 L270 106 L300 122 L340 102 L372 120 L400 112 L400 190 L0 190 Z" fill={mix(palette.hillFar, '#8fa0bf', 0.3)} />
    {peaks.map(([x, y]) => <path key={x} d={`M${x - 12} ${y + 10} L${x} ${y} L${x + 12} ${y + 10} L${x + 6} ${y + 8} L${x + 2} ${y + 12} L${x - 3} ${y + 8} L${x - 7} ${y + 11} Z`} fill={snow} opacity=".9" />)}
    {/* The Sabika hill, wooded below the walls. */}
    <path d="M0 186 C40 176 90 170 140 168 C200 164 250 166 300 164 C340 162 380 164 400 166 L400 200 L0 200 Z" fill={mix(palette.hillNear, '#6f8a52', 0.3)} />
    {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={6 + i * 15.4} cy={178 + (i % 3) * 3 - (i > 12 ? 6 : 0)} r={4 + (i % 2) * 1.6} fill={mix(palette.hillNear, '#3f5a32', 0.45)} />)}
    {/* The Albaicín across the valley: white houses, tiled roofs. */}
    {Array.from({ length: 12 }, (_, i) => { const x = 4 + i * 8; const y = 182 + (i % 3) * 3; return <g key={`h${i}`}>
      <rect x={x} y={y} width="7" height="6" fill={tint(palette.night ? '#8a90a8' : '#f2ede4')} />
      <path d={`M${x - .6} ${y} L${x + 3.5} ${y - 2.4} L${x + 7.6} ${y} Z`} fill={tint('#b5603e')} />
      {i % 3 === 1 && <rect x={x + 2.6} y={y + 2} width="1.6" height="2" fill={windowFill} />}
    </g>; })}
    {/* The Generalife: a white pavilion with its arcade, among cypresses. */}
    <g>
      {[104, 112, 160, 168, 176].map((x, i) => <path key={x} d={`M${x} 172 C${x - 3} 164 ${x - 2.4} 154 ${x} ${146 + (i % 2) * 4} C${x + 2.4} 154 ${x + 3} 164 ${x} 172 Z`} fill={mix(palette.hillNear, '#2a4a30', 0.6)} />)}
      <rect x="120" y="156" width="34" height="14" fill={tint(palette.night ? '#9aa0b8' : '#f4efe6')} />
      <path d="M118 156 L137 150 L156 156 Z" fill={tint('#b5603e')} />
      {[124, 130, 136, 142, 148].map((x) => <path key={x} d={`M${x} 170 V164 A2.2 2.2 0 0 1 ${x + 4.4} 164 V170 Z`} fill={tint(palette.night ? '#4a5070' : '#c9bfae')} />)}
    </g>
    {/* The Alhambra: red walls, crenellated, and its towers. */}
    <path d={`M188 172 L188 158 ${Array.from({ length: 53 }, () => `h2 v-2 h2 v2`).join(' ')} L400 158 L400 176 L188 176 Z`} fill={red} />
    <path d="M190 166 H400" stroke={redShade} strokeWidth=".6" opacity=".6" />
    {/* Palace roofs behind the walls. */}
    {[[232, 14], [262, 12], [312, 14]].map(([x, w]) => <path key={x} d={`M${x} 158 L${x + w / 2} 153 L${x + w} 158 Z`} fill={tint('#a8533a')} />)}
    {towers.map(([x, w, top]) => <g key={x}>
      <rect x={x - w / 2} y={top} width={w} height={176 - top} fill={red} />
      <rect x={x + w / 2 - 2} y={top} width="2" height={176 - top} fill={redShade} opacity=".5" />
      {Array.from({ length: Math.floor(w / 3) }, (_, k) => <rect key={k} x={x - w / 2 + k * 3 + 0.4} y={top - 2} width="1.8" height="2" fill={red} />)}
      <path d={`M${x - 1} ${top + 7} V${top + 5} A1 1 0 0 1 ${x + 1} ${top + 5} V${top + 7} Z`} fill={windowFill} />
    </g>)}
    {/* The Comares tower, tallest, with paired windows. */}
    <g>
      <rect x="292" y="132" width="24" height="44" fill={red} />
      <rect x="312" y="132" width="4" height="44" fill={redShade} opacity=".5" />
      {Array.from({ length: 8 }, (_, k) => <rect key={k} x={292.4 + k * 3} y="129.6" width="1.8" height="2.4" fill={red} />)}
      {[296, 306].map((x) => <g key={x}>
        <path d={`M${x} 146 V141 A2 2 0 0 1 ${x + 4} 141 V146 Z`} fill={windowFill} />
        <path d={`M${x + 2} 141 V146`} stroke={red} strokeWidth=".6" />
      </g>)}
      <rect x="295" y="154" width="18" height="1.2" fill={redShade} opacity=".6" />
    </g>
    {/* The bell on the Torre de la Vela. */}
    <g transform="translate(374 136)">
      <path d="M-3 0 V-6 A3 3 0 0 1 3 -6 V0" fill="none" stroke={redShade} strokeWidth="1" />
      <path d="M-1.4 -1 C-1.4 -4 1.4 -4 1.4 -1 Z" fill={tint('#8a6a3a')} />
    </g>
  </>;
}

export function AndalusiaWall({ tint, palette, url, on, arrive, lit }: Ctx) {
  return <>
    {on('cypresses') && <g className={arrive('cypresses')}><Cypress x={74} tint={tint} /><Cypress x={318} tint={tint} tall /></g>}
    {on('palm') && <Palm tint={tint} className={`lg-palm${arrive('palm')}`} />}
    <rect y="194" width={W} height="22" fill={tint(palette.wall)} />
    <rect y="194" width={W} height="2.4" fill={tint(palette.wallShade)} />
    <rect y="199" width={W} height="8" fill={url('tiles')} />
    {/* A band of carved plaster (sebka) above the tiles. */}
    <rect y="207" width={W} height="7" fill={tint(palette.wall)} />
    <path d={Array.from({ length: 67 }, (_, i) => `M${i * 6} 213 L${i * 6 + 3} 208 L${i * 6 + 6} 213`).join(' ')} stroke={tint(palette.wallShade)} strokeWidth=".6" fill="none" />
    <path d={Array.from({ length: 67 }, (_, i) => `M${i * 6 + 3} 213 L${i * 6 + 6} 208`).join(' ')} stroke={tint(palette.wallShade)} strokeWidth=".35" fill="none" opacity=".7" />
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
      {/* Myrtle hedges along the pool, as in the Court of the Myrtles. */}
      {[[24, 168], [232, 376]].map(([x0, x1]) => <g key={x0}>
        <rect x={x0} y="232" width={x1 - x0} height="5.4" rx="2.6" fill={tint('#3d6a3a')} />
        <path d={`M${x0 + 2} 233.4 ${Array.from({ length: Math.floor((x1 - x0 - 4) / 5) }, () => 'q2.5 -2 5 0').join(' ')}`} fill={tint('#4f7f46')} />
      </g>)}
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

/** The Fountain of the Lions: a twelve-sided basin carried on twelve lions, water from each mouth. */
function Fountain({ tint, motion, water, className }: { tint: Tint; motion: boolean; water: string; className: string }) {
  const lions = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
    return { x: Math.cos(a) * 15, y: Math.sin(a) * 3.6, front: Math.sin(a) > 0, flip: Math.cos(a) < 0, a };
  });
  const lion = ({ x, y, flip }: { x: number; y: number; flip: boolean }, i: number) => <g key={i} transform={`translate(${x.toFixed(1)} ${(y - 1).toFixed(1)}) scale(${flip ? -1 : 1} 1)`}>
    <path d="M-3.6 0 V-3.2 C-3.6 -4.6 -1 -5 1 -4.6 L1 0 Z" fill={tint('#e2d6c0')} />
    <circle cx="2.2" cy="-5" r="2.6" fill={tint('#d8cab0')} />
    <path d="M2.2 -7.4 C4 -7.4 5.2 -6 5 -4.4 L3.4 -3.6 Z" fill={tint('#e9dfcb')} />
    <circle cx="3.6" cy="-5.6" r=".35" fill={tint('#6e6250')} />
    <path d="M-3 0 V-1.6 M-1 0 V-1.6 M.6 0 V-1.6" stroke={tint('#b9ab92')} strokeWidth=".4" />
  </g>;
  const dodecagon = (rx: number, ry: number) => Array.from({ length: 12 }, (_, k) => { const t = (k / 12) * Math.PI * 2; return `${(Math.cos(t) * rx).toFixed(1)} ${(Math.sin(t) * ry).toFixed(1)}`; }).join(' L');
  return <g transform="translate(88 258)"><g className={className}>
    <ellipse cy="4" rx="33" ry="5.5" fill="#000" opacity=".15" />
    <ellipse cy="1" rx="31" ry="5.6" fill={tint('#e9e0cf')} />
    <ellipse cy="1" rx="28" ry="4.4" fill={water} />
    {motion && [0, 1, 2].map((i) => <ellipse key={i} className="lg-ripple" style={{ animationDelay: `${i * 1.1}s` }} cy="1" rx="12" ry="2" fill="none" stroke="#fff" strokeWidth=".5" />)}
    {lions.filter((l) => !l.front).map(lion)}
    <rect x="-3.4" y="-16" width="6.8" height="14" fill={tint('#e4d9c4')} />
    <path d={`M${dodecagon(16, 3.8)} Z`} transform="translate(0 -12)" fill={tint('#efe6d4')} />
    <path d={`M-16 -12 L-14 -9 H14 L16 -12`} fill={tint('#ddd1bb')} />
    <path d={`M${dodecagon(13.4, 2.8)} Z`} transform="translate(0 -12.4)" fill={water} />
    <rect x="-1.6" y="-22" width="3.2" height="9" fill={tint('#e4d9c4')} />
    <ellipse cy="-22" rx="5" ry="1.3" fill={tint('#efe6d4')} />
    {lions.filter((l) => l.front).map(lion)}
    <g className={motion ? 'lg-water' : undefined} fill="none" stroke="#dff2ff" strokeWidth=".7" strokeLinecap="round" opacity=".9">
      <path d="M0 -23 C-2 -28 -5 -26 -6 -21" /><path d="M0 -23 C2 -28 5 -26 6 -21" /><path d="M0 -23 V-29" />
      {lions.filter((l) => l.front).map((l, i) => { const ex = l.x + (l.flip ? -5 : 5); return <path key={i} d={`M${ex.toFixed(1)} ${(l.y - 5).toFixed(1)} Q${(ex + (l.flip ? -4 : 4)).toFixed(1)} ${(l.y - 6).toFixed(1)} ${(ex + (l.flip ? -6 : 6)).toFixed(1)} ${(l.y + 1).toFixed(1)}`} />; })}
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

/* The arch's inner edge, scalloped as Nasrid arches are. */
const SCALLOPS = (() => {
  const r = 228.4; const steps = 18;
  const side = (cx: number, from: number, to: number) => Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
    return { x: cx + Math.cos(a) * r, y: 235 + Math.sin(a) * r };
  });
  const left = side(199.2, -147.5, -90.2);
  const right = side(200.8, -89.8, -32.5);
  const arcs = (points: { x: number; y: number }[]) => points.slice(1).map((p) => `A4 4 0 0 0 ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return `M${left[0].x.toFixed(1)} ${left[0].y.toFixed(1)} ${arcs(left)} M${right[0].x.toFixed(1)} ${right[0].y.toFixed(1)} ${arcs(right)}`;
})();

export function ArchFrame({ gold, golden, className }: { gold: string; golden: boolean; className: string }) {
  const stroke = golden ? gold : 'var(--gold)';
  return <g className={`lg-frame${golden ? ' golden' : ''}${className}`} fill="none" pointerEvents="none">
    <path d={ARCH} stroke={stroke} strokeWidth={golden ? 3.2 : 1.6} />
    <path d="M5 300 L5 117 A227 227 0 0 1 200 9 A227 227 0 0 1 395 117 L395 300" stroke={stroke} strokeWidth=".6" opacity=".7" />
    {/* A band of inscription in the arch, and its scalloped edge. */}
    <path d="M2.6 300 L2.6 116.5 A229.5 229.5 0 0 1 200 6 A229.5 229.5 0 0 1 397.4 116.5 L397.4 300" stroke={stroke} strokeWidth="1.6" strokeDasharray="4 1.4 1 1.4 2 1.4" opacity=".55" />
    <path d={SCALLOPS} stroke={stroke} strokeWidth=".9" opacity=".8" />
    <g transform="translate(200 3)"><path d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z" fill={stroke} stroke="none" /><rect x="-4" y="-4" width="8" height="8" transform="rotate(45)" fill="none" stroke={stroke} strokeWidth=".6" /></g>
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
