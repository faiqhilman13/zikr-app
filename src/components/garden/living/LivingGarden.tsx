import { useId, useMemo, useState } from 'react';
import { blossomShare, flowerCount, FLOWER_SLOTS, fruitShare, isUnlocked, leafShare, maturity, timeOfDay, type UnlockId } from './growth';
import { mix, PALETTES, tinter, type Tint } from './palette';
import { clamp01, lerp, seeded } from './random';
import { branchGrowth, branchOutline, growOlive, pointOn, type Tree } from './tree';

/**
 * The living garden: an olive courtyard seen through an arch. Today's tree fills with leaf,
 * blossom and fruit as the day's intention is kept; every completed day plants a flower,
 * matures the tree and, at milestones, adds something that stays. It is drawn entirely in
 * SVG so it stays sharp at any size and every part of it can move.
 */

export interface LivingGardenProps {
  /** Share of today's intention done, 0..1. */
  ratio: number;
  /** Days tended to half the intention or more: flowers and arrivals. */
  tended: number;
  /** Days the intention was completed: the olive's growth. */
  full: number;
  /** An arrival to bring the camera in on, or null for the whole garden. */
  focus?: UnlockId | null;
  /** A small round view of just the tree, for beside the counter. */
  mini?: boolean;
  now: Date;
  /** The intention was completed during this visit: play the arrival of the birds. */
  celebrate: boolean;
  /** Animation allowed (off for reduced motion). */
  motion: boolean;
  /** Parts that arrived since the garden was last seen, to be shown arriving. */
  fresh: readonly UnlockId[];
  /** A flower was planted since the garden was last seen. */
  freshFlower: boolean;
  label: string;
}

const W = 400;
const H = 300;
const ARCH = 'M0 300 L0 116 A232 232 0 0 1 200 3 A232 232 0 0 1 400 116 L400 300 Z';
const TREE_BASE = { x: 200, y: 266 };

const OLIVE = growOlive(11, 6);
const POMEGRANATE = growOlive(29, 4);

const LEAF = 'M0 0 C1.7 -2.2 1.7 -6.4 0 -9 C-1.7 -6.4 -1.7 -2.2 0 0 Z';
const SPRAYS = [
  [-72, -38, -10, 16, 44, 78],
  [-60, -26, 4, 30, 62, 96, -100],
  [-84, -50, -18, 12, 40, 70]
];

type Slot = { x: number; y: number; species: number; height: number; planted: number; sway: number };
const FLOWER_BEDS: Slot[] = (() => {
  const random = seeded(101);
  const slots: Slot[] = [];
  while (slots.length < FLOWER_SLOTS) {
    const left = slots.length % 2 === 0;
    const y = lerp(258, 297, random());
    // The path narrows towards the tree, so the beds reach further in at the back.
    const inner = lerp(176, 150, (y - 258) / 39);
    const x = left ? lerp(10, inner, random()) : lerp(W - inner, W - 10, random());
    if (slots.some((slot) => Math.hypot(slot.x - x, (slot.y - y) * 1.6) < 9)) continue;
    slots.push({ x, y, species: Math.floor(random() * 6), height: lerp(9, 16, random()), planted: 0, sway: random() });
  }
  // Planted in a scattered order, drawn back to front.
  const order = slots.map((_, i) => i).sort(() => random() - 0.5);
  order.forEach((slot, rank) => { slots[slot].planted = rank; });
  return slots.sort((a, b) => a.y - b.y);
})();

const STARS = (() => {
  const random = seeded(7);
  return Array.from({ length: 46 }, () => ({ x: random() * W, y: random() * 150 + 6, r: lerp(0.35, 1.1, random()), twinkle: random() < 0.4, delay: random() * 4 }));
})();

const FIREFLIES = (() => {
  const random = seeded(3);
  return Array.from({ length: 11 }, () => ({ x: lerp(30, 370, random()), y: lerp(150, 270, random()), delay: random() * 6, drift: random() }));
})();

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

/** Sun or moon position for the hour: rises on the left, sets on the right. */
function sunAt(now: Date) {
  const hour = now.getHours() + now.getMinutes() / 60;
  const t = clamp01((hour - 5) / 15);
  return { x: lerp(40, 360, t), y: 150 - Math.sin(t * Math.PI) * 112 };
}

