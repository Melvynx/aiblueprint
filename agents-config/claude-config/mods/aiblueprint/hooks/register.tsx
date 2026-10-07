import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionUsage } from 'claude-code'

import type { Limit, Usage } from '../types'

const SESSION_MS = 5 * 3600 * 1000
const WEEK_MS = 7 * 24 * 3600 * 1000
let limitsCache: Promise<string | undefined> | undefined
// The status line script's cache under $HOME/.claude; undefined when HOME cannot be read.
const limitsCachePath = ($: EngineInterface) =>
  (limitsCache ??= $.process
    .run(['printenv', 'HOME'])
    .then(({ stdout }) => stdout.trim() ? `${stdout.trim()}/.claude/scripts/statusline/data/usage-limits-cache.json` : undefined)
    .catch(() => undefined))

const GREEN = '#57ab5a'
const YELLOW = '#d4a72c'
const ORANGE = '#ff8700'
const RED = '#e5534b'
const TRACK = '#8b8b8b'
const BLUE = '#539bf5'
const BAR_WIDTH = 36

const usageAtom = atom({ plugin: 'aiblueprint', key: 'usage' } as const, null)
const settingsOpenAtom = atom({ plugin: 'aiblueprint', key: 'settingsOpen' } as const, false)

type Options = {
  showSession: boolean
  showFiveHour: boolean
  showWeek: boolean
  showBars: boolean
  showPace: boolean
  showReset: boolean
  sessionLabel: string
  fiveHourLabel: string
  weekLabel: string
  refreshSeconds: number
}

const DEFAULTS: Options = {
  showSession: true,
  showFiveHour: true,
  showWeek: true,
  showBars: true,
  showPace: true,
  showReset: true,
  sessionLabel: 'S',
  fiveHourLabel: '5h',
  weekLabel: 'Week',
  refreshSeconds: 30,
}

// The toggles the ⚙ row shows, in order.
const TOGGLES = [
  { field: 'showSession', label: 'Session' },
  { field: 'showFiveHour', label: '5h' },
  { field: 'showWeek', label: 'Week' },
  { field: 'showBars', label: 'Barres' },
  { field: 'showPace', label: 'Pace' },
  { field: 'showReset', label: 'Reset' },
] as const

let isRunning = false
let isPending = false

function fillColor(percent: number) {
  if (percent < 50) return GREEN
  if (percent < 75) return YELLOW
  if (percent < 90) return ORANGE
  return RED
}

// Pace > 0: under the week's pace (budget left), < 0: burning faster than time passes.
function paceColor(pace: number) {
  if (pace >= 0) return GREEN
  if (pace > -10) return YELLOW
  return RED
}

function formatPace(pace: number) {
  return `${pace >= 0 ? '+' : ''}${pace.toFixed(1)}%`
}

function formatCost(cost: number) {
  return `$${cost < 10 ? cost.toFixed(2) : cost.toFixed(1)}`
}

// One unit only, the biggest that fits: 6j, 13h, 45m.
function formatResetsIn(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60_000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}j`
}

function barSvg(percent: number, color: string) {
  const filled = Math.max(0, Math.min(BAR_WIDTH, Math.round((percent / 100) * BAR_WIDTH)))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BAR_WIDTH}" height="4" viewBox="0 0 ${BAR_WIDTH} 4"><rect width="${BAR_WIDTH}" height="4" rx="2" fill="${TRACK}" fill-opacity="0.25"/><rect width="${filled}" height="4" rx="2" fill="${color}"/></svg>`
}

function barText(percent: number) {
  const filled = Math.max(0, Math.min(5, Math.round((percent / 100) * 5)))
  return `${'█'.repeat(filled)}${'░'.repeat(5 - filled)}`
}

// The same windows as the Plan usage limits panel: Session = the 5-hour limit, Week = the 7-day limit.
function limitOf(usage: SessionUsage, kind: string, windowMs: number, now: number): Limit | undefined {
  const limit = usage.rateLimits.find(item => item.kind === kind)
  if (!limit) return undefined
  const resetsInMs = limit.resetsAt ? new Date(limit.resetsAt).getTime() - now : undefined
  const elapsedPercent = resetsInMs !== undefined ? ((windowMs - resetsInMs) / windowMs) * 100 : undefined
  return {
    percent: limit.percentUsed,
    pace: elapsedPercent !== undefined ? elapsedPercent - limit.percentUsed : undefined,
    resetsInMs,
  }
}

