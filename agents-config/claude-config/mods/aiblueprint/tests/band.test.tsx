import { expect, mock, test } from 'claude-code/testing'

const NOW = Date.parse('2026-10-05T01:00:00Z')

test('the band draws Session and Week on terminal and desktop', async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  on('fs.write', () => undefined)
  on('session.usage', () => ({ value: {
    startedAt: NOW - 60_000,
    context: { tokens: 78_000, window: 200_000, percent: 39 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 7, resetsAt: '2026-10-05T03:01:00Z' },
      { kind: 'seven_day', percentUsed: 6, resetsAt: '2026-10-11T09:00:00Z' },
    ],
    cost: { usd: 1.234 },
  } }) as never)
  on('session.measure', () => ({ changed: [] }) as never)
  await $.session.measure({ context: { tokens: 78_000, window: 200_000, percent: 39 }, rateLimits: [] } as never)
  await clock.advance(1_000)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: 'aiblueprint',
      surface,
      component: 'AbovePrompt',
      props: { hasSurvey: false, isWorking: false, maxRows: 10 },
    } as never)
    expect(await ui.find({ type: 'Text', text: /^S ?$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Week/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^5h/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /\$1\.23/ })).toBeDefined()
    if (surface === 'terminal') expect(await ui.find({ type: 'Text', text: /78k\/200k/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^7%$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^ ?2h$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /\+3\.\d%/ })).toBeDefined()
    await ui.unmount()
  }
})

test('the settings hide chips and the ⚙ row writes the option', { options: { showWeek: false, fiveHourLabel: '5H' } } as never, async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  const writes: unknown[] = []
  on('fs.write', () => undefined)
  on('session.usage', () => ({ value: {
    startedAt: NOW - 60_000,
    context: { tokens: 78_000, window: 200_000, percent: 39 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 7, resetsAt: '2026-10-05T03:01:00Z' },
      { kind: 'seven_day', percentUsed: 6, resetsAt: '2026-10-11T09:00:00Z' },
    ],
    cost: { usd: 1.234 },
  } }) as never)
  on('session.measure', () => ({ changed: [] }) as never)
  on('config.list', () => ({ value: [{ key: 'aiblueprint.showWeek', label: 'Week chip', kind: 'boolean', value: false }] }) as never)
  on('config.set', ($, e) => {
    writes.push(e)
    return { value: (e as { value: unknown }).value } as never
  })
  await $.session.measure({ context: { tokens: 78_000, window: 200_000, percent: 39 }, rateLimits: [] } as never)
  await clock.advance(1_000)

  const ui = await $.ui.mount({
    plugin: 'aiblueprint',
    surface: 'desktop',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 10 },
  } as never)
  expect(await ui.find({ type: 'Text', text: /^5H$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^Week$/ })).toBeUndefined()
  await ui.press({ key: 'gear' })
  await ui.press({ key: 'toggle-showWeek' })
  expect(writes).toEqual([expect.objectContaining({ key: 'aiblueprint.showWeek', value: true })])
  await ui.unmount()
})
