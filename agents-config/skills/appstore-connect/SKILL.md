---
name: appstore-connect
description: Drive App Store Connect through the asc CLI for apps, builds, TestFlight, reviews, sales, metadata, IAP, signing, and submissions. Use for "check my app", "App Store Connect", "TestFlight", "app review", "my app sales", or "asc".
disable-model-invocation: true
---

Inspect first, mutate second. Discover flags from the CLI; do not guess them.

```bash
asc auth status
asc auth status --validate
asc doctor
asc --help
asc <area> --help
asc docs list
```

Use `--profile <name>` when more than one account exists. A new account with no stored key: run `find-asc-credentials`, then `asc auth login`. Never print or commit `.p8` keys, key ids, issuer ids, or downloaded financial reports with PII.

Resolve the numeric app id once: `asc apps list --output json`. Use `--output json` when parsing ids.

| Goal | Area |
| --- | --- |
| Apps / status | `asc apps`, `asc status --app <id>` |
| Builds | `asc builds` |
| TestFlight | `asc testflight`, `asc publish testflight` |
| Versions / release | `asc versions`, `asc release` |
| Metadata / screenshots | `asc metadata`, `asc localizations`, `asc screenshots` |
| Pricing / IAP | `asc pricing`, `asc iap`, `asc subscriptions` |
| Submit | `asc validate`, `asc review`, `asc submit`, `asc publish` |
| Reviews / sales | `asc reviews`, `asc analytics`, `asc insights`, `asc finance` |
| Signing / team | `asc signing`, `asc certificates`, `asc profiles`, `asc users` |

Confirm before any externally visible or hard-to-reverse mutation (`submit`, `publish ... --submit`, pricing, IAP, user changes, certificate or profile deletion). State the app id, version, and exact change. Run `asc validate` before submitting. Prefer `--dry-run` when it exists.

This skill owns the store side only. For an endpoint `asc` does not expose:

```bash
node "$SKILL_DIR/scripts/asc-api.mjs" GET "/v1/apps?filter[bundleId]=com.example.app"
```

Credentials from env (`ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_P8_PATH`); never hardcode them.
