import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Forecast } from '../types'
import { TURNS, delta, sky, sparkSvg, sparkline, tokens } from './weather'

const forecast = atom({ plugin: 'token-weather', key: 'forecast' } as const, null)

export const register: Register = on => {
  // The engine measures the session after every main-thread turn; record the
  // context fill each time it moved.
  on('session.measure', async ($, e, next) => {
    const { tokens: used, window } = e.context
    if (e.changed.includes('context') && used !== undefined) {
      await update($, forecast, (prev): Forecast => ({
        // One more than drawn, so the oldest drawn bar still has a delta.
        samples: [...(prev?.samples ?? []), used].slice(-(TURNS + 1)),
        window,
      }))
    }
    return next(e)
  })

  // A new conversation (/clear, resume) starts a fresh forecast.
  on('session.end', async ($, e, next) => {
    await update($, forecast, () => null)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // Stack beneath whatever the plugins underneath draw (usage-band, say).
    const below = await next(e)
    const f = await read($, forecast)
    const used = f?.samples[f.samples.length - 1]
    if (e.props.hasSurvey || !f || used === undefined || f.window <= 0) {
      return below
    }

    const { Box, Text } = $.ui.resolve(e)
    const percent = Math.round((used / f.window) * 100)
    const s = sky(percent)
    const change = delta(f.samples)

    return (
      <Box flexDirection="column">
        {below}
        <Box alignItems="center">
          <Text color={s.color} bold>
            {s.icon} {s.word}
          </Text>
          <Text>
            {'  '}
            {percent}% · {tokens(used)} / {tokens(f.window)}
          </Text>
          {f.samples.length < 2 ? null : e.surface === 'terminal' ? (
            <Text color={s.color}>
              {'  '}
              {sparkline(f.samples.slice(-TURNS))}
            </Text>
          ) : (
            <Box marginLeft={1} alignItems="center">
              {(() => {
                const { Svg } = $.ui.resolve(e)
                const svg = sparkSvg(f.samples, s.color)
                return (
                  <Svg
                    source={svg.source}
                    alt={`context over the last ${Math.min(TURNS, f.samples.length)} turns`}
                    width={svg.width}
                    height={svg.height}
                  />
                )
              })()}
            </Box>
          )}
          {change ? (
            <Text dimColor>
              {'  '}
              {change}
            </Text>
          ) : null}
        </Box>
      </Box>
    )
  })
}
