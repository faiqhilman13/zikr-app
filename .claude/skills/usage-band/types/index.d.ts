export type Limit = {
  /** `five_hour`, `seven_day`, ... */
  kind: string
  /** 0 to 100. */
  percentUsed: number
  /** ISO 8601. */
  resetsAt?: string
}

export type Tokens = { input: number; output: number; cached: number }

declare module 'claude-code' {
  interface PluginState {
    'usage-band': {
      limits: Limit[]
      cost: number | null
      tokens: Tokens
      /** Bumped every minute so the countdowns redraw. */
      tick: number
      /** When the session last did something: a prompt sent, a turn ended. */
      lastActive: number | null
      /** The context window's fill, 0 to 100; null until measured, and after a compaction. */
      fill: number | null
      /** The `lastActive` the compact nudge was dismissed (or acted on) for. */
      dismissed: number | null
      /** True while the nudge's compaction runs. */
      compacting: boolean
    }
  }
}
