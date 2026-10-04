// Pure helpers: no engine calls, so the tests can reach them directly.

export const TURNS = 12
const BARS = '▁▂▃▄▅▆▇█'

export type Sky = { icon: string; word: string; color: string }

export function sky(percent: number): Sky {
  if (percent < 25) return { icon: '☀', word: 'Clear', color: 'yellow' }
  if (percent < 50) return { icon: '☁', word: 'Cloudy', color: 'cyan' }
  if (percent < 75) return { icon: '☂', word: 'Showers', color: 'blue' }
  if (percent < 90) return { icon: '☇', word: 'Storm', color: 'magenta' }
  return { icon: '↯', word: 'Compact soon', color: 'red' }
}

/** 134400 → "134.4k", 200000 → "200k", 1000000 → "1M". */
export function tokens(n: number): string {
  const abs = Math.abs(n)
  const trim = (x: number) => x.toFixed(1).replace(/\.0$/, '')
  if (abs >= 1_000_000) return `${trim(n / 1_000_000)}M`
  if (abs >= 1_000) return `${trim(n / 1_000)}k`
  return `${n}`
}

/** One bar per sample, scaled against the tallest of them. */
export function sparkline(samples: number[]): string {
  const top = Math.max(...samples, 1)
  return samples
    .map(s => BARS[Math.min(BARS.length - 1, Math.round((s / top) * (BARS.length - 1)))])
    .join('')
}

/** "▲ +98.3k last turn", "▼ −120k last turn" after a compaction, "" with one sample. */
export function delta(samples: number[]): string {
  if (samples.length < 2) return ''
  const d = samples[samples.length - 1]! - samples[samples.length - 2]!
  if (d >= 0) return `▲ +${tokens(d)} last turn`
  return `▼ −${tokens(-d)} last turn`
}

const HEX: Record<string, string> = {
  yellow: '#e2b93b',
  cyan: '#3fb8c9',
  blue: '#5b8def',
  magenta: '#c45ec9',
  red: '#e0564a',
}

/** The same chart as small SVG bars for the remote surfaces, one slot per turn. */
export function sparkSvg(samples: number[], color: string): { source: string; width: number; height: number } {
  const W = 4
  const GAP = 1.5
  const H = 14
  const top = Math.max(...samples, 1)
  const width = Math.ceil(TURNS * (W + GAP) - GAP)
  const bars = samples
    .slice(-TURNS)
    .map((v, i) => {
      const h = Math.max(1.5, (v / top) * H)
      return `<rect x="${i * (W + GAP)}" y="${H - h}" width="${W}" height="${h}" rx="1"/>`
    })
    .join('')
  return {
    source: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}"><g fill="${HEX[color] ?? color}">${bars}</g></svg>`,
    width,
    height: H,
  }
}
