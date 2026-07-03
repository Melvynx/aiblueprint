# PostgreSQL Worktree Backend

Load this reference only when the target project uses PostgreSQL and the user selected backend isolation or cleanup.

## Goal

Create a worktree-specific PostgreSQL database, rewrite only local env values to point at it, run the project's schema/codegen steps, and drop only that database during cleanup.

Do not use this reference for other SQL engines by analogy. For MySQL, SQLite, Turso/libSQL, Neon branching, Supabase branching, PlanetScale, MongoDB, Redis, or any other backend, use researcher agents to inspect official docs and the repo's existing scripts before writing backend setup.

## `scripts/worktree-up.sh` Additions

Add this block after env copying and dependency install. Adapt the prefix, env vars, schema commands, and reset env var to the project.

```bash
# PostgreSQL worktree-isolated database.
worktree_slug="$(basename "$WORKTREE_PATH" | tr '/' '-' | tr '[:upper:]' '[:lower:]')"
db_name="<project>_${worktree_slug}"

if [[ -f .env ]]; then
  if grep -qE '^DATABASE_URL=' .env; then
    # Replace PROJECT_RESET_DB with a project-specific env var, e.g. MYAPP_RESET_DB.
    if [[ "${PROJECT_RESET_DB:-0}" == "1" ]] && command -v dropdb >/dev/null 2>&1; then
      dropdb --if-exists -d postgres "$db_name" || true
    fi

    if command -v createdb >/dev/null 2>&1; then
      createdb -d postgres "$db_name" 2>/dev/null || true
    else
      echo "createdb not found; skipped PostgreSQL database creation"
    fi

    # Rewrite only the DB name in DATABASE_URL.
    sed -i.bak -E "s|(DATABASE_URL=postgres://[^/]+)/[^?\"']+|\1/${db_name}|" .env && rm -f .env.bak
    echo "PostgreSQL DB set to $db_name"
  fi
fi
```

If the project uses `postgresql://`, multiple database env vars, SSL params, pooled URLs, direct URLs, or a hosted provider URL format, inspect existing env conventions and adjust carefully. Do not log secrets.

## Schema and Seed

Run only project-local schema steps after the URL rewrite. Examples:

```bash
if [[ -f prisma/schema.prisma ]]; then
  pnpm prisma generate
  pnpm prisma db push
fi
```

```bash
if [[ -f drizzle.config.ts ]]; then
  pnpm drizzle-kit push
fi
```

Use project seed commands only when the user selected seeding or the repo already treats them as required for local startup.

## `scripts/worktree-down.sh` Additions

Read the database name from the worktree env file. Never derive it from the branch or worktree path during cleanup.

```bash
if [[ ! -f .env ]]; then
  echo "no .env in worktree, nothing to clean"
  exit 0
fi

db_name="$(grep -E '^DATABASE_URL=' .env | sed -E 's|.*/([^/?]+).*|\1|' | head -n1 || true)"

if [[ -n "${db_name:-}" ]] && command -v dropdb >/dev/null 2>&1; then
  dropdb --if-exists -d postgres "$db_name" || true
  echo "dropped PostgreSQL DB $db_name"
else
  echo "no PostgreSQL DB cleanup performed"
fi
```

Remove copied env files only after cleanup has read the values it needs.

## Guardrails

- Never drop a database whose name was guessed from a branch.
- Never print full `DATABASE_URL` values.
- Keep reset explicit: `<PROJECT>_RESET_DB=1`.
- Prefer idempotent schema commands for setup.
- If database creation requires a hosted provider CLI or branching API, stop using this local PostgreSQL reference and research that provider directly.
