import type { On, RenderElement } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { delta, sky, sparkline, tokens } from '../hooks/weather'

const BAND = {
  plugin: 'token-weather',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 20,
    bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

// Stand in for the engine beneath the plugin: measure echoes, the band draws nothing of its own.
function engine(on: On) {
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  on('ui.render', ($, e) => h($.ui.resolve(e).Box, { key: 'engine' }) as RenderElement)
}

function measure(used: number, window = 200_000) {
  return {
    context: { tokens: used, window, percent: Math.round((used / window) * 100) },
    rateLimits: [],
    changed: ['context' as const],
  }
}

test('weather bands follow the percentage', async () => {
  expect(sky(0).word).toBe('Clear')
  expect(sky(24).color).toBe('yellow')
  expect(sky(25).word).toBe('Cloudy')
  expect(sky(50).word).toBe('Showers')
  expect(sky(75).word).toBe('Storm')
  expect(sky(89).color).toBe('magenta')
  expect(sky(90).word).toBe('Compact soon')
  expect(sky(90).color).toBe('red')
})

test('formatting', async () => {
  expect(tokens(134_400)).toBe('134.4k')
  expect(tokens(200_000)).toBe('200k')
  expect(tokens(1_000_000)).toBe('1M')
  expect(sparkline([0, 50, 100])).toBe('▁▅█')
  expect(delta([36_100, 134_400])).toBe('▲ +98.3k last turn')
  expect(delta([150_000, 30_000])).toBe('▼ −120k last turn')
  expect(delta([5])).toBe('')
})

test('one turn shows no chart yet', async ($, on) => {
  engine(on)
  await $.session.measure(measure(16_000))
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
  expect((await ui.findAll({ type: 'Text' })).length).toBe(2)
})

test('the band draws nothing before the first turn', async ($, on) => {
  engine(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.findAll({ type: 'Text' })).toEqual([])
})

test('the band forecasts after each turn', async ($, on) => {
  engine(on)
  await $.session.measure(measure(36_100))
  await $.session.measure(measure(134_400))
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    const texts = await ui.findAll({ type: 'Text' })
    const [sky, fill] = texts
    expect(sky?.text).toBe('☂ Showers')
    expect(sky?.props.color).toBe('blue')
    expect(fill?.text).toBe('  67% · 134.4k / 200k')
    expect(texts[texts.length - 1]?.text.trim()).toBe('▲ +98.3k last turn')
    if (surface === 'terminal') expect(texts[2]?.text.trim()).toBe('▃█')
    else expect((await ui.find({ type: 'Svg' }))?.props.alt).toBe('context over the last 2 turns')
    await ui.unmount()
  }
})

test('the chart keeps the last 12 turns', async ($, on) => {
  engine(on)
  for (let i = 1; i <= 20; i++) await $.session.measure(measure(i * 9_000))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const [sky, , spark] = await ui.findAll({ type: 'Text' })
  expect([...(spark?.text.trim() ?? '')].length).toBe(12)
  expect(sky?.text).toBe('↯ Compact soon') // 180k of 200k
  expect(sky?.props.color).toBe('red')
})