function contextOf(usage: SessionUsage): Usage['context'] {
  const { tokens, window, percent } = usage.context
  const value = percent ?? (tokens !== undefined && window > 0 ? (tokens / window) * 100 : undefined)
  return value === undefined ? undefined : { percent: value, tokens, window }
}

function formatTokens(count: number) {
  return count >= 1000 ? `${Math.round(count / 1000)}k` : `${count}`
}

function formatContext(context: NonNullable<Usage['context']>) {
  const tokens = context.tokens ?? Math.round((context.percent / 100) * context.window)
  return `${formatTokens(tokens)}/${formatTokens(context.window)}`
}

// A pill with the token count written inside, like the context window bar. A darker fill and a
// shadowed label keep the text readable over both the filled part and the empty track.
const PILL_WIDTH = 84
const PILL_HEIGHT = 16

function contextSvg(context: NonNullable<Usage['context']>) {
  const filled = Math.max(0, Math.min(PILL_WIDTH, Math.round((context.percent / 100) * PILL_WIDTH)))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PILL_WIDTH}" height="${PILL_HEIGHT}" viewBox="0 0 ${PILL_WIDTH} ${PILL_HEIGHT}"><defs><clipPath id="p"><rect width="${PILL_WIDTH}" height="${PILL_HEIGHT}" rx="${PILL_HEIGHT / 2}"/></clipPath></defs><g clip-path="url(#p)"><rect width="${PILL_WIDTH}" height="${PILL_HEIGHT}" fill="#3a3f47"/><rect width="${filled}" height="${PILL_HEIGHT}" fill="#2f6fd1"/></g><text x="${PILL_WIDTH / 2}" y="11.5" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, system-ui, sans-serif" font-size="10.5" font-weight="700" fill="#ffffff" stroke="#000000" stroke-opacity="0.35" stroke-width="2" paint-order="stroke">${formatContext(context)}</text></svg>`
}

function compute(usage: SessionUsage, now: number): Usage {
  return {
    cost: usage.cost?.usd ?? 0,
    context: contextOf(usage),
    session: limitOf(usage, 'five_hour', SESSION_MS, now),
    week: limitOf(usage, 'seven_day', WEEK_MS, now),
  }
}

// Keeps the terminal status line script on the engine's own readings, so it never calls the usage API.
async function seedLimitsCache($: EngineInterface, usage: SessionUsage, now: number) {
  const window = (kind: string) => {
    const limit = usage.rateLimits.find(item => item.kind === kind)
    return limit ? { utilization: limit.percentUsed, resets_at: limit.resetsAt ?? null } : null
  }
  const sevenDay = window('seven_day')
  if (!sevenDay) return
  const path = await limitsCachePath($)
  if (!path) return
  await $.fs
    .write(path, JSON.stringify({ data: { five_hour: window('five_hour'), seven_day: sevenDay }, timestamp: now }, null, 2))
    .catch(() => undefined)
}

async function refresh($: EngineInterface): Promise<void> {
  if (isRunning) {
    isPending = true
    return
  }
  isRunning = true
  try {
    const [usage, now] = await Promise.all([$.session.usage(), $.clock.now()])
    const next = compute(usage, now)
    await update($, usageAtom, () => next)
    await seedLimitsCache($, usage, now)
  } catch {
    // keep the last band
  } finally {
    isRunning = false
  }
  if (isPending) {
    isPending = false
    await refresh($)
  }
}

// Writes one userConfig field the way /config does; the module reloads with the new options.
async function setOption($: EngineInterface, field: string, value: boolean) {
  const rows = await $.config.list()
  const row = rows.find(item => item.key.startsWith('aiblueprint') && item.key.endsWith(`.${field}`))
  if (!row) {
    $.ui.toast(`aiblueprint: réglage ${field} introuvable dans /config`)
    return
  }
  const { deny } = await $.config.set({ key: row.key, value })
  if (deny) $.ui.toast(`aiblueprint: ${deny}`)
}

async function toggleSettings($: EngineInterface) {
  await update($, settingsOpenAtom, isOpen => !isOpen)
}

