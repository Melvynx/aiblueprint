import type { Register } from 'claude-code'

// `$` as a hook receives it.
type Engine = Parameters<Parameters<Parameters<Register>[0]>[2]>[0]

type Linked = { root: string; name: string }

const SKILL_FILES = ['SKILL.md', 'skill.md']

const realPath = async ($: Engine, path: string) =>
  (await $.fs.stat(path, { resolve: true }).catch(() => undefined))?.realPath

const homeDir = async ($: Engine) =>
  (await $.process.run(['printenv', 'HOME'])).stdout.trim()

// The session's cwd and every ancestor below $HOME, then $HOME itself (global).
const rootsFor = (cwd: string, home: string) => {
  const roots: string[] = []
  let dir = cwd.replace(/\/+$/, '')
  while (dir.startsWith(`${home}/`)) {
    roots.push(dir)
    dir = dir.slice(0, dir.lastIndexOf('/'))
  }
  if (!cwd.startsWith(`${home}/`) && cwd !== home) roots.push(cwd)
  roots.push(home)
  return roots
}

const isSkillDir = async ($: Engine, dir: string) => {
  const stat = await $.fs.stat(dir).catch(() => undefined)
  if (stat?.kind !== 'dir') return false
  for (const file of SKILL_FILES) {
    if (await $.fs.exists(`${dir}/${file}`)) return true
  }
  return false
}

// Links each <root>/.agents/skills/<name> missing from <root>/.claude/skills.
const syncRoot = async ($: Engine, root: string): Promise<Linked[]> => {
  const source = `${root}/.agents/skills`
  const target = `${root}/.claude/skills`
  if (!(await $.fs.exists(source))) return []

  // .claude/skills already is .agents/skills (a symlinked folder): nothing to map.
  const sourceReal = await realPath($, source)
  if (sourceReal !== undefined && sourceReal === (await realPath($, target))) return []

  // Every name already in .claude/skills, dangling links included, case-insensitive.
  const existing = new Set(
    (await $.fs.list(target).catch(() => [])).map(entry => entry.name.toLowerCase()),
  )

  const linked: Linked[] = []
  for (const entry of await $.fs.list(source)) {
    const { name } = entry
    if (name.startsWith('.') || name.startsWith('__')) continue
    if (existing.has(name.toLowerCase())) continue
    if (!(await isSkillDir($, `${source}/${name}`))) continue

    if (linked.length === 0) await $.process.run(['mkdir', '-p', target])
    const ran = await $.process.run(['ln', '-s', `../../.agents/skills/${name}`, `${target}/${name}`])
    if (ran.exitCode === 0) linked.push({ root, name })
    else $.ui.log(`agent4everything: ln failed for ${name}: ${ran.stderr.trim()}`, { to: 'debug' })
  }
  return linked
}

const syncAll = async ($: Engine, cwd: string) => {
  const home = await homeDir($)
  const linked: Linked[] = []
  for (const root of rootsFor(cwd, home)) linked.push(...(await syncRoot($, root)))
  if (linked.length > 0) {
    $.ui.toast(`agent4everything: linked ${linked.map(l => l.name).join(', ')}`)
  }
  return linked
}

export const register: Register = on => {
  // Awaited before the first prompt: links exist before the session reads skills again.
  on('session.start', async ($, e, next) => {
    await syncAll($, e.cwd).catch(error => $.ui.log(`agent4everything: ${error}`, { to: 'debug' }))
    return next(e)
  })

  // Startup, resume, /clear, compact: sync again and have the engine re-read skills.
  on('classic.SessionStart', async ($, e, next) => {
    await syncAll($, e.cwd).catch(() => [])
    const result = await next(e)
    return { ...result, reloadSkills: true }
  })

  on('classic.CwdChanged', async ($, e, next) => {
    await syncAll($, e.new_cwd).catch(() => [])
    return next(e)
  })
}
