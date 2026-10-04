// Pure drawing helpers: figures in, strings out.

import type { Limit } from '../types'

export const WINDOW_MS: Record<string, number> = {
  five_hour: 5 * 3600_000,
  seven_day: 7 * 86400_000,
}
export const LABEL: Record<string, string> = { five_hour: '5h', seven_day: '7d' }

/** 15600 → "15.6k", 954200 → "954.2k", 3000 → "3.0k", 2_100_000 → "2.1M". */
export function tokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${Math.round(n)}`
}

export function usd(n: number): string {
  return `$${n.toFixed(2)}`
}

/** "40m", "2h 40m", "1d 7h". */
export function countdown(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60_000))
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m % 60}m`
}

/** How far through its window a limit is, 0 to 1; null when unknown. */
export function elapsed(limit: Limit, now: number): number | null {
  const span = WINDOW_MS[limit.kind]
  if (!span || !limit.resetsAt) return null
  const left = Date.parse(limit.resetsAt) - now
  if (Number.isNaN(left)) return null
  return Math.min(1, Math.max(0, 1 - left / span))
}

/** Green while on pace, amber when ahead of it, red near the cap. */
export function barColor(percent: number, pace: number | null): string {
  if (percent >= 90) return '#d0573f'
  if (pace !== null && percent / 100 > pace + 0.05) return '#d39b2c'
  return '#8fb069'
}

// ---- SVG pills (desktop, VS Code, mobile) ----

export type Theme = { bg: string; fg: string; bgDark: string; fgDark: string }

export const THEMES = {
  five_hour: { bg: '#d6e7df', fg: '#4a8a72', bgDark: '#22372f', fgDark: '#7cc2a6' },
  seven_day: { bg: '#e4ddf0', fg: '#7656c2', bgDark: '#2f2840', fgDark: '#ab93e6' },
  input: { bg: '#f1dbd5', fg: '#c25a3d', bgDark: '#3d2621', fgDark: '#ec8f72' },
  output: { bg: '#d9e9d8', fg: '#4f9455', bgDark: '#233425', fgDark: '#86c88b' },
  cached: { bg: '#d8ddf6', fg: '#4d63d4', bgDark: '#252b45', fgDark: '#8c9df0' },
  cost: { bg: '#efe6cf', fg: '#b08a26', bgDark: '#3a3220', fgDark: '#e0bb57' },
} satisfies Record<string, Theme>

const ICON = {
  gauge: '<path d="M3 11.5a5 5 0 1 1 10 0"/><path d="M8 11.5l2.6-3.1"/>',
  clock:
    '<path d="M3.3 8a4.7 4.7 0 1 0 1.4-3.3"/><path d="M3 2.8v2.4h2.4"/><path d="M8 5.4V8l1.8 1.2"/>',
  calendar:
    '<rect x="2.5" y="3.5" width="11" height="10" rx="1.6"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3"/>' +
    '<text x="8" y="12.4" font-size="5.6" text-anchor="middle" stroke="none" fill="currentColor" font-weight="700">7</text>',
  upload:
    '<path d="M8 9.5V2.5M5.2 5.2L8 2.4l2.8 2.8"/><path d="M2.5 9.5v2.8a1.2 1.2 0 0 0 1.2 1.2h8.6a1.2 1.2 0 0 0 1.2-1.2V9.5"/>',
  download:
    '<path d="M8 2.5v7M5.2 6.8L8 9.6l2.8-2.8"/><path d="M2.5 9.5v2.8a1.2 1.2 0 0 0 1.2 1.2h8.6a1.2 1.2 0 0 0 1.2-1.2V9.5"/>',
  layers: '<path d="M8 2.2l6 3-6 3-6-3z"/><path d="M2 8.2l6 3 6-3M2 11.2l6 3 6-3"/>',
  coin:
    '<circle cx="8" cy="8" r="5.6"/>' +
    '<text x="8" y="10.6" font-size="7.5" text-anchor="middle" stroke="none" fill="currentColor" font-weight="700">$</text>',
}

export type Part =
  | { icon: keyof typeof ICON }
  | { text: string; bold?: boolean }
  | { bar: number; tick: number | null; color: string }
  | { sep: true }

export const PILL_H = 22
const PAD = 8
const GAP = 5
const CHAR = 7.25
const FONT = 12.5
const BAR_W = 38
const ICON_S = 14

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function width(p: Part): number {
  if ('icon' in p) return ICON_S
  if ('text' in p) return p.text.length * CHAR
  if ('bar' in p) return BAR_W
  return 1
}

/** One rounded pill, its parts laid left to right, in light and dark. */
export function pill(theme: Theme, parts: Part[]): { source: string; width: number } {
  const H = PILL_H
  let x = PAD
  const body: string[] = []
  parts.forEach((p, i) => {
    const prev = parts[i - 1]
    if (prev) x += 'sep' in p || 'sep' in prev ? GAP + 1 : GAP
    if ('icon' in p) {
      body.push(
        `<g class="ic" transform="translate(${x} ${(H - ICON_S) / 2}) scale(${ICON_S / 16})" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICON[p.icon]}</g>`,
      )
    } else if ('text' in p) {
      body.push(
        `<text class="tx" x="${x}" y="${H / 2 + 4.3}" font-size="${FONT}"${p.bold ? ' font-weight="700"' : ''}>${esc(p.text)}</text>`,
      )
    } else if ('bar' in p) {
      const y = H / 2 - 2.5
      const fill = (Math.max(0, Math.min(100, p.bar)) / 100) * BAR_W
      body.push(`<rect class="tr" x="${x}" y="${y}" width="${BAR_W}" height="5" rx="2.5"/>`)
      if (fill > 0) {
        body.push(`<rect x="${x}" y="${y}" width="${Math.max(5, fill)}" height="5" rx="2.5" fill="${p.color}"/>`)
      }
      if (p.tick !== null) {
        const tx = x + p.tick * BAR_W
        body.push(`<rect class="tk" x="${tx - 1}" y="${H / 2 - 6}" width="2" height="12" rx="1"/>`)
      }
    } else {
      body.push(`<rect class="sp" x="${x}" y="${H / 2 - 6}" width="1" height="12"/>`)
    }
    x += width(p)
  })
  const W = Math.ceil(x + PAD)
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<style>` +
    `.bg{fill:${theme.bg}}.ic{color:${theme.fg}}.tx{fill:#3a3a3a;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}` +
    `.tr{fill:#c9c9c4}.tk{fill:#3a3a3a}.sp{fill:#3a3a3a;opacity:.18}` +
    `@media (prefers-color-scheme:dark){.bg{fill:${theme.bgDark}}.ic{color:${theme.fgDark}}.tx,.tk{fill:#e6e6e6}.tr{fill:#555}.sp{fill:#fff}}` +
    `</style>` +
    `<rect class="bg" width="${W}" height="${H}" rx="${H / 2}"/>${body.join('')}</svg>`
  return { source, width: W }
}

// ---- terminal ----

/** A 10-cell bar split into its filled cells and its track, the pace tick laid over. */
export function textBar(percent: number, pace: number | null): { fill: string; track: string } {
  const cells = 10
  const n = Math.round(Math.min(100, Math.max(0, percent)) / (100 / cells))
  const t = pace === null ? -1 : Math.min(cells - 1, Math.floor(pace * cells))
  let fill = ''
  let track = ''
  for (let i = 0; i < cells; i++) {
    if (i < n) fill += i === t ? '┃' : '━'
    else track += i === t ? '┃' : '─'
  }
  return { fill, track }
}
