# TestFlight: build an iOS app and ship it to TestFlight

Loaded for `appstore-connect testflight`. Takes an Expo / React Native iOS app from local dev to an installable TestFlight build, fully non-interactively.

**Two key insights that make this automatable:**

1. **ASC API key signing avoids Apple ID 2FA.** Interactive `eas build` credential setup needs Apple ID 2FA and cannot be scripted. Creating the distribution certificate + App Store provisioning profile through the App Store Connect API (`$SKILL_DIR/scripts/asc-api.mjs`) avoids 2FA entirely.
2. **`eas build --local` avoids Expo cloud build credits.** Default to the local Mac build with `credentialsSource: "local"`; use `--expo` only when the user explicitly wants a cloud build.

`$SKILL_DIR` is the `appstore-connect` skill directory; `<APP_DIR>` is the Expo project root (often the repo root, or `mobile-app/` / `apps/<name>/` in a monorepo).

## Arguments

- **default** (`appstore-connect testflight`): run setup → local build → upload → verify.
- **`--expo`**: use the EAS **cloud** build instead of local (consumes EAS build quota — confirm once).
- **setup-only** (`testflight setup`, "prepare credentials"): run phases A–D, then stop and report readiness.

## Prerequisites (ask once, as a group — the agent cannot create these)

1. **Apple Developer Program** membership (paid, enrolled).
2. **App Store Connect API key**: the `AuthKey_<KEY_ID>.p8` file, its key ID, and the team issuer ID (App Store Connect → Users and Access → Integrations; needs Admin or App Manager). If unknown, follow [setup.md](setup.md).
3. **Expo account** logged in: `npx eas-cli@latest whoami` (else `login`).
4. **App record** in App Store Connect for the bundle ID. The public API **cannot** create app records — if missing, the user creates it once at appstoreconnect.apple.com (My Apps → + → New App). Verified in Phase D.
5. **`asc` CLI** (`brew install asc`) — used only for the final upload.
6. For the default local build: macOS with Xcode CLT + CocoaPods (`xcodebuild -version`, `command -v pod`). If missing, stop and ask whether to use `--expo`.

## Critical safety

- Never commit or print `.p8` keys, `.p12` files, p12 passwords, provisioning profiles, or `credentials.json`. Verify `.gitignore` excludes them before any commit.
- Export ASC credentials as env vars for `asc-api.mjs`; never write them into repo files.
- Get explicit confirmation before: creating Apple certificates (low per-account limit), `--expo` cloud builds (consumes credits), and the TestFlight upload.
- Env vars are **baked in at build time** — confirm the production config points at prod backends before building, or testers ship with a dev backend.

## Phase A — Preflight

```bash
cd <APP_DIR>
npx tsc --noEmit && npm run lint        # whatever checks the project has
npx expo-doctor                          # surface config problems early
npx eas-cli@latest whoami                # Expo account logged in?
command -v asc && asc version
xcodebuild -version && command -v pod    # required for default local builds
```

Confirm the permanent values with the user: app `title`, `bundleId`, Apple `teamId`. The bundle ID is permanent once the app record exists.

Export ASC credentials for the rest of the session:

```bash
export ASC_KEY_ID="<10-char key id>"
export ASC_ISSUER_ID="<issuer uuid>"
export ASC_P8_PATH="/path/to/AuthKey_<KEY_ID>.p8"
```

## Phase B — EAS project init

Skip if the project already has a real `eas.projectId` (a UUID).

```bash
cd <APP_DIR>
npx eas-cli@latest project:init --non-interactive --force
npx eas-cli@latest project:info
```

Write the printed project ID into the Expo config (`app.json`/`app.config.ts` → `extra.eas.projectId`, or your project config).

## Phase C — Production env + eas.json

Point the build at production. Set every required production backend env var (auth secrets, API keys, URLs), then wire the prod values into `<APP_DIR>/eas.json → build.production`:

```json
"production": {
  "autoIncrement": true,
  "credentialsSource": "local",
  "env": {
    "EXPO_PUBLIC_API_URL": "https://<prod-backend>"
  }
}
```

`credentialsSource: "local"` is what makes Phase E fully non-interactive.

