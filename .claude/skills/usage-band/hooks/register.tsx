import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement } from 'claude-code'

import type { Limit, Tokens } from '../types'
import {
  LABEL,
  PILL_H,
  THEMES,
  barColor,
  countdown,
  elapsed,
  pill,
  textBar,
  tokens as fmt,
  usd,
} from './pills'
import type { Part } from './pills'

const limits = atom({ plugin: 'usage-band', key: 'limits' } as const, [])
const cost = atom({ plugin: 'usage-band', key: 'cost' } as const, null)
const totals = atom({ plugin: 'usage-band', key: 'tokens' } as const, {
  input: 0,
  output: 0,
  cached: 0,
})
const tick = atom({ plugin: 'usage-band', key: 'tick' } as const, 0)
const lastActive = atom({ plugin: 'usage-band', key: 'lastActive' } as const, null)
const fill = atom({ plugin: 'usage-band', key: 'fill' } as const, null)
const dismissed = atom({ plugin: 'usage-band', key: 'dismissed' } as const, null)
const compacting = atom({ plugin: 'usage-band', key: 'compacting' } as const, false)

const ORDER = ['five_hour', 'seven_day']

async function remember(
  $: EngineInterface,
  rateLimits: readonly Limit[],
  spent: number | undefined,
) {
  const shown = rateLimits
    .filter(l => ORDER.includes(l.kind))
    .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
    .map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt }))
  if (shown.length > 0) await update($, limits, () => shown)
  if (spent !== undefined) await update($, cost, () => spent)
}

/** Marks the session active now: a prompt sent, a turn ended. */
async function touch($: EngineInterface) {
  const now = await $.clock.now()
  await update($, lastActive, () => now)
}

function limitParts(l: Limit, now: number): { parts: Part[]; alt: string } {
  const pace = elapsed(l, now)
  const label = LABEL[l.kind] ?? l.kind
  const pct = `${Math.round(l.percentUsed)}%`
  const left = l.resetsAt ? countdown(Date.parse(l.resetsAt) - now) : null
  const parts: Part[] = [
    { icon: l.kind === 'seven_day' ? 'calendar' : 'gauge' },
    { text: label },
    { bar: l.percentUsed, tick: pace, color: barColor(l.percentUsed, pace) },
    { text: pct, bold: true },
  ]
  if (left) parts.push({ sep: true }, { icon: 'clock' }, { text: left })
  return { parts, alt: `${label} limit ${pct} used${left ? `, resets in ${left}` : ''}` }
}

