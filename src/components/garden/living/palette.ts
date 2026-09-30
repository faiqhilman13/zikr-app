import type { TimeOfDay } from './growth';

/**
 * Colours for each time of day. Everything in the scene is painted through `tint`, which
 * leans each colour towards the light of the hour, so dusk and night recolour the whole
 * garden without a filter over animated layers (which would be costly on phones).
 */
export interface Palette {
  skyTop: string; skyBottom: string; glow: string;
  hillFar: string; hillNear: string; skyline: string;
  wall: string; wallShade: string; tile: string;
  groundTop: string; groundBottom: string;
  light: string; lightAmount: number;
  stars: number; night: boolean;
}

export const PALETTES: Record<TimeOfDay, Palette> = {
  dawn: {
    skyTop: '#7f8fc6', skyBottom: '#f7c9a6', glow: '#ffd9a8',
    hillFar: '#a9a3c6', hillNear: '#8e9b86', skyline: '#9c95b8',
    wall: '#efe0cf', wallShade: '#d7c1aa', tile: '#3f5ea8',
    groundTop: '#c0ab7f', groundBottom: '#9f8a5e',
    light: '#f4a48f', lightAmount: 0.1, stars: 0.15, night: false
  },
  day: {
    skyTop: '#6ea5d8', skyBottom: '#dcedf4', glow: '#fff3cf',
    hillFar: '#a2b8c7', hillNear: '#88a276', skyline: '#9fb3c4',
    wall: '#f5eee3', wallShade: '#ddd0bc', tile: '#2f56a8',
    groundTop: '#c6b385', groundBottom: '#a8935f',
    light: '#ffffff', lightAmount: 0, stars: 0, night: false
  },
  golden: {
    skyTop: '#56659f', skyBottom: '#f6b477', glow: '#ffcf7c',
    hillFar: '#a88d98', hillNear: '#8d8a5a', skyline: '#9a7f8e',
    wall: '#f3d8b9', wallShade: '#d9b48c', tile: '#35529a',
    groundTop: '#c79f66', groundBottom: '#9b7a4a',
    light: '#ff9d45', lightAmount: 0.13, stars: 0, night: false
  },
  night: {
    skyTop: '#070f2b', skyBottom: '#243768', glow: '#c9d6ff',
    hillFar: '#1d2a52', hillNear: '#18263e', skyline: '#1a2548',
    wall: '#5c6788', wallShade: '#465073', tile: '#8fa6e6',
    groundTop: '#343b58', groundBottom: '#222842',
    light: '#1b2550', lightAmount: 0.58, stars: 1, night: true
  }
};

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export function mix(from: string, to: string, amount: number) {
  const a = channels(from);
  const b = channels(to);
  return `#${a.map((value, i) => Math.round(value + (b[i] - value) * amount).toString(16).padStart(2, '0')).join('')}`;
}

export type Tint = (hex: string) => string;
export const tinter = (palette: Palette): Tint => (hex) => (palette.lightAmount ? mix(hex, palette.light, palette.lightAmount) : hex);