## Phase D — Apple signing credentials via the ASC API

All calls: `node "$SKILL_DIR/scripts/asc-api.mjs" <METHOD> <path> [body.json]` with the Phase A env vars. Work in a directory **outside** the repo (e.g. `~/ios-credentials/<slug>/`) so nothing secret can be committed.

**1. Resolve the app record (hard gate):**

```bash
node "$SKILL_DIR/scripts/asc-api.mjs" GET "/v1/apps?filter[bundleId]=<bundle_id>"
```

Empty `data` → STOP: tell the user to create the app record (My Apps → + → New App) with this exact bundle ID, then resume. Otherwise save `app_id = data[0].id`.

**2. Bundle ID registration + capabilities:**

```bash
node "$SKILL_DIR/scripts/asc-api.mjs" GET "/v1/bundleIds?filter[identifier]=<bundle_id>"
# if missing: POST /v1/bundleIds {"data":{"type":"bundleIds","attributes":{"identifier":"<bundle_id>","name":"<title>","platform":"IOS"}}}
# enable capabilities the app uses (IN_APP_PURCHASE, APPLE_ID_AUTH, PUSH_NOTIFICATIONS) via POST /v1/bundleIdCapabilities
```

**3. Distribution certificate** (Apple caps these at ~2–3 per account — check first):

```bash
node "$SKILL_DIR/scripts/asc-api.mjs" GET "/v1/certificates?filter[certificateType]=DISTRIBUTION"
```

Reuse only if the user has its private key/.p12 locally. Otherwise create one (with confirmation):

```bash
openssl req -new -newkey rsa:2048 -nodes -keyout dist.key -out dist.csr \
  -subj "/emailAddress=<user-email>/CN=<title> Distribution/C=US"
node -e "const fs=require('fs');fs.writeFileSync('cert-req.json',JSON.stringify({data:{type:'certificates',attributes:{certificateType:'DISTRIBUTION',csrContent:fs.readFileSync('dist.csr','utf8')}}}))"
node "$SKILL_DIR/scripts/asc-api.mjs" POST /v1/certificates cert-req.json
# save body.data.id (cert id) and body.data.attributes.certificateContent (base64) -> dist.cer
```

**4. App Store provisioning profile:**

```bash
node -e "const fs=require('fs');fs.writeFileSync('profile-req.json',JSON.stringify({data:{type:'profiles',attributes:{name:'<title> AppStore',profileType:'IOS_APP_STORE'},relationships:{bundleId:{data:{type:'bundleIds',id:'<BUNDLE_DB_ID>'}},certificates:{data:[{type:'certificates',id:'<CERT_ID>'}]},devices:{data:[]}}}}))"
node "$SKILL_DIR/scripts/asc-api.mjs" POST /v1/profiles profile-req.json
# save body.data.attributes.profileContent (base64) -> appstore.mobileprovision
```

**5. Build the `.p12` (the `-legacy` flag is mandatory — Apple tooling rejects OpenSSL 3.x default ciphers):**

```bash
echo "<certificateContent-b64>" | base64 -d > dist.cer
P12PASS=$(openssl rand -hex 12)
openssl x509 -inform der -in dist.cer -out dist.pem 2>/dev/null || cp dist.cer dist.pem
openssl pkcs12 -export -in dist.pem -inkey dist.key -out dist.p12 \
  -name "<title> Distribution" -passout pass:"$P12PASS" -legacy
echo "<profileContent-b64>" | base64 -d > appstore.mobileprovision
```

**6. Wire into the project (gitignored paths only):**

```bash
mkdir -p <APP_DIR>/credentials
cp dist.p12 appstore.mobileprovision <APP_DIR>/credentials/
node -e "const fs=require('fs');fs.writeFileSync('<APP_DIR>/credentials.json',JSON.stringify({ios:{provisioningProfilePath:'credentials/appstore.mobileprovision',distributionCertificate:{path:'credentials/dist.p12',password:process.argv[1]}}},null,2))" "$P12PASS"
git check-ignore <APP_DIR>/credentials.json <APP_DIR>/credentials/dist.p12   # MUST print both
```

**Setup-only mode STOPS here** — report readiness (app record, cert, profile, credentials.json, eas.json) and the next command.