export const register: Register = (on, options) => {
  const idleMs = Number(options.idleMinutes ?? 60) * 60_000
  const minPercent = Number(options.minPercent ?? 40)

  on('prompt.submit', async ($, e, next) => {
    await touch($)
    return next(e)
  })

  on('session.start', async ($, e, next) => {
    const u = await $.session.usage()
    await remember($, u.rateLimits, u.cost?.usd)
    // Redraw the countdowns once a minute.
    $.clock.every(60_000, () => void update($, tick, n => n + 1))
    return next(e)
  })

  // Pushed after every turn, and whenever a rate-limit window moves a point.
  on('session.measure', async ($, e, next) => {
    await remember($, e.rateLimits, e.cost?.usd)
    // Absent right after a compaction, until the next response measures it.
    if (e.changed.includes('context')) await update($, fill, () => e.context.percent ?? null)
    return next(e)
  })

  // Each turn's tokens (subagents' included), summed over the session.
  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    if (!e.agentId) await touch($)
    const u = r.usage ?? e.usage
    if (u) {
      await update($, totals, (t): Tokens => ({
        input: t.input + u.input_tokens + u.cache_creation_input_tokens,
        output: t.output + u.output_tokens,
        cached: t.cached + u.cache_read_input_tokens,
      }))
    }
    return r
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // Stack on top of whatever the plugins beneath draw (token-weather, say).
    const below = await next(e)
    if (e.props.hasSurvey) return below

    await read($, tick)
    const ls = await read($, limits)
    const spent = await read($, cost)
    const t = await read($, totals)
    const hasTokens = t.input + t.output + t.cached > 0
    const now = await $.clock.now()
    const { Box, Text, Button } = $.ui.resolve(e)

    // The compact nudge: idle past the cache's life with a big context, so the
    // next turn re-sends it all at full price anyway. Compacting now makes that
    // a small summary instead.
    const since = await read($, lastActive)
    const full = await read($, fill)
    const isCompacting = await read($, compacting)
    const isNudging =
      isCompacting ||
      (!e.props.isWorking &&
        since !== null &&
        full !== null &&
        full >= minPercent &&
        now - since >= idleMs &&
        (await read($, dismissed)) !== since)
    const nudge = !isNudging ? null : isCompacting ? (
      <Text color="#7fb6e6">❄ Compacting…</Text>
    ) : (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Text color="#7fb6e6">
          ❄ Cache likely cold · idle {countdown(now - (since ?? now))} · {full}% full
        </Text>
        <Button
          key="compact"
          label="Compact first"
          variant="primary"
          onPress={async () => {
            await update($, dismissed, () => since)
            await update($, compacting, () => true)
            try {
              const r = await $.session.compact()
              if (r.skip !== undefined) $.ui.toast(`Compaction skipped: ${r.skip}`)
              else await update($, fill, () => null)
            } finally {
              await update($, compacting, () => false)
            }
          }}
        />
        <Button key="dismiss" label="Not now" onPress={() => update($, dismissed, () => since)} />
      </Box>
    )

    if (ls.length === 0 && spent === null && !hasTokens) {
      return nudge ? (
        <Box flexDirection="column">
          {nudge}
          {below}
        </Box>
      ) : (
        below
      )
    }

    let row: RenderElement
    if (e.surface !== 'terminal') {
      // Desktop, VS Code, mobile: each pill an SVG, for the rounded shapes.
      const { Svg } = $.ui.resolve(e)
      const draw = (theme: keyof typeof THEMES, parts: Part[], alt: string) => {
        const p = pill(THEMES[theme], parts)
        return <Svg source={p.source} alt={alt} width={p.width} height={PILL_H} />
      }
      row = (
        <Box flexDirection="row" flexWrap="wrap" alignItems="center" columnGap={1}>
          {ls.map(l => {
            const { parts, alt } = limitParts(l, now)
            return draw(l.kind === 'seven_day' ? 'seven_day' : 'five_hour', parts, alt)
          })}
          {hasTokens
            ? draw('input', [{ icon: 'upload' }, { text: fmt(t.input) }], `${fmt(t.input)} input tokens`)
            : null}
          {hasTokens
            ? draw('output', [{ icon: 'download' }, { text: fmt(t.output) }], `${fmt(t.output)} output tokens`)
            : null}
          {hasTokens
            ? draw('cached', [{ icon: 'layers' }, { text: fmt(t.cached) }], `${fmt(t.cached)} cached tokens read`)
            : null}
          {spent !== null
            ? draw('cost', [{ icon: 'coin' }, { text: usd(spent) }], `${usd(spent)} spent`)
            : null}
          {/* The band beneath (token-weather) rides the same row when it fits. */}
          {below}
        </Box>
      )
      return nudge ? (
        <Box flexDirection="column">
          {nudge}
          {row}
        </Box>
      ) : (
        row
      )
    } else {
      // The terminal: the same pills as coloured text.
      row = (
        <Box flexDirection="row" flexWrap="wrap">
          {ls.map(l => {
            const pace = elapsed(l, now)
            const theme = THEMES[l.kind === 'seven_day' ? 'seven_day' : 'five_hour']
            const bar = textBar(l.percentUsed, pace)
            const left = l.resetsAt ? countdown(Date.parse(l.resetsAt) - now) : null
            return (
              <Text>
                <Text color={theme.fgDark}>
                  {l.kind === 'seven_day' ? '▦' : '◔'} {LABEL[l.kind] ?? l.kind}{' '}
                </Text>
                <Text color={barColor(l.percentUsed, pace)}>{bar.fill}</Text>
                <Text dimColor>{bar.track}</Text>
                <Text bold> {Math.round(l.percentUsed)}%</Text>
                {left ? <Text dimColor> · ⟲ {left}</Text> : null}
                {'   '}
              </Text>
            )
          })}
          {hasTokens ? (
            <Text>
              <Text color={THEMES.input.fgDark}>↑ {fmt(t.input)}</Text>
              {'  '}
              <Text color={THEMES.output.fgDark}>↓ {fmt(t.output)}</Text>
              {'  '}
              <Text color={THEMES.cached.fgDark}>≋ {fmt(t.cached)}</Text>
              {'   '}
            </Text>
          ) : null}
          {spent !== null ? <Text color={THEMES.cost.fgDark}>{usd(spent)}</Text> : null}
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        {nudge}
        {row}
        {below}
      </Box>
    )
  })
}
