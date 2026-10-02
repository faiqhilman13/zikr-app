import { useEffect, useId, useRef, useState } from 'react';
import type { BiomeId } from '../../../domain/types';
import { ageMarks, flowerCount, FLOWER_SLOTS, isUnlocked, maturity, ORCHARD, timeOfDay, type OrchardId, type UnlockId } from './growth';
import { Hero, HeroDefs } from './hero';
import { mix, PALETTES, tinter, type Tint } from './palette';
import { clamp01, lerp, seeded } from './random';
import { crownView, leavesOut, limbPoint, perches, zoomTo, H, W, type Ctx, type Layout } from './scene';
import { SCENES } from './scenes';
import type { Season } from './seasons';
import { SeasonSky } from './SeasonSky';

/**
 * The living garden. Each garden is its own place, drawn entirely in SVG so it stays sharp
 * at any size and every part of it can move: today's tree fills with leaf, blossom and fruit
 * as the day's intention is kept; every tended day plants a flower and, at milestones, adds
 * something that stays.
 */

export interface LivingGardenProps {
  /** Share of today's intention done, 0..1. */
  ratio: number;
  /** Days tended to half the intention or more: flowers and arrivals. */
  tended: number;
  /** Days the intention was completed: the tree's growth. */
  full: number;
  /** An arrival to bring the camera in on, or null for the whole garden. */
  focus?: UnlockId | null;
  /** A small round view of just the tree, for beside the counter. */
  mini?: boolean;
  /** Trees of each kind grown by each phrase, for the orchard beyond the wall. */
  orchard?: Partial<Record<OrchardId, number>>;
  /** Kinds that gained a tree since the garden was last seen. */
  freshOrchard?: readonly OrchardId[];
  /** A returning visitor: rain falls, then a rainbow. */
  rain?: boolean;
  /** A planted flower was chosen, by its planting order. */
  onFlower?: (planted: number) => void;
  /** Which garden. */
  biome?: BiomeId;
  /** Lifetime milestones reached by each phrase, for older, taller orchard trees. */
  orchardTiers?: Partial<Record<OrchardId, number>>;
  /** The Hijri season, if one is under way. */
  season?: Season | null;
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

const STARS = (() => {
  const random = seeded(7);
  return Array.from({ length: 46 }, () => ({ x: random() * W, y: random() * 150 + 6, r: lerp(0.35, 1.1, random()), twinkle: random() < 0.4, delay: random() * 4 }));
})();

const FIREFLIES = (() => {
  const random = seeded(3);
  return Array.from({ length: 11 }, () => ({ x: lerp(30, 370, random()), y: lerp(150, 270, random()), delay: random() * 6, drift: random() }));
})();

/** Sun or moon position for the hour: rises on the left, sets on the right. */
function sunAt(now: Date) {
  const hour = now.getHours() + now.getMinutes() / 60;
  const t = clamp01((hour - 5) / 15);
  return { x: lerp(40, 360, t), y: 150 - Math.sin(t * Math.PI) * 112 };
}

export function LivingGarden({ ratio, tended, full, now, celebrate, motion, fresh, freshFlower, label, focus = null, mini = false, orchard = {}, freshOrchard = [], rain = false, onFlower, biome = 'andalusia', orchardTiers = {}, season = null }: LivingGardenProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ref = (name: string) => `${id}-${name}`;
  const url = (name: string) => `url(#${ref(name)})`;
  const { layout, paint } = SCENES[biome] ?? SCENES.andalusia;
  const time = timeOfDay(now);
  const palette = PALETTES[time];
  const tint = tinter(palette);
  const growth = maturity(full);
  const days = tended;
  const unlocked = (unlock: UnlockId) => isUnlocked(unlock, days, biome);
  const arrive = (unlock: UnlockId) => (fresh.includes(unlock) ? ' lg-arrive' : '');
  const sun = sunAt(now);
  const complete = ratio >= 1;
  const lit = palette.night ? 1 : time === 'golden' ? 0.6 : 0;
  const limb = (side: 'left' | 'right', t: number) => limbPoint(layout, growth, side, t);
  const ctx: Ctx = { tint, palette, time, motion, url, idOf: ref, on: unlocked, arrive, days, growth, mini, lit, limb };

  // Leaves already out when the garden first appears fill in with a quick stagger; any
  // that arrive later, with a tap, pop in at once.
  const [firstLeaves] = useState(() => leavesOut(layout.hero.kind, ratio));

  const box = focus ? layout.focus(focus, { growth, limb }) : null;
  const zoom = box ? zoomTo(box) : null;
  const viewBox = mini ? crownView(layout, growth) : `0 0 ${W} ${H}`;
  const crownTop = layout.hero.y - 120 * (0.25 + 0.75 * growth) * layout.hero.scale;

  return <svg className={`living-garden${motion ? '' : ' still'}${mini ? ' mini' : ''}${complete ? ' complete' : ''} time-${time} biome-${biome}`} viewBox={viewBox} role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
    <defs>
      <clipPath id={ref('arch')}><path d={layout.frame} /></clipPath>
      <linearGradient id={ref('grass')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={tint(mix(palette.groundTop, '#86ad55', 0.62))} /><stop offset="1" stopColor={tint(mix(palette.groundBottom, '#5f8a3e', 0.6))} /></linearGradient>
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
      <HeroDefs kind={layout.hero.kind} tint={tint} prefix={ref('h')} />
      <paint.FlowerHeads tint={tint} prefix={ref('flower')} />
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

      {paint.Far(ctx)}
      {!mini && <Orchard orchard={orchard} tiers={orchardTiers} fresh={freshOrchard} tint={tint} at={layout.orchard} />}
      {paint.Wall(ctx)}
      {!mini && (orchard.rose ?? 0) > 0 && <ClimbingRoses count={orchard.rose ?? 0} fresh={freshOrchard.includes('rose')} tint={tint} spots={layout.roses} />}
      {paint.Ground(ctx)}
      {complete && <circle className="lg-bloom" cx={layout.hero.x} cy={crownTop} r={(40 + 90 * growth) * layout.hero.scale} fill={url('bloom')} />}
      <Hero layout={layout} tint={tint} growth={growth} ratio={ratio} prefix={ref('h')} firstLeaves={firstLeaves} age={ageMarks(full)} />
      {paint.Front?.(ctx)}

      {!mini && <g className="lg-flowers">
        {layout.slots.map((slot, i) => {
          if (slot.planted === flowerCount(days) && slot.planted < FLOWER_SLOTS) {
            // Tomorrow's flower is already a sprout in its place.
            return <g key={i} transform={`translate(${slot.x.toFixed(1)} ${slot.y.toFixed(1)})`}><g className="lg-flower lg-sprout">
              <path d="M0 0 V-4" stroke={tint('#6d9a4c')} strokeWidth=".9" /><path d="M0 -3.4 C-2.6 -4.6 -3.4 -6.4 -3 -7 C-1.4 -6.6 -.2 -5.2 0 -3.4 Z M0 -3.4 C2.6 -4.6 3.4 -6.4 3 -7 C1.4 -6.6 .2 -5.2 0 -3.4 Z" fill={tint('#7fb05a')} />
            </g></g>;
          }
          if (slot.planted >= flowerCount(days)) return null;
          const newest = freshFlower && slot.planted === flowerCount(days) - 1;
          return <g key={i} transform={`translate(${slot.x.toFixed(1)} ${slot.y.toFixed(1)}) scale(${slot.scale.toFixed(2)})`} className={onFlower ? 'lg-tappable' : undefined} onClick={onFlower ? () => onFlower(slot.planted) : undefined}>
            {onFlower && <circle cy={-slot.height / 2} r={Math.max(7, slot.height / 2 + 3)} fill="transparent" />}
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

      <Birds layout={layout} bird={ref('bird')} resident={unlocked('songbirds')} visitors={complete} arriving={celebrate && motion} growth={growth} />

      {!mini && paint.Over?.(ctx)}

      {unlocked('fireflies') && (palette.night || time === 'golden') && motion && !mini && <g className="lg-fireflies" opacity={palette.night ? 1 : 0.55}>
        {FIREFLIES.map((fly, i) => <g key={i} transform={`translate(${fly.x.toFixed(1)} ${fly.y.toFixed(1)})`}><circle className={`lg-firefly f${i % 3}`} style={{ animationDelay: `${fly.delay.toFixed(2)}s` }} r="4.5" fill={url('firefly')} /></g>)}
      </g>}

      {season && !mini && <SeasonSky season={season} y={layout.seasonY} lit={palette.night ? 1 : time === 'golden' || time === 'dawn' ? 0.6 : 0} glow={url('lamp')} night={palette.night} motion={motion} />}
      {rain && !mini && <Rain motion={motion} />}
      {unlocked('shootingStars') && palette.night && motion && !mini && <g className="lg-shooting">{[0, 1].map((i) => <line key={i} className="lg-shooting-star" style={{ animationDelay: `${i * 7 + 2}s` }} x1={120 + i * 110} y1={30 + i * 18} x2={140 + i * 110} y2={38 + i * 18} stroke="#fff" strokeWidth="1" strokeLinecap="round" />)}</g>}
      {complete && celebrate && motion && !mini && <g className="lg-sparkles">{[[-50, -156], [50, -146], [0, -186], [-30, -116], [36, -106], [-70, -116], [70, -176]].map(([dx, dy], i) => <g key={i} transform={`translate(${layout.hero.x + dx} ${layout.hero.y + dy * 0.9})`}><path className="lg-sparkle" style={{ animationDelay: `${i * 0.18}s` }} d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" fill="#fff6d0" /></g>)}</g>}
      </g>
    </g>

    {!mini && paint.Frame({ gold: url('gold'), golden: unlocked(paint.golden), className: arrive(paint.golden), ctx })}
  </svg>;
}

function Cloud({ x, y, scale, fill, className }: { x: number; y: number; scale: number; fill: string; className: string }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><g className={className}>
    <path d="M0 14 C-2 6 8 2 13 6 C16 -2 30 -3 34 5 C40 0 52 4 50 13 C56 14 56 21 49 22 L3 22 C-4 22 -5 15 0 14 Z" fill={fill} />
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

/**
 * A bird flying in to its perch. SMIL timing counts from when the whole SVG began, which
 * is long past by the time a day is completed, so a plain `begin` would have the bird
 * appear already perched. The flight is started from the moment this bird is added.
 */
function FlyingBird({ bird, flip, delay, duration, path }: { bird: string; flip: boolean; delay: number; duration: number; path: string }) {
  const motion = useRef<SVGAnimateMotionElement>(null);
  useEffect(() => {
    const element = motion.current;
    if (element && typeof element.beginElementAt === 'function') element.beginElementAt(delay);
  }, [delay]);
  return <g>
    <g transform={`scale(${flip ? -1.1 : 1.1} 1.1)`}><use href={`#${bird}`} /></g>
    <animateMotion ref={motion} dur={`${duration}s`} fill="freeze" begin="indefinite" path={path} />
  </g>;
}

function Birds({ layout, bird, resident, visitors, arriving, growth }: { layout: Layout; bird: string; resident: boolean; visitors: boolean; arriving: boolean; growth: number }) {
  const spots = perches(layout, growth);
  const perch = (index: number) => {
    // Too young to hold a bird: they wait on the wall or the ground beside it instead.
    if (!spots) return { x: layout.hero.x + (index - 1) * 26 + (index % 2 ? 10 : -10), y: layout.ledge };
    return spots[index % spots.length];
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
      return <FlyingBird key={`v${index}`} bird={bird} flip={i % 2 === 1} delay={i * 0.25} duration={1.8 + i * 0.35}
        path={`M${from.x} ${from.y} Q${(from.x + at.x) / 2} ${Math.min(from.y, at.y) - 40} ${at.x.toFixed(1)} ${at.y.toFixed(1)}`} />;
    })}
  </g>;
}

/* The orchard beyond the wall. Each kind has its own five places along the hillside,
   interleaved so a mixed practice grows a mixed orchard. */
const ORCHARD_SLOTS: Record<Exclude<OrchardId, 'rose'>, number[]> = (() => {
  const kinds = ['palm', 'fig', 'cypress', 'olive'] as const;
  const random = seeded(77);
  const xs = Array.from({ length: 20 }, (_, i) => 14 + i * 19.4 + (random() - 0.5) * 6);
  // The first four of each kind interleave; the fifth takes one of the four places left over.
  return Object.fromEntries(kinds.map((kind, k) => [kind, [0, 1, 2, 3, 4].map((n) => xs[n === 4 ? 2 + k * 5 : (n * 5 + k * 3) % 20])])) as Record<Exclude<OrchardId, 'rose'>, number[]>;
})();

function Orchard({ orchard, tiers = {}, fresh, tint, at }: { orchard: Partial<Record<OrchardId, number>>; tiers?: Partial<Record<OrchardId, number>>; fresh: readonly OrchardId[]; tint: Tint; at: { y: number; scale: number } }) {
  const trees: { kind: Exclude<OrchardId, 'rose'>; x: number; newest: boolean }[] = [];
  for (const { id } of ORCHARD) {
    if (id === 'rose') continue;
    const count = orchard[id] ?? 0;
    ORCHARD_SLOTS[id].slice(0, count).forEach((x, n) => trees.push({ kind: id, x, newest: fresh.includes(id) && n === count - 1 }));
  }
  // Each lifetime milestone a phrase passes makes its trees a little taller and older.
  return <g className="lg-orchard">{trees.sort((a, b) => a.x - b.x).map(({ kind, x, newest }) => <g key={`${kind}${x}`} transform={`translate(${x.toFixed(1)} ${at.y}) scale(${(at.scale * (1 + 0.13 * (tiers[kind] ?? 0))).toFixed(2)})`}>
    <g className={`lg-flower slow${newest ? ' lg-arrive' : ''}`}>
      {kind === 'palm' && <g>
        <path d="M0 0 C-1 -10 1 -20 4 -28 L5.5 -27.6 C3 -20 1.6 -10 1.8 0 Z" fill={tint('#8a6d4a')} />
        <g transform="translate(4.8 -28)">{[-160, -125, -90, -55, -20, 10].map((angle, i) => <path key={i} transform={`rotate(${angle})`} d="M0 0 C4 -1.4 9 -1 13 1.6 C9 .5 4 1 0 0 Z" fill={tint(i % 2 ? '#4f7a3f' : '#5f8c48')} />)}
          <circle cx="-.6" cy="2" r="1.2" fill={tint('#c9782c')} /><circle cx="1" cy="2.4" r="1.1" fill={tint('#b8651f')} /></g>
      </g>}
      {kind === 'fig' && <g>
        <path d="M-1.2 0 C-1.4 -5 -1 -8 0 -10 C1 -8 1.4 -5 1.2 0 Z" fill={tint('#7d6a55')} />
        <circle cy="-15" r="8.5" fill={tint('#4b6f35')} /><circle cx="-5" cy="-12" r="5.5" fill={tint('#58803e')} /><circle cx="5" cy="-13" r="5.8" fill={tint('#41632f')} />
        {[[-3, -15], [3, -11], [4, -17], [-5, -10]].map(([fx, fy], i) => <ellipse key={i} cx={fx} cy={fy} rx="1.2" ry="1.4" fill={tint('#6b3f6b')} />)}
      </g>}
      {kind === 'cypress' && <path d="M0 0 C-5 -10 -4.5 -26 0 -38 C4.5 -26 5 -10 0 0 Z" fill={tint('#2f5a3c')} />}
      {kind === 'olive' && <g>
        <path d="M-1.4 0 C-1 -4 -2 -7 -.6 -10 L1 -10 C.4 -7 1.6 -4 1.4 0 Z" fill={tint('#76624d')} />
        <ellipse cy="-14" rx="10" ry="6.5" fill={tint('#7f9866')} /><ellipse cx="-4" cy="-16" rx="5" ry="3.6" fill={tint('#9cb07f')} opacity=".8" />
      </g>}
    </g>
  </g>)}</g>;
}

/** Salawat grows climbing roses up the courtyard wall, one cluster for each tree's worth. */
function ClimbingRoses({ count, fresh, tint, spots: all }: { count: number; fresh: boolean; tint: Tint; spots: { x: number; y: number }[] }) {
  const spots = all.slice(0, count);
  return <g className="lg-roses-wall">{spots.map(({ x, y }, i) => <g key={x} transform={`translate(${x} ${y})`}><g className={fresh && i === count - 1 ? 'lg-arrive' : undefined}>
    <path d="M0 0 C-3 -6 3 -10 -1 -16 C-4 -20 2 -22 0 -24" stroke={tint('#4f6e3c')} strokeWidth=".9" fill="none" />
    {[[-3, -4], [3, -8], [-3, -12], [3, -16], [-2, -21], [1.5, -24]].map(([lx, ly], k) => <ellipse key={`l${k}`} cx={lx} cy={ly} rx="2" ry="1.2" transform={`rotate(${k % 2 ? 30 : -30} ${lx} ${ly})`} fill={tint('#5f8046')} />)}
    {[[-1.5, -7], [2, -13], [-1, -19], [1, -23.5]].map(([rx, ry], k) => <g key={`r${k}`} transform={`translate(${rx} ${ry})`}><circle r="1.9" fill={tint(k % 2 ? '#d64566' : '#e8708a')} /><circle r=".8" fill={tint('#a82a4a')} /></g>)}
  </g></g>)}</g>;
}

const DROPS = (() => {
  const random = seeded(91);
  return Array.from({ length: 70 }, () => ({ x: random() * 420 - 10, delay: random() * 0.9, length: lerp(5, 9, random()), speed: lerp(0.55, 0.8, random()) }));
})();

/** A soft shower that waters the garden on a return, then a rainbow as it clears. */
function Rain({ motion }: { motion: boolean }) {
  return <g className="lg-weather">
    <rect className="lg-rain-veil" width={W} height={H} fill="#8a9ab8" />
    {motion && <g className="lg-rain">{DROPS.map((drop, i) => <line key={i} className="lg-drop" style={{ animationDelay: `${drop.delay.toFixed(2)}s`, animationDuration: `${drop.speed.toFixed(2)}s` }} x1={drop.x} y1={-10} x2={drop.x - 2} y2={-10 + drop.length} stroke="#dbe8f7" strokeWidth=".8" strokeLinecap="round" />)}</g>}
    <g className="lg-rainbow" fill="none" strokeWidth="5" opacity=".0">
      {['#e8534f', '#f39c45', '#f4d35e', '#7cc47f', '#5aa2d6', '#7a6cc9'].map((color, i) => <path key={color} d={`M${30 + i * 5} 210 A${170 - i * 5} ${150 - i * 5} 0 0 1 ${370 - i * 5} 210`} stroke={color} />)}
    </g>
  </g>;
}
