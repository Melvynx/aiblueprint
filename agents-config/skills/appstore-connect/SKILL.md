---
name: appstore-connect
description: Interact with App Store Connect via the asc CLI - apps, builds, TestFlight, beta testers, reviews, sales/analytics, metadata, IAP, signing, submissions. Also builds an Expo/React Native iOS app and ships it to TestFlight via "appstore-connect testflight". Use for "check my app", "App Store Connect", "TestFlight status", "ship to TestFlight", "app review", "my app sales", or "asc".
argument-hint: "[testflight [--expo] [setup]] | <natural-language ASC request>"
---

# App Store Connect (asc)

Read, manage, and ship any of the user's App Store apps through the **`asc`** CLI (App Store Connect CLI by Rork). `asc` covers nearly the entire ASC surface; reach for the raw API only for the rare gap.

<testflight_mode>
**If invoked as `appstore-connect testflight` (or "build and ship to TestFlight"):** this is a full build-and-upload workflow, not a single `asc` call. Read [references/testflight.md](references/testflight.md) and follow it end to end — it takes an Expo / React Native iOS app from local dev to an installable TestFlight build (ASC API-key signing to avoid Apple ID 2FA, `eas build --local` by default, `--expo` for a cloud build, then `asc publish testflight`). Pass `--expo` for a cloud build, or `testflight setup` to stop after credentials are ready. Everything below is the general `asc` surface for everyday read/manage tasks.
</testflight_mode>

<auth>
`asc` is usually already authenticated on this machine (a default keychain profile). Verify before doing real work:

```bash
asc auth status            # shows stored credential profiles + which is default
asc auth status --validate # confirms a credential actually works
asc doctor                 # diagnose auth/config issues
```

- Multiple accounts/teams: `asc --profile <name> <command>` selects a profile.
- **Not authenticated / no working credential / a NEW account with no stored key:** read [references/setup.md](references/setup.md) and follow it — a battle-tested workflow to locate the `.p8`, key id, and issuer id, then `asc auth login`. Never print or commit `.p8` keys, key ids, or issuer ids.
</auth>

<how_to_drive>
Do NOT guess flags. `asc` is large and self-documenting — discover, then act:

```bash
asc --help                 # the full command map (areas below)
asc <area> --help          # subcommands + flags for an area, e.g. `asc builds --help`
asc docs list              # embedded guides; `asc docs <topic>` to read one
```

- **Read before you write.** List/inspect/validate first; mutate second.
- **Machine output:** most commands accept `--output json` (or `--output table` for humans) — use JSON when you need to parse ids.
- Resolve an app id once and reuse it: `asc apps list --output json` → the numeric App Store app id.
</how_to_drive>

<command_map>
| Goal | Area |
| --- | --- |
| List/inspect apps, app id | `asc apps`, `asc status --app <id>` |
| Builds (processing, ids) | `asc builds` |
| TestFlight: beta groups, testers, distribute a build | `asc testflight` |
| **Build an iOS app + ship to TestFlight (end to end)** | `appstore-connect testflight` → [references/testflight.md](references/testflight.md) |
| Versions / release state | `asc versions`, `asc release`, `asc status` |
| Metadata, localizations, keywords | `asc metadata`, `asc localizations` |
| Screenshots / previews | `asc screenshots`, `asc video-previews` |
| Pricing & availability | `asc pricing` |
| In-app purchases / subscriptions | `asc iap`, `asc subscriptions` |
| Age rating / privacy / encryption / EULA | `asc age-rating`, `asc encryption`, `asc eula` |
| Submission readiness + submit | `asc validate`, `asc review`, `asc submit`, `asc publish` |
| Customer reviews | `asc reviews` |
| Sales / analytics / finance | `asc analytics`, `asc insights`, `asc finance`, `asc performance` |
| Signing: certs, profiles, bundle ids | `asc signing`, `asc certificates`, `asc profiles`, `asc bundle-ids` |
| Team / users / devices | `asc users`, `asc devices`, `asc account` |
| Xcode Cloud, webhooks, workflows | `asc xcode-cloud`, `asc webhooks`, `asc workflow` |
</command_map>

<common_tasks>
```bash
# What apps do I have / what's an app's id?
asc apps list --output table

# Where is an app in the release pipeline?
asc status --app <APP_ID> --output table

# Latest builds and processing state
asc builds list --app <APP_ID> --output json

# TestFlight: see groups, add a tester, distribute a build
asc testflight groups list --app <APP_ID>
asc publish testflight --app <APP_ID> --ipa <path.ipa> --group "<GROUP_ID>" --wait

# Is a version ready to submit? (fix every error it reports first)
asc validate --app <APP_ID> --version <VERSION> --platform IOS --output table

# Read customer reviews / respond
asc reviews list --app <APP_ID> --output table

# Sales & analytics
asc analytics --help        # request/download reports
asc insights --help         # weekly/daily insights
```
</common_tasks>

<safety>
- **Confirm before any mutation that is externally visible or hard to reverse:** `asc submit`, `asc publish ... --submit`, `asc review submit`, `asc pricing` changes, `asc iap`/`asc subscriptions` edits, `asc users` invites/removals, certificate/profile deletion. State the app id, version, and exact change, and get explicit user approval.
- Prefer dry runs / validation first: many commands accept `--dry-run`; always run `asc validate` before submitting.
- Never delete a signing certificate or provisioning profile without confirmation — it can break other apps signed with it.
- Never print or commit `.p8` keys, key ids, issuer ids, app-specific passwords, or downloaded financial reports with PII.
- This skill manages the store side only. Producing the build (.ipa/.aab) and project config belongs to the app's own deploy workflow.
</safety>

<raw_api_fallback>
For the rare endpoint `asc` doesn't expose, call the App Store Connect API directly with the bundled helper (zero deps, ES256 JWT). Credentials come from env vars — never hardcode them:

```bash
export ASC_KEY_ID=...        # 10-char key id (from the AuthKey_<KEY_ID>.p8 filename)
export ASC_ISSUER_ID=...     # team issuer UUID (App Store Connect > Users and Access > Integrations)
export ASC_P8_PATH=/path/to/AuthKey_<KEY_ID>.p8
node "$SKILL_DIR/scripts/asc-api.mjs" GET "/v1/apps?filter[bundleId]=com.example.app"
node "$SKILL_DIR/scripts/asc-api.mjs" POST /v1/betaGroups body.json
```

`$SKILL_DIR` is this skill's directory. The helper prints `{"status", "body"}` and exits non-zero on HTTP >= 400.
</raw_api_fallback>
