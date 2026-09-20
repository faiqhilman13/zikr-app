import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrast, DEFAULT_PRESET, derive, isHex, paletteFor, presets, readable, type ThemeMode } from './theme';

const MODES: ThemeMode[] = ['light', 'dark'];
const every = presets.flatMap((preset) => MODES.map((mode) => ({ id: preset.id, mode, palette: paletteFor(preset.id, mode) })));

describe('colour maths', () => {
  // Spot values against the WCAG reference so a regression in the luminance formula
  // cannot quietly weaken every contrast assertion below.
  it('matches known contrast ratios', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 1);
  });

  it('is symmetric, so argument order cannot flip a pass into a fail', () => {
    expect(contrast('#1e3a8a', '#faf8f5')).toBeCloseTo(contrast('#faf8f5', '#1e3a8a'), 10);
  });

  it('walks a colour until it clears the ratio, in either direction', () => {
    expect(contrast(readable('#d4a017', '#faf8f5', 4.5), '#faf8f5')).toBeGreaterThanOrEqual(4.5);
    expect(contrast(readable('#1e3a8a', '#0a1628', 4.5), '#0a1628')).toBeGreaterThanOrEqual(4.5);
  });

  it('gives back a colour already clearing the ratio untouched', () => {
    expect(readable('#000000', '#ffffff', 4.5)).toBe('#000000');
  });
});

describe('every preset, in both modes', () => {
  it('emits only valid hex or a colour function, never raw input', () => {
    for (const { palette } of every) {
      for (const [name, value] of Object.entries(palette)) {
        const shaped = isHex(value) || /^rgba\([\d\s.,]+\)$/.test(value) || /^0 [\d.]+px [\d.]+px rgba\([\d\s.,]+\)$/.test(value);
        expect(shaped, `${name} = ${value}`).toBe(true);
      }
    }
  });

  // The craft floor's contrast rule, checked by construction rather than by eye.
  it.each(every)('$id/$mode keeps body text at 4.5:1 or better', ({ palette }) => {
    expect(contrast(palette['--ink'], palette['--bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette['--ink'], palette['--surface'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette['--muted'], palette['--surface'])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(every)('$id/$mode keeps accent text and button labels readable', ({ palette }) => {
    expect(contrast(palette['--gold-text'], palette['--bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette['--brand'], palette['--surface-2'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette['--on-button'], palette['--button-bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette['--on-panel'], palette['--panel'])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(every)('$id/$mode keeps the orb and filled panels readable', ({ palette }) => {
    expect(contrast(palette['--on-orb'], palette['--orb-2'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette['--accent-on-panel'], palette['--panel'])).toBeGreaterThanOrEqual(4.5);
  });

  // A focus ring is a large graphical indicator, so 3:1 is the bar, but it has to be
  // visible on the page background rather than the hardcoded amber it replaces.
  it.each(every)('$id/$mode keeps the focus ring visible', ({ palette }) => {
    expect(contrast(palette['--focus'], palette['--bg'])).toBeGreaterThanOrEqual(3);
  });

  // The counting ring is the only indicator of how far through a round you are, and it is
  // read against the unfilled track it shares an edge with, so that is the pair to check.
  // Taking the accent straight through left Royal's gold at 2:1 on its own pale track.
  it.each(every)('$id/$mode keeps the progress arc visible against its track', ({ palette }) => {
    expect(contrast(palette['--orb-arc'], palette['--surface-2'])).toBeGreaterThanOrEqual(3);
  });

  it.each(every)('$id/$mode separates its surfaces from the page', ({ palette }) => {
    expect(palette['--surface']).not.toBe(palette['--bg']);
    expect(palette['--surface-2']).not.toBe(palette['--surface']);
  });

  it('keeps dark genuinely darker than light for the same preset', () => {
    for (const preset of presets) {
      const light = paletteFor(preset.id, 'light');
      const dark = paletteFor(preset.id, 'dark');
      expect(contrast(dark['--bg'], '#ffffff')).toBeGreaterThan(contrast(light['--bg'], '#ffffff'));
    }
  });
});

describe('presets', () => {
  it('has a stable set of ids, so a stored choice keeps resolving', () => {
    expect(presets.map((preset) => preset.id)).toEqual(['royal', 'garden', 'dusk', 'ink', 'rose']);
  });

  it('leaves the shipped look untouched as the default', () => {
    const light = paletteFor('royal', 'light');
    expect(light['--bg']).toBe('#faf8f5');
    expect(light['--panel']).toBe('#1e3a8a');
    expect(light['--gold']).toBe('#d4a017');
  });

  it('gives each preset a distinct identity rather than a tint of one hue', () => {
    const panels = presets.map((preset) => paletteFor(preset.id, 'light')['--panel']);
    expect(new Set(panels).size).toBe(presets.length);
  });

  it('falls back to the default for an id it does not know', () => {
    expect(paletteFor('nope', 'light')).toEqual(paletteFor('royal', 'light'));
  });

  /**
   * The stylesheet repeats the default palette as literal values so a first paint has
   * colours before any script runs. That copy is written by hand, and a variable added to
   * the derivation but missed in either block silently falls back to nothing.
   */
  it('keeps the stylesheet defaults equal to the derived default palette', () => {
    const css = fs.readFileSync(path.join(import.meta.dirname, 'styles.css'), 'utf8');
    const block = (selector: string) => {
      const start = css.indexOf(`${selector} {`);
      const declarations = css.slice(start, css.indexOf('\n}', start));
      return Object.fromEntries([...declarations.matchAll(/^\s*(--[a-z0-9-]+):\s*(.+?);$/gm)].map(([, name, value]) => [name, value]));
    };

    for (const [selector, mode] of [[':root', 'light'], [":root[data-theme='dark']", 'dark']] as const) {
      const declared = block(selector);
      for (const [name, value] of Object.entries(paletteFor(DEFAULT_PRESET, mode))) {
        expect(declared[name], `${selector} ${name}`).toBe(value);
      }
    }
  });

  it('derives from seeds rather than reading them straight through', () => {
    // A seed is never written to a foreground slot without passing the contrast walk.
    const palette = derive('light', { primary: '#ffee00', secondary: '#fffbcc', tertiary: '#ffffff' });
    expect(contrast(palette['--ink'], palette['--bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette['--gold-text'], palette['--bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette['--on-button'], palette['--button-bg'])).toBeGreaterThanOrEqual(4.5);
  });
});