## Phase E — Local iOS build (default)

Uses the local Mac/Xcode toolchain; does **not** consume Expo cloud credits.

```bash
cd <APP_DIR>
npx eas-cli@latest build --platform ios --profile production \
  --local --non-interactive --output /tmp/<slug>.ipa
```

If `expo-doctor` blocks on dependency patch mismatches, run `npx expo install --check`, apply the minimal patch updates, re-run `npx tsc --noEmit && npm run lint`, then rebuild. Don't blindly upgrade deps mid-release.

## Phase E (--expo) — EAS cloud build

Only when the user passes `--expo` (confirm once — consumes EAS credits):

```bash
cd <APP_DIR>
npx eas-cli@latest build --platform ios --profile production --non-interactive --no-wait
npx eas-cli@latest build:list --platform ios --limit 1 --json --non-interactive   # poll to FINISHED/ERRORED
curl -sL -o /tmp/<slug>.ipa "<artifacts.buildUrl>"                                  # download on FINISHED
```

## Phase F — TestFlight upload

**1. Internal beta group** (`asc publish testflight` fails without `--group`):

```bash
node -e "const fs=require('fs');fs.writeFileSync('group-req.json',JSON.stringify({data:{type:'betaGroups',attributes:{name:'Internal',isInternalGroup:true,hasAccessToAllBuilds:true},relationships:{app:{data:{type:'apps',id:'<app_id>'}}}}}))"
node "$SKILL_DIR/scripts/asc-api.mjs" POST /v1/betaGroups group-req.json
# 409 "already exists" is fine — fetch the id: GET "/v1/apps/<app_id>/betaGroups"
```

**2. Upload and wait** (`asc auth status --validate`, else `asc auth login` with the same ASC key):

```bash
asc publish testflight --app "<app_id>" --ipa /tmp/<slug>.ipa --group "<BETA_GROUP_ID>" --wait --timeout 45m
```

**3. Add testers** (internal testers must be ASC team members; external emails work via groups):

```bash
node -e "const fs=require('fs');fs.writeFileSync('tester-req.json',JSON.stringify({data:{type:'betaTesters',attributes:{email:'<tester-email>'},relationships:{betaGroups:{data:[{type:'betaGroups',id:'<BETA_GROUP_ID>'}]}}}}))"
node "$SKILL_DIR/scripts/asc-api.mjs" POST /v1/betaTesters tester-req.json
```

**4. Verify:** `asc status --app "<app_id>" --output table` shows the build processed and attached to the group. Report build number, group, and testers.

## Failure modes

- **`.p12` rejected during signing** → exported without `-legacy`. Re-export with `-legacy`.
- **Certificate creation 409 / limit reached** → list existing DISTRIBUTION certs; ask which to revoke (`DELETE /v1/certificates/<id>`) or whether the user has its `.p12` to reuse. Never revoke without confirmation — it breaks other apps.
- **Local build fails before Xcode archive** → check `xcodebuild -version`, `xcode-select -p`, `command -v pod`. If unavailable and the user accepts cloud quota, rerun with `--expo`.
- **Build asks for credentials** → `credentialsSource: "local"` missing in `eas.json`, or `credentials.json` paths wrong (relative to `<APP_DIR>`).
- **`asc publish testflight` "--group is required"** → create the beta group first (Phase F step 1).
- **Upload rejected: missing export compliance** → answer the encryption question once in App Store Connect, or add `"ITSAppUsesNonExemptEncryption": false` to `infoPlist` in the Expo config.
- **App opens but can't reach backend** → built before `eas.json` had prod URLs, or prod env vars missing. Env is baked at build time — rebuild after fixing.
- **User insists on EAS-managed credentials (Apple ID login)** → that needs interactive 2FA; run `npx eas-cli@latest credentials` in a real terminal with the user present. Do not script the 2FA prompt.

## Success metrics

- Default local build produces `/tmp/<slug>.ipa` with no interactive prompt; `--expo` cloud builds reach FINISHED.
- The build shows as processed in TestFlight, attached to a beta group with at least one tester.
- `git status` shows no credential files staged; nothing secret printed in the transcript.
