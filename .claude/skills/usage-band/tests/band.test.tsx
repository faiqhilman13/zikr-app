import type { On, RenderElement } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { countdown, elapsed, pill, textBar, THEMES, tokens, usd } from '../hooks/pills'

const BAND = {
  plugin: 'usage-band',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 20,
    bodyColumns: 160,
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

const NOW = Date.parse('2026-10-03T12:00:00Z')
const LIMITS = [
  { kind: 'seven_day', percentUsed: 58, resetsAt: '2026-10-04T19:00:00Z' },
  { kind: 'five_hour', percentUsed: 20.4, resetsAt: '2026-10-03T14:40:00Z' },
]

// The engine beneath the plugin: measure echoes, the band underneath is one
// keyed Box (standing in for token-weather), turns pass their usage on.
function engine(on: On) {
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  on('turn.complete', (_$, e) => ({ text: e.answer, usage: e.usage }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return h(Text, {}, 'beneath') as RenderElement
  })
}

async function oneTurn($: Engine) {
  await $.session.measure({ context: { window: 200_000 }, rateLimits: LIMITS, cost: { usd: 4.32 }, changed: ['rateLimits', 'cost'] })
  await $.turn.complete({
    answer: 'ok',
    durationMs: 1,
    isAborted: false,
    turnId: 't1',
    reason: 'answer',
    usage: { model: 'claude-opus-5-5', input_tokens: 600, cache_creation_input_tokens: 15_000, output_tokens: 3_000, cache_read_input_tokens: 954_200 },
  } as never)
}

test('formatting', async () => {
  expect(tokens(15_600)).toBe('15.6k')
  expect(tokens(3_000)).toBe('3.0k')
  expect(tokens(954_200)).toBe('954.2k')
  expect(usd(4.3217)).toBe('$4.32')
  expect(countdown(2 * 3600_000 + 40 * 60_000)).toBe('2h 40m')
  expect(countdown(31 * 3600_000)).toBe('1d 7h')
  expect(countdown(40 * 60_000)).toBe('40m')
  // 2h 40m left of 5h: 2h 20m gone.
  expect(Math.round(elapsed(LIMITS[1]!, NOW)! * 300)).toBe(140)
  expect(textBar(20, 0.5)).toEqual({ fill: '━━', track: '───┃────' })
  expect(pill(THEMES.cost, [{ icon: 'coin' }, { text: '$4.32' }]).source).toContain('$4.32')
})

test('nothing to show passes to the band beneath', async ($, on) => {
  engine(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.findAll({ type: 'Svg' })).toEqual([])
  expect(await ui.find({ type: 'Text', text: 'beneath' })).toBeDefined()
})

test('desktop draws the pills over the band beneath', async ($, on) => {
  engine(on)
  mock.clock(on, { now: NOW })
  await oneTurn($)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const alts = (await ui.findAll({ type: 'Svg' })).map(s => s.props.alt)
  expect(alts).toEqual([
    '5h limit 20% used, resets in 2h 40m',
    '7d limit 58% used, resets in 1d 7h',
    '15.6k input tokens',
    '3.0k output tokens',
    '954.2k cached tokens read',
    '$4.32 spent',
  ])
  expect(await ui.find({ type: 'Text', text: 'beneath' })).toBeDefined()
})

test('the terminal draws them as text', async ($, on) => {
  engine(on)
  mock.clock(on, { now: NOW })
  await oneTurn($)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const all = (await ui.findAll({ type: 'Box' }))[0]?.text ?? ''
  expect(all).toContain('5h')
  expect(all).toContain('20%')
  expect(all).toContain('⟲ 2h 40m')
  expect(all).toContain('↑ 15.6k')
  expect(all).toContain('↓ 3.0k')
  expect(all).toContain('≋ 954.2k')
  expect(all).toContain('$4.32')
  expect(all).toContain('beneath')
})

// ---- the compact nudge ----

const MIN = 60_000

async function idleSession($: Engine, on: On, percent: number, idleMin: number) {
  const compactions: string[] = []
  on('session.compact', (_$, e) => {
    compactions.push(e.trigger)
    return { messages: [{ role: 'user', text: 'summary', toolUses: [] }] } as never
  })
  const clock = mock.clock(on, { now: NOW })
  await $.session.measure({
    context: { tokens: percent * 2_000, window: 200_000, percent },
    rateLimits: [],
    changed: ['context'],
  })
  await oneTurn($)
  await clock.advance(idleMin * MIN)
  return compactions
}

const nudgeText = (ui: { find: (q: { type: 'Text'; text: RegExp }) => Promise<unknown> }) =>
  ui.find({ type: 'Text', text: /Cache likely cold/ })

test('offers to compact a big context after a long idle', async ($, on) => {
  engine(on)
  const compactions = await idleSession($, on, 62, 61)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    const text = (await ui.find({ type: 'Text', text: /Cache likely cold/ }))?.text
    expect(text).toBe('❄ Cache likely cold · idle 1h 1m · 62% full')
    await ui.unmount()
  }
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.press({ key: 'compact' })
  expect(compactions.length).toBe(1)
  const again = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await nudgeText(again)).toBeUndefined()
})

test('"Not now" dismisses it until the next idle', async ($, on) => {
  engine(on)
  const compactions = await idleSession($, on, 62, 61)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'dismiss' })
  expect(compactions).toEqual([])
  const again = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await nudgeText(again)).toBeUndefined()
})

test('stays quiet on a small context or a short idle', async ($, on) => {
  engine(on)
  await idleSession($, on, 20, 90)
  expect(await nudgeText(await $.ui.mount({ ...BAND, surface: 'desktop' }))).toBeUndefined()
})

test('stays quiet before the idle threshold', async ($, on) => {
  engine(on)
  await idleSession($, on, 80, 10)
  expect(await nudgeText(await $.ui.mount({ ...BAND, surface: 'desktop' }))).toBeUndefined()
})

test('the idle threshold is a setting', { options: { idleMinutes: 5 } }, async ($, on) => {
  engine(on)
  await idleSession($, on, 80, 10)
  expect(await nudgeText(await $.ui.mount({ ...BAND, surface: 'desktop' }))).toBeDefined()
})
