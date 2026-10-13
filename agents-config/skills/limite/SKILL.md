---
name: limite
description: >-
  Stop burning the Claude Code usage limit on easy work. Installs two Haiku
  sub-agents (Explore for code search and reading, chores for mechanical
  edits and commands) and a CLAUDE.md note that routes every easy task to
  them, so Opus keeps only planning, debugging and multi-file changes. Use
  when the user says "limite", hits their Claude limit too fast, or wants
  cheap models on easy tasks.
argument-hint: "[--project]"
disable-model-invocation: true
---

# limite

Claude Code runs every task on the session model. On Opus that includes finding a file, reading a log
or renaming an import, and each of those eats the usage limit. The built-in Explore sub-agent inherits
the session model too, so code search also runs on Opus. This skill moves the easy work to Haiku
(`model: haiku`, always the latest Haiku), which costs a fraction of Opus per token.

What the user typed after `/limite`: `$ARGUMENTS`

## Scope

- Default: user scope, every project. Agents go to `~/.claude/agents/`, the note to `~/.claude/CLAUDE.md`.
- `--project` (or the user asks for this project only): agents go to `.claude/agents/`, the note to
  `./CLAUDE.md` at the repo root.

## Steps

1. Read `templates/Explore.md` and `templates/chores.md` from this skill's folder.
2. For each one, check the target agents folder (create it if missing):
   - Missing: write it.
   - Present and identical: skip it.
   - Present and different: show the diff and ask before replacing it. Never overwrite silently.
3. Read `templates/CLAUDE-note.md`. If the target `CLAUDE.md` already has a `## Models` section (or the
   same rules in another language), leave it. Otherwise append the section, translated to the language
   the rest of that `CLAUDE.md` is written in. Create the file if it does not exist.
4. Tell the user what was written, with the paths, then:
   - Restart Claude Code (or open `/agents`) so the new agents load.
   - Check `/agents`: Explore and chores must both show Haiku.
   - The session itself stays on Opus. Only the delegated work moves to Haiku.

## Notes

- A user agent named `Explore` replaces the built-in one, that is the point of the first template.
- Haiku is fine for search, reading and one-line edits. Anything that needs judgment stays on Opus:
  the chores agent stops itself when a task touches more than 2 files or needs a design decision.
- Anthropic does not publish how much each model weighs in a subscription limit, only that Opus uses
  much more of it than Sonnet, and Sonnet more than Haiku. Do not promise a number.