export function LivingGarden({ ratio, tended, full, now, celebrate, motion, fresh, freshFlower, label, focus = null, mini = false }: LivingGardenProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ref = (name: string) => `${id}-${name}`;
  const url = (name: string) => `url(#${ref(name)})`;
  const time = timeOfDay(now);
  const palette = PALETTES[time];
  const tint = tinter(palette);
  const growth = maturity(full);
  const days = tended;
  const unlocked = (unlock: UnlockId) => isUnlocked(unlock, days);
  const arrive = (unlock: UnlockId) => (fresh.includes(unlock) ? ' lg-arrive' : '');
  const sun = sunAt(now);
  const complete = ratio >= 1;

  // Leaves already out when the garden first appears fill in with a quick stagger; any
  // that arrive later, with a tap, pop in at once.
  const [firstLeaves] = useState(() => Math.round(OLIVE.anchors.length * leafShare(ratio)));

  const zoom = focus ? zoomTo(focusBox(focus, growth)) : null;
  const viewBox = mini ? crownView(growth) : `0 0 ${W} ${H}`;

  return <svg className={`living-garden${motion ? '' : ' still'}${mini ? ' mini' : ''}${complete ? ' complete' : ''} time-${time}`} viewBox={viewBox} role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
    <defs>
      <clipPath id={ref('arch')}><path d={ARCH} /></clipPath>
      <linearGradient id={ref('sky')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={palette.skyTop} /><stop offset="1" stopColor={palette.skyBottom} /></linearGradient>
      <linearGradient id={ref('soil')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={tint('#6f5238')} /><stop offset="1" stopColor={tint('#8c6a47')} /></linearGradient>
      <linearGradient id={ref('ground')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={palette.groundTop} /><stop offset="1" stopColor={palette.groundBottom} /></linearGradient>
      <radialGradient id={ref('sun')}><stop offset="0" stopColor={palette.glow} stopOpacity=".95" /><stop offset=".35" stopColor={palette.glow} stopOpacity=".45" /><stop offset="1" stopColor={palette.glow} stopOpacity="0" /></radialGradient>
      <radialGradient id={ref('lamp')}><stop offset="0" stopColor="#ffe3a0" stopOpacity=".95" /><stop offset=".3" stopColor="#ffb54d" stopOpacity=".45" /><stop offset="1" stopColor="#ff9a2e" stopOpacity="0" /></radialGradient>
      <radialGradient id={ref('bloom')}><stop offset="0" stopColor="#fff2c2" stopOpacity=".9" /><stop offset=".45" stopColor="#ffd46e" stopOpacity=".35" /><stop offset="1" stopColor="#ffc24a" stopOpacity="0" /></radialGradient>
      <radialGradient id={ref('firefly')}><stop offset="0" stopColor="#fbffc8" /><stop offset=".3" stopColor="#e8ff7a" stopOpacity=".7" /><stop offset="1" stopColor="#d4ff5a" stopOpacity="0" /></radialGradient>
      <linearGradient id={ref('water')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mix(palette.skyBottom, '#5aa6c8', 0.45)} /><stop offset="1" stopColor={mix(palette.skyTop, '#2d6f96', 0.4)} /></linearGradient>
      <linearGradient id={ref('gold')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6dc8e" /><stop offset=".5" stopColor="#d4a017" /><stop offset="1" stopColor="#f1d17e" /></linearGradient>
      <pattern id={ref('tiles')} width="12" height="8" patternUnits="userSpaceOnUse">
        <rect width="12" height="8" fill={tint(palette.tile)} />
        <path d="M6 .8 L7.2 2.8 L9.4 2.6 L8.6 4 L9.4 5.4 L7.2 5.2 L6 7.2 L4.8 5.2 L2.6 5.4 L3.4 4 L2.6 2.6 L4.8 2.8 Z" fill={tint('#f4ecdf')} />
        <circle cx="6" cy="4" r="1" fill={tint('#e2b33c')} />
        <path d="M0 0 L1.4 0 L0 1.4 Z M12 0 L10.6 0 L12 1.4 Z M0 8 L1.4 8 L0 6.6 Z M12 8 L10.6 8 L12 6.6 Z" fill={tint('#2f8a6e')} />
      </pattern>
      {SPRAYS.map((angles, variant) => <g key={variant} id={ref(`spray${variant}`)}>
        {angles.map((angle, i) => <path key={i} d={LEAF} transform={`rotate(${angle}) translate(0 -${1.2 + (i % 2)})`} fill={i % 3 === 1 ? tint('#c9d2b9') : 'currentColor'} opacity={i % 3 === 1 ? 0.85 : 1} />)}
      </g>)}
      <g id={ref('blossom')}>{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} rx="1.05" ry="1.7" cy="-1.5" transform={`rotate(${a})`} fill={tint('#fbf6e4')} />)}<circle r=".8" fill={tint('#e9c44f')} /></g>
      <FlowerHeads tint={tint} prefix={ref('flower')} />
      <g id={ref('bird')}>
        <path d="M-5 0 C-3 -3.2 2 -3.4 4.2 -1.2 L6.4 -1.6 L4.8 0.2 C3 2.2 -2.8 2.4 -5 0 Z" fill={tint('#5b4a3f')} />
        <path d="M-1.5 -1 C0 -4.5 2.5 -4.2 3.5 -2" fill="none" stroke={tint('#3e322b')} strokeWidth=".9" strokeLinecap="round" />
        <circle cx="3.2" cy="-1.4" r=".45" fill="#111" />
        <path d="M2 0.8 C1.4 2.3 0.2 2.5 -0.6 1.8" fill={tint('#d98a52')} />
      </g>
    </defs>

    <g clipPath={mini ? undefined : url('arch')}>
      <g className="lg-zoom" style={{ transform: zoom ? `translate(${zoom.x.toFixed(1)}px, ${zoom.y.toFixed(1)}px) scale(${zoom.k.toFixed(3)})` : 'none' }}>
      {/* Sky, light and weather */}
      <rect width={W} height={H} fill={url('sky')} />
      {palette.stars > 0 && <g className="lg-stars" opacity={palette.stars}>{STARS.map((star, i) => <circle key={i} className={star.twinkle ? 'lg-twinkle' : undefined} style={{ animationDelay: `${star.delay}s` }} cx={star.x} cy={star.y} r={star.r} fill="#f4f1ff" />)}</g>}
      {palette.night
        ? <g transform="translate(312 64)">
          <circle r="34" fill={url('sun')} opacity=".6" />
          <path d="M0 -13 A13 13 0 1 0 9.5 8.9 A10.5 10.5 0 1 1 0 -13 Z" fill="#f6f0d8" />
        </g>
        : <g transform={`translate(${sun.x} ${sun.y})`}><circle r="46" fill={url('sun')} /><circle r="11" fill={palette.glow} /></g>}
      <g className="lg-clouds" opacity={palette.night ? 0.25 : 0.9}>
        <Cloud className="lg-cloud a" x={40} y={48} scale={1} fill={mix(palette.skyBottom, '#ffffff', 0.7)} />
        <Cloud className="lg-cloud b" x={250} y={30} scale={0.75} fill={mix(palette.skyBottom, '#ffffff', 0.6)} />
        <Cloud className="lg-cloud c" x={150} y={84} scale={0.55} fill={mix(palette.skyBottom, '#ffffff', 0.5)} />
      </g>

      {/* The land beyond the wall */}
      <path d="M0 176 C40 150 90 158 130 168 C180 150 230 146 280 162 C320 150 360 152 400 164 L400 210 L0 210 Z" fill={palette.hillFar} />
      <Skyline fill={palette.skyline} />
      <path d="M0 192 C50 176 110 184 160 190 C220 180 280 178 330 188 C360 182 385 184 400 186 L400 212 L0 212 Z" fill={palette.hillNear} />
      {unlocked('cypresses') && <g className={arrive('cypresses')}><Cypress x={74} tint={tint} /><Cypress x={318} tint={tint} tall /></g>}
      {unlocked('palm') && <Palm tint={tint} className={`lg-palm${arrive('palm')}`} />}

      {/* The courtyard */}
      <rect y="194" width={W} height="22" fill={tint(palette.wall)} />
      <rect y="194" width={W} height="2.4" fill={tint(palette.wallShade)} />
      <rect y="199" width={W} height="8" fill={url('tiles')} />
      <rect y="214" width={W} height="3" fill={tint(palette.wallShade)} opacity=".7" />
      {unlocked('lanternString') && <LanternString tint={tint} glow={url('lamp')} lit={palette.night ? 1 : time === 'golden' ? 0.6 : 0} className={arrive('lanternString')} />}
      <rect y="216" width={W} height={H - 216} fill={url('ground')} />
      <GroundTexture tint={tint} />
      <Beds tint={tint} url={url('soil')} />

      {unlocked('pool') && <g className={`lg-pool${arrive('pool')}`}>
        <rect x="24" y="221" width="352" height="11" rx="1" fill={tint('#e6dccb')} />
        <rect x="27" y="222.6" width="346" height="7.8" fill={url('water')} />
        {motion && [60, 150, 250, 330].map((x, i) => <rect key={x} className="lg-shimmer" style={{ animationDelay: `${i * 0.9}s` }} x={x} y={225 + (i % 2) * 2.5} width="22" height=".7" rx=".35" fill="#ffffff" opacity=".55" />)}
        <path d="M27 222.6 H373" stroke={tint('#c9bba3')} strokeWidth=".8" />
      </g>}

      {unlocked('path') && <g className={`lg-path${arrive('path')}`}>{PATH_STONES.map((d, i) => <path key={i} d={d} fill={tint(i % 3 ? '#ddd0b8' : '#d2c3a8')} stroke={tint('#b8a88c')} strokeWidth=".5" />)}</g>}

      {unlocked('bench') && <Bench tint={tint} className={arrive('bench')} />}
      {unlocked('pomegranate') && <Pomegranate tint={tint} days={days} className={`lg-pomegranate${arrive('pomegranate')}`} spray={ref('spray1')} />}
      {unlocked('fountain') && <Fountain tint={tint} motion={motion} water={url('water')} className={`lg-fountain${arrive('fountain')}`} />}
      {unlocked('lemons') && <g className={arrive('lemons')}><LemonPot x={172} tint={tint} /><LemonPot x={228} tint={tint} /></g>}
      {unlocked('roses') && <g className={arrive('roses')}><Roses x={26} tint={tint} /><Roses x={374} tint={tint} /></g>}
      {unlocked('lavender') && <g className={`lg-lavender${arrive('lavender')}`}><Lavender x={164} y={262} tint={tint} /><Lavender x={236} y={262} tint={tint} flip /></g>}

      {complete && <circle className="lg-bloom" cx={TREE_BASE.x} cy={TREE_BASE.y - 120 * (0.25 + 0.75 * growth)} r={40 + 90 * growth} fill={url('bloom')} />}
      <Olive tree={OLIVE} tint={tint} growth={growth} ratio={ratio} sprayRef={ref('spray')} blossom={ref('blossom')} firstLeaves={firstLeaves} />
      {unlocked('lantern') && <Lantern tint={tint} glow={url('lamp')} lit={palette.night ? 1 : time === 'golden' ? 0.55 : time === 'dawn' ? 0.3 : 0} className={arrive('lantern')} growth={growth} />}

      {!mini && <g className="lg-flowers">
        {FLOWER_BEDS.map((slot, i) => {
          if (slot.planted === flowerCount(days) && slot.planted < FLOWER_SLOTS) {
            // Tomorrow's flower is already a sprout in its place.
            return <g key={i} transform={`translate(${slot.x.toFixed(1)} ${slot.y.toFixed(1)})`}><g className="lg-flower lg-sprout">
              <path d="M0 0 V-4" stroke={tint('#6d9a4c')} strokeWidth=".9" /><path d="M0 -3.4 C-2.6 -4.6 -3.4 -6.4 -3 -7 C-1.4 -6.6 -.2 -5.2 0 -3.4 Z M0 -3.4 C2.6 -4.6 3.4 -6.4 3 -7 C1.4 -6.6 .2 -5.2 0 -3.4 Z" fill={tint('#7fb05a')} />
            </g></g>;
          }
          if (slot.planted >= flowerCount(days)) return null;
          const newest = freshFlower && slot.planted === flowerCount(days) - 1;
          const scale = lerp(0.85, 1.3, (slot.y - 258) / 39);
          return <g key={i} transform={`translate(${slot.x.toFixed(1)} ${slot.y.toFixed(1)}) scale(${scale.toFixed(2)})`}>
            <g className={`lg-flower${newest ? ' lg-arrive' : ''}`} style={{ animationDelay: `${(-slot.sway * 6).toFixed(2)}s` }}>
              <path d={`M0 0 Q${(slot.sway - 0.5) * 3} ${-slot.height / 2} 0 ${-slot.height}`} stroke={tint('#4f6e3c')} strokeWidth=".9" fill="none" />
              <path d={`M0 ${-slot.height * 0.35} q3 -1.5 4.5 -4 q-3 .4 -4.5 4`} fill={tint('#5f8046')} />
              <use href={`#${ref('flower')}${slot.species}`} y={-slot.height} />
            </g>
          </g>;
        })}
      </g>}

      {unlocked('butterflies') && !mini && <g className={`lg-butterflies${arrive('butterflies')}`}>
        <Butterfly motion={motion} color={tint('#f0a52a')} path="M60 250 C90 210 140 230 120 260 C100 285 50 280 60 250 Z" dur={14} />
        <Butterfly motion={motion} color={tint('#6f8fe6')} path="M300 256 C330 226 370 244 352 270 C334 292 290 282 300 256 Z" dur={17} />
      </g>}

      <Birds bird={ref('bird')} resident={unlocked('songbirds')} visitors={complete} arriving={celebrate && motion} growth={growth} />

      {unlocked('vine') && <Vine tint={tint} className={arrive('vine')} />}

      {unlocked('fireflies') && (palette.night || time === 'golden') && motion && !mini && <g className="lg-fireflies" opacity={palette.night ? 1 : 0.55}>
        {FIREFLIES.map((fly, i) => <g key={i} transform={`translate(${fly.x.toFixed(1)} ${fly.y.toFixed(1)})`}><circle className={`lg-firefly f${i % 3}`} style={{ animationDelay: `${fly.delay.toFixed(2)}s` }} r="4.5" fill={url('firefly')} /></g>)}
      </g>}

      {unlocked('shootingStars') && palette.night && motion && !mini && <g className="lg-shooting">{[0, 1].map((i) => <line key={i} className="lg-shooting-star" style={{ animationDelay: `${i * 7 + 2}s` }} x1={120 + i * 110} y1={30 + i * 18} x2={140 + i * 110} y2={38 + i * 18} stroke="#fff" strokeWidth="1" strokeLinecap="round" />)}</g>}
      {complete && celebrate && motion && !mini && <g className="lg-sparkles">{[[150, 110], [250, 120], [200, 80], [170, 150], [236, 160], [130, 150], [270, 90]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}><path className="lg-sparkle" style={{ animationDelay: `${i * 0.18}s` }} d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" fill="#fff6d0" /></g>)}</g>}
      </g>
    </g>

    {!mini && <ArchFrame gold={url('gold')} golden={unlocked('goldArch')} className={arrive('goldArch')} />}
  </svg>;
}

function Cloud({ x, y, scale, fill, className }: { x: number; y: number; scale: number; fill: string; className: string }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><g className={className}>
    <path d="M0 14 C-2 6 8 2 13 6 C16 -2 30 -3 34 5 C40 0 52 4 50 13 C56 14 56 21 49 22 L3 22 C-4 22 -5 15 0 14 Z" fill={fill} />
  </g></g>;
}

function Skyline({ fill }: { fill: string }) {
  // A far-off town on the hill: domes and a slender minaret, barely there.
  return <g fill={fill} opacity=".55">
    <path d="M246 176 h26 v-8 c0 -8 -13 -13 -13 -13 c0 0 -13 5 -13 13 Z" />
    <path d="M276 176 h14 v-5 c0 -5 -7 -8 -7 -8 c0 0 -7 3 -7 8 Z" />
    <rect x="296" y="142" width="4" height="34" /><path d="M295 142 h6 l-3 -7 Z" /><rect x="295" y="152" width="6" height="1.5" />
    <rect x="240" y="170" width="64" height="7" />
  </g>;
}

/** Two raised beds either side of the path, waiting to be planted from the first day. */
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

function GroundTexture({ tint }: { tint: Tint }) {
  const tufts = useMemo(() => {
    const random = seeded(23);
    return Array.from({ length: 34 }, () => ({ x: random() * 400, y: lerp(222, 296, random()), s: lerp(0.6, 1.2, random()) }));
  }, []);
  return <g stroke={tint('#7d8a4f')} strokeWidth=".7" strokeLinecap="round" fill="none" opacity=".55">
    {tufts.map((tuft, i) => <path key={i} d={`M${tuft.x} ${tuft.y} l${-1.5 * tuft.s} ${-3 * tuft.s} M${tuft.x} ${tuft.y} l0 ${-3.6 * tuft.s} M${tuft.x} ${tuft.y} l${1.5 * tuft.s} ${-3 * tuft.s}`} />)}
  </g>;
}

function FlowerHeads({ tint, prefix }: { tint: Tint; prefix: string }) {
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

const LEAF_TONES = ['#5c774c', '#6b8657', '#7b9463', '#8ba571'];

function Olive({ tree, tint, growth, ratio, sprayRef, blossom, firstLeaves }: {
  tree: Tree; tint: Tint; growth: number; ratio: number; sprayRef: string; blossom: string; firstLeaves: number;
}) {
  const scale = 0.62 + 0.4 * growth;
  const width = 0.22 + 0.78 * Math.pow(growth, 1.2);
  const grown = tree.branches.map((branch) => branchGrowth(branch, growth, tree.maxDepth));
  const ready = tree.anchors.filter((anchor) => grown[anchor.branch] >= anchor.t);
  const leafTarget = Math.round(tree.anchors.length * leafShare(ratio));
  const showing = ready.filter((anchor) => anchor.order < leafTarget);
  const flowering = ready.filter((anchor) => anchor.order % 4 === 1);
  const fruiting = ready.filter((anchor) => anchor.order % 5 === 2);
  const blossoms = Math.round(flowering.length * blossomShare(ratio) * (1 - fruitShare(ratio)));
  const fruit = Math.round(fruiting.length * fruitShare(ratio));
  const ripe = ratio >= 1;
  const trunk = tree.branches[0];
  const young = growth * (tree.maxDepth + 1) < 1.8;
  const tip = pointOn(trunk, grown[0]);

  return <g transform={`translate(${TREE_BASE.x} ${TREE_BASE.y}) scale(${scale.toFixed(3)})`}>
    <ellipse cx="0" cy="2" rx={34 * width + 8} ry="5" fill="#000" opacity=".16" />
    <g className="lg-sway">
      {growth > 0.3 && <path d={`M-${9 * width} 1 C-${16 * width} 4 -${22 * width} 3 -${26 * width} 5 L-${5 * width} 3 Z M${9 * width} 1 C${15 * width} 3 ${20 * width} 3 ${24 * width} 5 L${5 * width} 3 Z`} fill={tint('#56463a')} />}
      {tree.branches.map((branch, i) => grown[i] > 0 && <path key={i} d={branchOutline(branch, grown[i], width)} fill={tint(branch.depth < 2 ? '#6d5a47' : '#76624d')} />)}
      {/* Bark: the twisting grain of old olive wood */}
      {tree.branches.slice(0, 4).map((branch, i) => grown[i] > 0.2 && <path key={i} d={`M${branch.x0 - 2} ${branch.y0} Q${branch.cx - 1} ${branch.cy} ${lerp(branch.x0, branch.x1, grown[i]) - 1} ${lerp(branch.y0, branch.y1, grown[i])}`} stroke={tint('#4d3f33')} strokeWidth={1.2 * width + 0.3} fill="none" opacity=".55" />)}
      {tree.branches.slice(0, 2).map((branch, i) => grown[i] > 0.3 && <path key={i} d={`M${branch.x0 + 3 * width} ${branch.y0} Q${branch.cx + 2} ${branch.cy} ${lerp(branch.x0, branch.x1, grown[i]) + 2} ${lerp(branch.y0, branch.y1, grown[i])}`} stroke={tint('#93806a')} strokeWidth={0.9 * width + 0.2} fill="none" opacity=".45" />)}
      {young && [0, 1, 2, 3].map((i) => <g key={`sprout${i}`} transform={`translate(${tip.x} ${tip.y}) rotate(${-60 + i * 40}) scale(.8)`}><use href={`#${sprayRef}${i % 3}`} className="lg-leaf" style={{ color: tint(LEAF_TONES[i]) }} /></g>)}
      {showing.map((anchor) => <g key={anchor.order} transform={`translate(${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)}) rotate(${anchor.rotate.toFixed(0)}) scale(${anchor.scale.toFixed(2)})`}>
        <use href={`#${sprayRef}${anchor.variant}`} className="lg-leaf" style={{ color: tint(LEAF_TONES[anchor.tone]), animationDelay: anchor.order < firstLeaves ? `${Math.round((anchor.order / Math.max(firstLeaves, 1)) * 900)}ms` : '0ms' }} />
      </g>)}
      {flowering.slice(0, blossoms).map((anchor) => <g key={`b${anchor.order}`} transform={`translate(${(anchor.x + 3).toFixed(1)} ${(anchor.y - 2).toFixed(1)})`}><use href={`#${blossom}`} className="lg-pop" /></g>)}
      {fruiting.slice(0, fruit).map((anchor) => <g key={`f${anchor.order}`} transform={`translate(${(anchor.x - 2).toFixed(1)} ${(anchor.y + 3).toFixed(1)})`}>
        <g className="lg-pop"><ellipse rx="1.9" ry="2.5" fill={tint(ripe ? '#3b2940' : '#7f8f3a')} /><ellipse cx="-.6" cy="-.9" rx=".5" ry=".8" fill="#fff" opacity=".45" /></g>
      </g>)}
    </g>
  </g>;
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

function Fountain({ tint, motion, water, className }: { tint: Tint; motion: boolean; water: string; className: string }) {
  return <g transform="translate(88 256)"><g className={className}>
    <ellipse cy="4" rx="31" ry="5" fill="#000" opacity=".15" />
    <path d="M-30 -2 L-27 5 H27 L30 -2 Z" fill={tint('#e9e0cf')} />
    <path d="M-30 -2 L-27 5 H27 L30 -2 Z" fill="none" stroke={tint('#c4b59b')} strokeWidth=".6" />
    <ellipse cy="-2" rx="30" ry="5.2" fill={tint('#f1ead9')} />
    <ellipse cy="-2" rx="26.5" ry="3.8" fill={water} />
    {motion && [0, 1, 2].map((i) => <ellipse key={i} className="lg-ripple" style={{ animationDelay: `${i * 1.1}s` }} cy="-2" rx="10" ry="1.6" fill="none" stroke="#fff" strokeWidth=".5" />)}
    <rect x="-3" y="-24" width="6" height="22" fill={tint('#e4d9c4')} />
    <path d="M-12 -24 C-10 -20 10 -20 12 -24 Z" fill={tint('#efe6d4')} />
    <ellipse cy="-24" rx="12" ry="2.4" fill={water} stroke={tint('#e7ddc9')} strokeWidth=".8" />
    <path d="M-1.5 -26 C-1.5 -30 1.5 -30 1.5 -26 Z" fill={tint('#e4d9c4')} /><circle cy="-31" r="1.3" fill={tint('#d4a017')} />
    <g className={motion ? 'lg-water' : undefined} fill="none" stroke="#dff2ff" strokeWidth=".9" strokeLinecap="round" opacity=".9">
      <path d="M0 -30 C-4 -38 -12 -30 -13 -23" /><path d="M0 -30 C4 -38 12 -30 13 -23" />
      <path d="M-11 -23 C-15 -18 -18 -10 -19 -3" /><path d="M11 -23 C15 -18 18 -10 19 -3" />
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

function Lantern({ tint, glow, lit, className, growth }: { tint: Tint; glow: string; lit: number; className: string; growth: number }) {
  // Hangs from a limb on the right of the crown; the limb moves as the tree grows.
  const scale = 0.62 + 0.4 * growth;
  const limb = OLIVE.branches.find((branch) => branch.depth === 2 && branch.x1 > 25) ?? OLIVE.branches[2];
  const at = pointOn(limb, 0.75);
  const x = TREE_BASE.x + at.x * scale;
  const y = TREE_BASE.y + at.y * scale;
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

function Butterfly({ motion, color, path, dur }: { motion: boolean; color: string; path: string; dur: number }) {
  const body = <g>
    <g className="lg-wing"><path d="M0 0 C-5 -6 -9 -3 -7 1 C-8 4 -4 5 0 1 Z" fill={color} /><path d="M0 0 C5 -6 9 -3 7 1 C8 4 4 5 0 1 Z" fill={color} /></g>
    <ellipse rx=".7" ry="3" fill="#2a2320" />
  </g>;
  if (!motion) return <g transform={path.replace(/^M(\S+) (\S+).*/, 'translate($1 $2)')}>{body}</g>;
  return <g>{body}<animateMotion dur={`${dur}s`} repeatCount="indefinite" path={path} rotate="0" /></g>;
}

function Birds({ bird, resident, visitors, arriving, growth }: { bird: string; resident: boolean; visitors: boolean; arriving: boolean; growth: number }) {
  const scale = 0.62 + 0.4 * growth;
  const limbs = OLIVE.branches.filter((branch) => branch.depth === 3 && branchGrowth(branch, growth, OLIVE.maxDepth) >= 1);
  const perch = (index: number) => {
    // Too young to hold a bird: they wait on the wall beside it instead.
    if (!limbs.length) return { x: TREE_BASE.x + (index - 1) * 26 + (index % 2 ? 10 : -10), y: 193 };
    const limb = limbs[(index * 5 + 2) % limbs.length];
    const at = pointOn(limb, 0.85);
    return { x: TREE_BASE.x + at.x * scale, y: TREE_BASE.y + at.y * scale - 2 };
  };
  const place = (index: number, flip: boolean) => {
    const at = perch(index);
    return { at, transform: `translate(${at.x.toFixed(1)} ${at.y.toFixed(1)}) scale(${flip ? -1.1 : 1.1} 1.1)` };
  };
  const visiting = [0, 1, 2];
  return <g className="lg-birds">
    {resident && [3, 4].map((index, i) => <g key={`r${index}`} transform={place(index, i === 1).transform}><use href={`#${bird}`} className="lg-bird-idle" style={{ animationDelay: `${i * 1.7}s` }} /></g>)}
    {visitors && visiting.map((index, i) => {
      const { at, transform } = place(index, i % 2 === 1);
      if (!arriving) return <g key={`v${index}`} transform={transform}><use href={`#${bird}`} className="lg-bird-idle" style={{ animationDelay: `${i * 1.1}s` }} /></g>;
      // Fly in from beyond the arch, then settle on the branch.
      const from = { x: i % 2 ? 430 : -30, y: 40 + i * 20 };
      return <g key={`v${index}`}>
        <g transform={`scale(${i % 2 === 1 ? -1.1 : 1.1} 1.1)`}><use href={`#${bird}`} /></g>
        <animateMotion dur={`${1.8 + i * 0.35}s`} fill="freeze" begin={`${i * 0.25}s`} path={`M${from.x} ${from.y} Q${(from.x + at.x) / 2} ${Math.min(from.y, at.y) - 40} ${at.x.toFixed(1)} ${at.y.toFixed(1)}`} />
      </g>;
    })}
  </g>;
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

function ArchFrame({ gold, golden, className }: { gold: string; golden: boolean; className: string }) {
  return <g className={`lg-frame${golden ? ' golden' : ''}${className}`} fill="none" pointerEvents="none">
    <path d={ARCH} stroke={golden ? gold : 'var(--gold)'} strokeWidth={golden ? 3.2 : 1.6} />
    <path d="M5 300 L5 117 A227 227 0 0 1 200 9 A227 227 0 0 1 395 117 L395 300" stroke={golden ? gold : 'var(--gold)'} strokeWidth=".6" opacity=".7" />
    <g transform="translate(200 3)"><path d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z" fill={golden ? gold : 'var(--gold)'} stroke="none" /><rect x="-4" y="-4" width="8" height="8" transform="rotate(45)" fill="none" stroke={golden ? gold : 'var(--gold)'} strokeWidth=".6" /></g>
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

type Box = { x: number; y: number; w: number; h: number };

/** Where the camera looks when something arrives. */
function focusBox(unlock: UnlockId, growth: number): Box {
  const scale = 0.62 + 0.4 * growth;
  switch (unlock) {
    case 'firstBloom': { const slot = FLOWER_BEDS.find((s) => s.planted === 0)!; return { x: slot.x - 35, y: slot.y - 40, w: 70, h: 50 }; }
    case 'path': return { x: 150, y: 240, w: 100, h: 60 };
    case 'lavender': return { x: 140, y: 225, w: 120, h: 55 };
    case 'fountain': return { x: 45, y: 210, w: 90, h: 60 };
    case 'butterflies': return { x: 30, y: 205, w: 140, h: 90 };
    case 'pomegranate': return { x: 300, y: 185, w: 100, h: 80 };
    case 'lantern': {
      const limb = OLIVE.branches.find((branch) => branch.depth === 2 && branch.x1 > 25) ?? OLIVE.branches[2];
      const at = pointOn(limb, 0.75);
      return { x: TREE_BASE.x + at.x * scale - 35, y: TREE_BASE.y + at.y * scale - 15, w: 70, h: 60 };
    }
    case 'lemons': return { x: 145, y: 215, w: 110, h: 45 };
    case 'pool': return { x: 10, y: 195, w: 380, h: 50 };
    case 'bench': return { x: 255, y: 220, w: 75, h: 40 };
    case 'palm': return { x: 0, y: 110, w: 100, h: 115 };
    case 'songbirds': return { x: 120, y: 90, w: 160, h: 110 };
    case 'lanternString': return { x: 0, y: 165, w: 210, h: 50 };
    case 'cypresses': return { x: 30, y: 110, w: 100, h: 100 };
    case 'roses': return { x: 0, y: 235, w: 80, h: 45 };
    case 'vine': return { x: 0, y: 100, w: 110, h: 200 };
    case 'fireflies': return { x: 80, y: 130, w: 240, h: 140 };
    case 'shootingStars': return { x: 100, y: 10, w: 240, h: 110 };
    default: return { x: 0, y: 0, w: W, h: H };
  }
}

/** A translate and scale that brings `box` to the middle without showing past the scene's edges. */
function zoomTo(box: Box) {
  const k = Math.min(3.2, Math.max(1, Math.min(W / box.w, H / box.h) * 0.85));
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const x = Math.min(0, Math.max(W - k * W, W / 2 - k * cx));
  const y = Math.min(0, Math.max(H - k * H, H / 2 - k * cy));
  return { k, x, y };
}

/** A square view around the tree as it stands, crown and trunk, for the small window beside the counter. */
function crownView(growth: number) {
  const scale = 0.62 + 0.4 * growth;
  let top = 0; let left = 0; let right = 0;
  OLIVE.branches.forEach((branch) => {
    const grown = branchGrowth(branch, growth, OLIVE.maxDepth);
    if (grown <= 0) return;
    const end = pointOn(branch, grown);
    top = Math.min(top, end.y - 12); left = Math.min(left, end.x - 12); right = Math.max(right, end.x + 12);
  });
  const width = (right - left) * scale;
  const height = -top * scale + 10;
  const size = Math.max(width, height, 46);
  const cx = TREE_BASE.x + ((left + right) / 2) * scale;
  const cy = TREE_BASE.y + 6 - height / 2;
  return `${(cx - size / 2).toFixed(1)} ${(cy - size / 2).toFixed(1)} ${size.toFixed(1)} ${size.toFixed(1)}`;
}
