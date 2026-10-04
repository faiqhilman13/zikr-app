export type Forecast = {
  /** Context tokens after each recent turn, oldest first, at most 13. */
  samples: number[]
  /** The model's context window, in tokens. */
  window: number
}

declare module 'claude-code' {
  interface PluginState {
    'token-weather': { forecast: Forecast | null }
  }
}
