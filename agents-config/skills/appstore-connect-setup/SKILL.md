---
name: appstore-connect-setup
description: Find and configure App Store Connect API credentials for asc auth. Use when asc auth is missing, credentials are unknown, the user says login to App Store Connect, or before TestFlight/App Store release work.
---

# App Store Connect Setup

<objective>
`asc auth login` needs three things: a **key ID**, an **issuer ID**, and a **.p8 private key file**. Users rarely remember where these are. This skill is a battle-tested workflow for finding all three without asking the user to dig through App Store Connect manually.

Key insight from a real session: the `.p8` files and key IDs live on disk, but the **issuer ID is almost never stored locally** — it only exists in the App Store Connect web UI. The trick is to read it from the user's already-signed-in browser session via CDP, since Apple login requires 2FA and cannot be automated.
</objective>

<credentials_anatomy>
| Credential | What it looks like | Where it lives |
| --- | --- | --- |
| Key ID | 10 chars, e.g. `T397KWC8K7` | In the `.p8` filename: `AuthKey_<KEY_ID>.p8` |
| Issuer ID | UUID, e.g. `35b197bd-...` | App Store Connect → Users and Access → Integrations → App Store Connect API (top of Keys page). Team-level, same for all keys. |
| Private key | `AuthKey_*.p8` file, ~257 bytes | User's disk — Downloads is the most common spot (Apple only lets you download it once) |

Beware look-alikes that are NOT API auth keys:
- `SubscriptionKey_*.p8` — in-app purchase key, won't work for `asc auth login`.
- `.p8` files for APNs (push notifications).
</credentials_anatomy>

<step n="1" title="Check if already authenticated">

```bash
asc auth status --validate
```

If a credential validates as "works", stop — nothing to do.
</step>

<step n="2" title="Hunt for .p8 files on disk">

```bash
# Standard locations first
ls ~/.asc ~/private_keys ~/.appstoreconnect/private_keys 2>/dev/null

# Then the places people actually put them (Downloads wins in practice)
find ~/Downloads ~/Documents ~/Desktop ~/Developer -maxdepth 5 -name "*.p8" 2>/dev/null
```

Real finding: keys were in `~/Downloads/AuthKey_X.p8` and `~/Downloads/Dev/AuthKey_Y.p8`, downloaded months earlier. The key ID is the filename suffix.
</step>

<step n="3" title="Try to find the issuer ID locally (usually fails)">

Worth 30 seconds, but expect nothing:

```bash
grep -riE "issuer" ~/Developer --include="*.json" --include="*.env*" --include="*.rb" --include="*.yml" -l 2>/dev/null | grep -v node_modules
grep -iE "issuer" ~/.zsh_history 2>/dev/null
grep -ri "issuer" ~/.fastlane ~/.expo 2>/dev/null
```

Real finding: zero hits across the entire `~/Developer` tree, shell history, fastlane and expo config. Docs in repos only contain `ISSUER_ID` placeholders. **Do not burn time here — go to step 4.**
</step>

<step n="4" title="Read the issuer ID from the user's signed-in browser (the key move)">

Apple login = password + 2FA, so never try to log in yourself. Instead, attach to the browser where the user is **already signed in** and read the page.

**4a. Confirm with the user** which browser is signed in to App Store Connect (Chrome, Helium, etc.).

**4b. Check if the browser exposes CDP:**

```bash
curl -s http://127.0.0.1:9222/json/version   # Chrome default
curl -s http://127.0.0.1:9334/json/version   # custom port
```

**4c. If not (the usual case), quit and relaunch it with a debug port.** Session cookies survive a graceful quit, and `--restore-last-session` brings the tabs back:

```bash
osascript -e 'quit app "Helium"'   # or "Google Chrome"
sleep 3
nohup "/Applications/Helium.app/Contents/MacOS/Helium" --remote-debugging-port=9334 --restore-last-session >/dev/null 2>&1 &
sleep 5
curl -s http://127.0.0.1:9334/json/version | head -3   # must answer before continuing
```

**4d. Navigate to the API keys page and extract the issuer ID:**

```bash
dev-browser --browser helium --connect http://127.0.0.1:9334 --timeout 60 <<'EOF'
const page = await browser.getPage("asc");
await page.goto("https://appstoreconnect.apple.com/access/integrations/api", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(8000);
const text = await page.evaluate(() => document.body.innerText);
const m = text.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
console.log(JSON.stringify({ issuerId: m ? m[1] : null, loggedOut: page.url().includes("/login") }));
EOF
```

If `loggedOut` is true, ask the user to sign in in that browser window, then re-run.

**4e. Cross-check which keys are actually ACTIVE.** The same page lists active keys with their key IDs. A `.p8` found on disk may belong to a revoked key — match the filename key ID against the active list before using it:

```bash
dev-browser --browser helium --connect http://127.0.0.1:9334 --timeout 30 <<'EOF'
const page = await browser.getPage("asc");
const text = await page.evaluate(() => document.body.innerText);
console.log(text);  // active keys table: NAME / KEY ID / LAST USED / ACCESS
EOF
```

Real finding: the first `.p8` we picked (`AuthKey_6QD5RMPU9F.p8`) was NOT in the active list — login would have failed. The second one matched an active Admin key and worked.
</step>

<step n="5" title="Organize keys, then log in">

Move keys to the canonical folder so the next agent finds them instantly:

```bash
mkdir -p ~/Developer/app-store
mv ~/Downloads/AuthKey_*.p8 ~/Developer/app-store/ 2>/dev/null
chmod 600 ~/Developer/app-store/*.p8
```

Then authenticate and verify end-to-end.

**Naming the credential:** use a stable, descriptive name tied to the machine + user, not the app — the same ASC API key is team-level and works across every app, so naming it per-app is misleading. Convention: `asc-macos-<user>-key` (e.g. `asc-macos-melvynx-key`). **Prefer a key with Admin access** when several active keys exist (Admin can read/write everything the release flow needs); check the ACCESS column from step 4e and pick the Admin key.

```bash
asc auth login \
  --name "asc-macos-melvynx-key" \
  --key-id "KEY_ID" \
  --issuer-id "ISSUER_ID" \
  --private-key ~/Developer/app-store/AuthKey_KEY_ID.p8 \
  --network

asc auth status --validate   # must report "works"
asc apps list                # must list the target app
```
</step>

<step n="6" title="Persist the findings">

Record in the agent memory / AGENTS.md so this hunt never happens twice:

- The keys folder (`~/Developer/app-store/`), each key ID and whether it is active
- The issuer ID (team-level, stable)
- The `asc` credential name (convention `asc-macos-<user>-key`), its access level (prefer Admin), and that it is stored in the system keychain
- The app's numeric App Store Connect ID and bundle ID from `asc apps list`
</step>

<critical_safety>
- Never commit `.p8` files or paste their contents anywhere. `chmod 600` them.
- Never attempt the Apple login form yourself — 2FA makes it pointless and looks like account takeover. Always reuse the user's signed-in session, with their explicit OK to attach to/restart their browser.
- Restarting the browser closes the user's windows; warn them and rely on session restore.
</critical_safety>

<success_criteria>
- `asc auth status --validate` reports the credential as "works".
- `asc apps list` returns the expected app(s).
- Keys live in `~/Developer/app-store/` and the findings are written to memory/AGENTS.md.
</success_criteria>
