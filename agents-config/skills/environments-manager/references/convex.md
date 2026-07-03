# Convex Worktree Backend

Load this reference only when the target project uses Convex and the user selected backend isolation, seeding, env cloning, or Convex codegen.

Convex worktree setup is project-specific. Prefer the target repo's existing scripts over generic snippets. If the repo is `thumbfa.st` or follows the same style, inspect `scripts/worktree-context.sh`, `scripts/worktree-setup.sh`, `scripts/worktree-cleanup.sh`, and `.codex/environments/environment.toml` before editing; they show a useful pattern for isolated Convex deployments, env sync, auth cookie isolation, codegen, and cleanup.

## First Decision

Ask or infer which Convex mode the project should use:

| Mode | Use when | Setup shape |
| :--- | :--- | :--- |
| Local deployment | The worktree can run fully local Convex state. | Create/select local deployment, keep data local, run `convex dev --local --once` or the repo's equivalent. |
| Cloud dev deployment | Each worktree needs an isolated Convex dev deployment. | Create/select `dev/<worktree-slug>`, clone safe env vars, push schema/functions, seed selected data. |
| Existing deployment | The team wants to reuse the source checkout's selected deployment. | Copy env files and avoid destructive reset/import steps. |

Do not assume one mode globally. Convex projects vary a lot.

## Table Seeding Policy

Fresh worktrees usually need enough data to log in, select an organization, exercise billing/credits, and test the product workflow. They do not need a full copy of analytics, logs, generated outputs, webhook history, background jobs, embeddings, message transcripts, file storage, or other heavy/derived tables.

Before writing Convex seed code:

1. Inspect `convex/schema.ts` and nearby feature code.
2. Ask which tables are important enough to seed.
3. If the user does not know, propose a small allowlist. Default to core identity, org, billing, settings, and product fixture tables.
4. Read `examples/scripts/convex-selective-seed.sh` and adapt it to the repo.

Use this policy when adding Convex data copy:

- Require a small `CONVEX_IMPORT_TABLES` allowlist in the generated script or a project-specific helper.
- Prefer committed seed fixtures or a project helper that exports only those tables to JSONL/JSON.
- Import one table at a time with `npx convex import --table "$table" "$path"`.
- Do not use a broad `npx convex export` / `npx convex import --replace-all` as the default setup path. It is a project-specific choice, not the generic safe default.
- Do not include `_storage` unless the user explicitly says file storage is required for the workflow.
- If relationships require stable document IDs across tables, document that targeted imports may regenerate IDs and prefer a purpose-built seed mutation/helper over partial backup editing.

## Selective Seed Shape

Adapt table names, deployment flags, and seed paths to the repo:

```bash
# Convex selected-table seed. Keep this list short and project-specific.
CONVEX_IMPORT_DEPLOYMENT="${CONVEX_IMPORT_DEPLOYMENT:-dev}"
CONVEX_IMPORT_DIR="${CONVEX_IMPORT_DIR:-$SOURCE_PATH/.worktree-seed/convex}"
CONVEX_IMPORT_TABLES=(
  users
  organizations
  organizationMembers
  subscriptions
  credits
  settings
)

assert_non_prod_ref "$CONVEX_IMPORT_DEPLOYMENT"

convex_import_flags=()
case "$CONVEX_IMPORT_DEPLOYMENT" in
  dev)
    ;;
  preview:*)
    convex_import_flags=(--preview-name "${CONVEX_IMPORT_DEPLOYMENT#preview:}")
    ;;
  *)
    echo "unknown Convex import target '$CONVEX_IMPORT_DEPLOYMENT'; use dev or preview:<name>" >&2
    exit 1
    ;;
esac

if [[ -d "$CONVEX_IMPORT_DIR" ]]; then
  for table in "${CONVEX_IMPORT_TABLES[@]}"; do
    seed_file="$CONVEX_IMPORT_DIR/$table.jsonl"
    if [[ -f "$seed_file" ]]; then
      npx convex import "${convex_import_flags[@]}" --replace --table "$table" "$seed_file"
      echo "seeded Convex table: $table"
    else
      echo "skipped Convex table without seed file: $table"
    fi
  done
else
  echo "no Convex seed directory at $CONVEX_IMPORT_DIR, skipping selected-table seed"
fi
```

## Cloud Dev Deployment Pattern

When using isolated cloud dev deployments, generate or adapt helper functions instead of cramming everything into one giant script:

- Resolve worktree path, source tree, workspace slug, and deployment ref in a small helper such as `scripts/worktree-context.sh`.
- Use a deterministic dev deployment ref such as `dev/<worktree-slug>`, unless the user provides one.
- Reject production-looking refs before exports, imports, env cloning, or cleanup.
- Clone only safe env vars from the source dev deployment. If the project has a helper like `scripts/convex-sync-env.sh`, use it.
- Set worktree-specific auth/cookie/session prefixes when the app uses Better Auth or similar auth middleware.
- Push schema/functions with the repo's normal command, often `pnpm exec convex dev --once`.
- Run `pnpm exec convex codegen` or the repo's codegen command after deployment selection.

Thumbfa.st is a good local example of this shape: it resolves context in `scripts/worktree-context.sh`, creates/selects a Convex dev deployment in setup, syncs env, sets an auth cookie prefix, pushes Convex, generates code, and cleans local Convex state/env vars in cleanup. Borrow the structure, not every destructive command.

## Cleanup

Cleanup should only remove resources that the setup script created or selected explicitly.

Typical cleanup:

- Remove worktree-specific Convex env vars only for deterministic worktree deployment refs such as `dev/<slug>`.
- Remove local `.convex` state only if the user did not request keeping it.
- Remove copied env files after cleanup work is done.
- Never remove or mutate production deployments.

If the project creates cloud dev deployments and the Convex CLI supports deleting them in the current version, use researcher agents to verify the exact command and prompts before adding deletion. Otherwise leave deployment deletion manual and make cleanup idempotent.

## Guardrails

- Never import into or export from production by default.
- Never copy every table just because the CLI supports full deployment backups.
- Never log Convex deployment admin keys, auth secrets, webhooks, or API keys.
- Keep setup non-interactive: set `CI=1` from wrappers where possible and use explicit CLI flags.
- Keep reset explicit, for example `CONVEX_WORKTREE_RESET_DATA=1`.
- Prefer project helpers over generic snippets when they already exist.
