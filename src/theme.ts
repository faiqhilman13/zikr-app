/**
 * Palette presets and the derivation that turns three seed colours into the full set of
 * custom properties the stylesheet reads.
 *
 * A preset supplies a primary, secondary and tertiary per mode; the remaining sixteen
 * variables are derived. Light and dark are seeded separately because the roles are not
 * mirror images: in light, `--brand` sits on a pale panel and wants the primary hue, while
 * in dark the same variable is a foreground on a dark panel and has to come from the
 * lighter secondary or it disappears.
 *
 * Every derived foreground runs through `readable`, which walks lightness until it clears
 * the WCAG ratio against the surface it sits on. Contrast is therefore a property of the
 * derivation rather than something each preset has to be hand-checked for, and the tests
 * assert it holds for every preset in both modes.
 */

export type ThemeMode = 'light' | 'dark';

export interface Seeds { primary: string; secondary: string; tertiary: string }
export interface PresetSeeds { light: Seeds; dark: Seeds }
export interface Preset { id: string; seeds: PresetSeeds }

/* ------------------------------------------------------------------ colour maths */

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const HEX = /^#[0-9a-f]{6}$/i;

export const isHex = (value: unknown): value is string => typeof value === 'string' && HEX.test(value);

const toRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)
];

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((channel) => Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, '0')).join('')}`;

interface Hsl { h: number; s: number; l: number }

const toHsl = (hex: string): Hsl => {
  const [r, g, b] = toRgb(hex).map((channel) => channel / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
};

const fromHsl = ({ h, s, l }: Hsl): string => {
  const c = (1 - Math.abs(2 * clamp(l) - 1)) * clamp(s);
  const hue = ((h % 360) + 360) % 360;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = clamp(l) - c / 2;
  const [r, g, b] = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x]
    : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
  return toHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
};

/** WCAG 2.1 relative luminance. */
const luminance = (hex: string) => {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

const shift = (hex: string, delta: number) => {
  const hsl = toHsl(hex);
  return fromHsl({ ...hsl, l: clamp(hsl.l + delta) });
};

const withHsl = (hex: string, over: Partial<Hsl>) => fromHsl({ ...toHsl(hex), ...over });

/** Lighten while easing saturation off, the way a hover state reads as the same hue
 * stepped up rather than a more intense version of it. */
const lift = (hex: string, delta: number) => {
  const hsl = toHsl(hex);
  return fromHsl({ ...hsl, s: hsl.s * 0.72, l: clamp(hsl.l + delta) });
};

const rgba = (hex: string, alpha: number) => {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Walk `colour` toward black or white, whichever direction the surface allows, until it
 * clears `ratio` against it. Returns the first passing step, or the extreme, which always
 * passes. This is what keeps a preset from shipping unreadable text.
 */
export const readable = (colour: string, on: string, ratio = 4.5): string => {
  if (contrast(colour, on) >= ratio) return colour;
  const towardBlack = luminance(on) > 0.18;
  for (let step = 0.02; step <= 1; step += 0.02) {
    const candidate = shift(colour, towardBlack ? -step : step);
    if (contrast(candidate, on) >= ratio) return candidate;
  }
  return towardBlack ? '#000000' : '#ffffff';
};

/* ------------------------------------------------------------------ derivation */

/** The custom properties `styles.css` reads, minus `--radius`, which is not a colour. */
export type Palette = Record<string, string>;

/**
 * Alpha-composited values, resolved here rather than left as literal rgba in the
 * stylesheet. A hairline on a panel, the glow under the orb and the garden's leaves are
 * all tints of palette colours; hardcoded they survive a palette change and the preset
 * stops at the edge of the solid fills.
 */
const composite = (base: Palette, primary: string): Palette => {
  const deep = withHsl(primary, { s: Math.min(toHsl(primary).s, 0.5), l: 0.1 });
  return {
    ...base,
    '--on-panel-soft': rgba(base['--on-panel'], 0.78),
    '--panel-line': rgba(base['--on-panel'], 0.16),
    '--accent-soft': rgba(base['--accent-on-panel'], 0.18),
    '--accent-ring': rgba(base['--accent-on-panel'], 0.45),
    '--orb-glow': rgba(base['--orb-2'], 0.35),
    '--orb-glow-ring': rgba(base['--orb-2'], 0.55),
    '--on-orb-soft': rgba(base['--on-orb'], 0.82),
    '--nav-shadow': rgba(deep, 0.1),
    '--soil': rgba(deep, 0.45),
    '--scrim': rgba(deep, 0.72)
  };
};

export function derive(mode: ThemeMode, seeds: Seeds): Palette {
  const { primary, secondary, tertiary } = seeds;

  if (mode === 'light') {
    const bg = tertiary;
    const surface = withHsl(tertiary, { l: 0.99 });
    const surface2 = shift(tertiary, -0.06);
    const ink = readable(withHsl(primary, { s: Math.min(toHsl(primary).s, 0.5), l: 0.12 }), bg, 7);
    // Tinted from the primary hue rather than grey, per the craft floor's note on
    // secondary text over a coloured surface.
    const muted = readable(withHsl(primary, { s: Math.min(toHsl(primary).s, 0.14), l: 0.4 }), surface, 4.5);
    const onPrimary = readable('#ffffff', primary, 4.5);
    return composite({
      '--bg': bg,
      '--surface': surface,
      '--surface-2': surface2,
      '--ink': ink,
      '--muted': muted,
      '--brand': readable(primary, surface2, 4.5),
      '--brand-2': lift(primary, 0.09),
      '--panel': primary,
      '--on-panel': onPrimary,
      '--button-bg': primary,
      '--button-bg-hover': lift(primary, 0.09),
      '--on-button': onPrimary,
      '--bar': primary,
      '--gold': secondary,
      '--gold-strong': readable(secondary, bg, 4.5),
      '--gold-text': readable(secondary, bg, 4.5),
      '--gold-soft': withHsl(secondary, { s: 0.85, l: 0.84 }),
      '--heat-4': readable(secondary, bg, 4.5),
      '--focus': readable(secondary, bg, 3),
      // The counting orb and the filled panels are the app's centrepiece. Left
      // hardcoded they would stay royal-blue-and-gold under every other preset.
      '--accent-on-panel': readable(withHsl(secondary, { l: 0.67 }), primary, 4.5),
      '--orb-1': withHsl(secondary, { l: 0.67 }),
      '--orb-2': secondary,
      '--orb-3': shift(secondary, -0.12),
      '--on-orb': readable(withHsl(primary, { s: Math.min(toHsl(primary).s, 0.5), l: 0.12 }), secondary, 4.5),
      '--button-shadow': rgba(primary, 0.22),
      '--line': rgba(primary, 0.14),
      '--shadow': `0 12px 30px ${rgba(primary, 0.09)}`
    }, primary);
  }

  // Cap the seed's saturation rather than setting it: forcing a value turns a
  // deliberately neutral primary into a coloured one, which made Ink read as navy.
  const tint = Math.min(toHsl(primary).s, 0.6);
  const bg = withHsl(primary, { s: tint, l: 0.1 });
  const surface = withHsl(primary, { s: Math.min(tint, 0.5), l: 0.145 });
  const surface2 = withHsl(primary, { s: Math.min(tint, 0.5), l: 0.2 });
  const ink = readable(withHsl(tertiary, { l: 0.9 }), bg, 7);
  const muted = readable(withHsl(primary, { s: Math.min(tint, 0.2), l: 0.72 }), surface, 4.5);
  const button = shift(primary, 0.14);
  return composite({
    '--bg': bg,
    '--surface': surface,
    '--surface-2': surface2,
    '--ink': ink,
    '--muted': muted,
    // A foreground on a dark panel, so it comes from the lighter secondary. The primary
    // hue at its light-mode lightness would vanish here.
    '--brand': readable(withHsl(secondary, { l: 0.67 }), surface2, 4.5),
    '--brand-2': secondary,
    '--panel': primary,
    '--on-panel': readable('#ffffff', primary, 4.5),
    '--button-bg': button,
    '--button-bg-hover': lift(primary, 0.22),
    '--on-button': readable('#ffffff', button, 4.5),
    '--bar': withHsl(primary, { s: Math.min(tint, 0.25), l: 0.66 }),
    '--gold': withHsl(secondary, { l: 0.67 }),
    '--gold-strong': readable(withHsl(secondary, { l: 0.67 }), bg, 4.5),
    '--gold-text': readable(withHsl(secondary, { l: 0.67 }), bg, 4.5),
    '--gold-soft': withHsl(secondary, { s: 0.42, l: 0.19 }),
    '--heat-4': withHsl(secondary, { l: 0.82 }),
    '--focus': readable(withHsl(secondary, { l: 0.67 }), bg, 3),
    '--accent-on-panel': readable(withHsl(secondary, { l: 0.72 }), primary, 4.5),
    '--orb-1': withHsl(secondary, { l: 0.67 }),
    '--orb-2': secondary,
    '--orb-3': shift(secondary, -0.12),
    '--on-orb': readable(withHsl(primary, { s: Math.min(tint, 0.5), l: 0.12 }), secondary, 4.5),
    '--button-shadow': rgba(primary, 0.3),
    '--line': rgba(ink, 0.2),
    '--shadow': '0 24px 60px rgba(0, 0, 0, .25)'
  }, primary);
}

/* ------------------------------------------------------------------ presets */

/**
 * Five palettes, each seeded for both modes. `royal` reproduces the shipped look and
 * stays the default, so an existing install sees no change until it opts in.
 */
export const presets: Preset[] = [
  {
    id: 'royal',
    seeds: {
      light: { primary: '#1e3a8a', secondary: '#d4a017', tertiary: '#faf8f5' },
      dark: { primary: '#1e3a8a', secondary: '#d4a017', tertiary: '#e8e4df' }
    }
  },
  {
    id: 'garden',
    // Leaf rather than brass. The accent drives the counting orb, which dominates the
    // screen, and a warm gold there left Garden reading as a tint of Royal.
    seeds: {
      light: { primary: '#1f5137', secondary: '#6f8f33', tertiary: '#f7f6f0' },
      dark: { primary: '#1f5137', secondary: '#7ea33c', tertiary: '#e6e9e2' }
    }
  },
  {
    id: 'dusk',
    seeds: {
      light: { primary: '#4a2d5e', secondary: '#a75f45', tertiary: '#faf6f2' },
      dark: { primary: '#4a2d5e', secondary: '#c07a5c', tertiary: '#ece5df' }
    }
  },
  {
    id: 'ink',
    seeds: {
      light: { primary: '#23272e', secondary: '#0f6f6c', tertiary: '#f6f6f4' },
      dark: { primary: '#2b3038', secondary: '#1f8f8a', tertiary: '#e9e9e6' }
    }
  },
  {
    id: 'rose',
    // Dusty rose rather than gold, and kept off Dusk's orange-brown so the two do not
    // collide at the centre of the screen.
    seeds: {
      light: { primary: '#6d2338', secondary: '#b05a74', tertiary: '#fbf5f4' },
      dark: { primary: '#6d2338', secondary: '#c46d88', tertiary: '#eee2e4' }
    }
  }
];

export const DEFAULT_PRESET = 'royal';
export const presetIds = presets.map((preset) => preset.id);
export const findPreset = (id: string) => presets.find((preset) => preset.id === id) ?? presets[0];

/** The palette a given preset produces for a mode, ready to write as custom properties. */
export const paletteFor = (id: string, mode: ThemeMode) => derive(mode, findPreset(id).seeds[mode]);

/**
 * Serialised for the pre-paint inline script and for applying at runtime. Values are
 * derived here from validated hex seeds, never taken from stored input directly, so
 * nothing a backup carries can reach the style attribute.
 */
export const applyPalette = (root: HTMLElement, id: string, mode: ThemeMode) => {
  const palette = paletteFor(id, mode);
  for (const [name, value] of Object.entries(palette)) root.style.setProperty(name, value);
};
