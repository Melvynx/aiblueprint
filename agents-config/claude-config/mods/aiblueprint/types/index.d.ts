export type Limit = { percent: number; pace?: number; resetsInMs?: number }

export type Usage = {
  cost: number
  context?: { percent: number; tokens?: number; window: number }
  session?: Limit
  week?: Limit
}

declare module 'claude-code' {
  interface PluginState {
    aiblueprint: { usage: Usage | null; settingsOpen: boolean }
  }
}