export const register: Register = (on, rawOptions) => {
  const options: Options = { ...DEFAULTS, ...(rawOptions as Partial<Options>) }
  const refreshMs = Math.max(5, options.refreshSeconds) * 1000

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    $.ui.status(undefined)
    void refresh($)
    $.clock.every(refreshMs, () => refresh($))
    return started
  })

  on('session.measure', async ($, e, next) => {
    const measured = await next(e)
    void refresh($)
    return measured
  })

  on('turn.complete', async ($, e, next) => {
    const completed = await next(e)
    void refresh($)
    return completed
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const [usage, isSettingsOpen] = await Promise.all([read($, usageAtom), read($, settingsOpenAtom)])
    if (e.props.hasSurvey || usage === null) return next(e)

    const limits = [
      { key: 'five-hour', label: options.fiveHourLabel, limit: options.showFiveHour ? usage.session : undefined },
      { key: 'week', label: options.weekLabel, limit: options.showWeek ? usage.week : undefined },
    ].filter((item): item is { key: string; label: string; limit: Limit } => item.limit !== undefined)

    const { Box, Text, Button } = $.ui.resolve(e)
    const settingsRow = isSettingsOpen && (
      <Box key="settings" flexDirection="row" gap={1} flexWrap="wrap">
        {TOGGLES.map(({ field, label }) => (
          <Button
            key={`toggle-${field}`}
            label={`${options[field] ? '✓' : '·'} ${label}`}
            dimColor={!options[field]}
            onPress={() => setOption($, field, !options[field])}
          />
        ))}
      </Box>
    )
    const gear = <Button key="gear" label="⚙" plain dimColor={!isSettingsOpen} onPress={() => toggleSettings($)} />

    if (e.surface === 'terminal') {
      return (
        <Box flexDirection="column">
          <Box flexDirection="row" gap={3}>
            {options.showSession && (
              <Text key="session">
                <Text dimColor>{options.sessionLabel} </Text>
                {usage.context !== undefined && <Text color={BLUE}>{options.showBars ? `${barText(usage.context.percent)} ` : ''}{formatContext(usage.context)} </Text>}
                <Text bold>{formatCost(usage.cost)}</Text>
              </Text>
            )}
            {limits.map(({ key, label, limit }) => (
              <Text key={key}>
                <Text dimColor>{label} </Text>
                {options.showBars && <Text color={fillColor(limit.percent)}>{barText(limit.percent)} </Text>}
                <Text bold>{Math.round(limit.percent)}%</Text>
                {options.showPace && limit.pace !== undefined && <Text color={paceColor(limit.pace)}> {formatPace(limit.pace)}</Text>}
                {options.showReset && limit.resetsInMs !== undefined && <Text dimColor> {formatResetsIn(limit.resetsInMs)}</Text>}
              </Text>
            ))}
            {gear}
          </Box>
          {settingsRow}
        </Box>
      )
    }

    const { Svg } = $.ui.resolve(e)
    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="row" gap={1} flexWrap="wrap" alignItems="center">
          {options.showSession && (
            <Box key="session" flexDirection="row" alignItems="center" gap={1} borderStyle="round" borderDimColor paddingX={1}>
              <Text dimColor>{options.sessionLabel}</Text>
              {usage.context !== undefined && (
                <Svg source={contextSvg(usage.context)} alt={`Contexte ${formatContext(usage.context)}`} width={PILL_WIDTH} height={PILL_HEIGHT} />
              )}
              <Text bold>{formatCost(usage.cost)}</Text>
            </Box>
          )}
          {limits.map(({ key, label, limit }) => (
            <Box key={key} flexDirection="row" alignItems="center" gap={1} borderStyle="round" borderDimColor paddingX={1}>
              <Text dimColor>{label}</Text>
              {options.showBars && <Svg source={barSvg(limit.percent, fillColor(limit.percent))} alt={`${label} ${Math.round(limit.percent)}%`} width={BAR_WIDTH} height={4} />}
              <Text bold>{Math.round(limit.percent)}%</Text>
              {options.showPace && limit.pace !== undefined && <Text bold color={paceColor(limit.pace)}>{formatPace(limit.pace)}</Text>}
              {options.showReset && limit.resetsInMs !== undefined && <Text dimColor>{formatResetsIn(limit.resetsInMs)}</Text>}
            </Box>
          ))}
          {gear}
        </Box>
        {settingsRow}
      </Box>
    )
  })
}
