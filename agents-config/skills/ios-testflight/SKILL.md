---
name: ios-testflight
description: Build a NowStack Mobile iOS app and upload it to TestFlight. Defaults to local `eas build --local`; use `--expo` only when the user explicitly wants an EAS cloud build.
---

# iOS TestFlight - NowStack Mobile

Take a working NowStack Mobile app from local dev to an installable TestFlight build. Run phases A-D for setup only (stop before the build, report readiness); run all phases end to end to build and upload. This is the iOS beta surface; for App Store review use `ns-ios-distribute`.

Default build mode is **local Mac build** with `eas build --local`, so it does not consume Expo/EAS cloud build credits. If the user passes `--expo`, opt into the EAS cloud build path instead.

<objective>
Go from "the app works in the simulator" to "a build is installable from TestFlight" with maximum automation. Default to the local Mac build path to preserve Expo cloud credits; use `--expo` only when the user asks for a cloud build. Everything used here ships in this repo or is a public CLI (`eas-cli`, `asc`, `openssl`, `node`).

The proven flow (battle-tested on a real app built from this boilerplate):

1. Create the EAS project and wire `easProjectId` into `site-config.ts`.
2. Deploy Convex to production and set prod env vars.
3. Point `eas.json` production env at the prod Convex URLs.
4. Create Apple signing credentials (distribution cert + App Store provisioning profile) through the **App Store Connect API** using `mobile-app/scripts/asc-api.mjs` — no browser, no Apple ID 2FA.
5. Run a local signed App Store IPA build with `eas build --local`, `credentialsSource: "local"`, and an explicit `--output /tmp/{slug}.ipa`.
6. Upload the `.ipa` to TestFlight with `asc publish testflight` into an internal beta group.

The key insight: interactive `eas build` credential setup requires Apple ID 2FA and cannot be automated reliably. The ASC API key path avoids 2FA entirely, and local `eas build --local` avoids Expo cloud build credits while still using the same local signing files.
</objective>

<arguments>
- Default / no flag: run setup, local build, upload, and verify.
- `--expo`: use the EAS cloud build phase instead of local build. This consumes Expo/EAS build quota and requires explicit user confirmation.
- Setup-only requests (`ios setup`, "prepare TestFlight", "credentials only"): run phases A-D, then stop before any build/upload.
</arguments>

<prerequisites>
The user must have (ask once, as a group — these cannot be created by the agent):

1. **Apple Developer Program membership** (paid, enrolled).
2. **App Store Connect API key**: the `AuthKey_<KEY_ID>.p8` file, its key ID, and the team issuer ID. If unknown, follow the `appstore-connect` skill's setup workflow (`references/setup.md`), or point the user to App Store Connect > Users and Access > Integrations > App Store Connect API (key must have Admin or App Manager role).
3. **Expo account** logged in: `npx eas-cli@latest whoami` (else `npx eas-cli@latest login`).
4. **App record in App Store Connect** for the bundle ID. The public API cannot create app records — if missing, the user creates it once at appstoreconnect.apple.com (My Apps > + > New App, selecting the bundle ID). Verify with Phase D step 1 and stop with clear instructions if absent.
5. `asc` CLI installed (`brew install asc`) — used only for the final upload; everything else goes through `scripts/asc-api.mjs`.
6. For the default local build: macOS with Xcode command line tools and CocoaPods (`xcodebuild -version`, `command -v pod`). If those are unavailable, stop and ask whether to use `--expo`.
</prerequisites>

<state_variables>
| Variable | Source |
| --- | --- |
| `{bundle_id}` | `SiteConfig.bundleId` |
| `{apple_team_id}` | `SiteConfig.appleTeamId` |
| `{eas_project_id}` | output of `eas project:init`, then written to `site-config.ts` |
| `{asc_key_id}` / `{asc_issuer_id}` / `{asc_p8_path}` | from the user / the `appstore-connect` skill's `references/setup.md`. Never commit, never print. |
| `{convex_prod_url}` / `{convex_prod_site_url}` | from `npx convex deploy` output / Convex dashboard |
| `{asc_app_id}` | numeric app ID resolved from the bundle ID (Phase D) |
| `{build_mode}` | default `local`; `expo` only when the user passes `--expo` |
| `{ipa_path}` | `/tmp/{slug}.ipa` from local build, or downloaded cloud artifact |
</state_variables>

<critical_safety>
- Never commit or print `.p8` keys, `.p12` files, p12 passwords, provisioning profiles, or `credentials.json`. The repo `.gitignore` already excludes them — verify before any commit.
- Export ASC credentials as env vars for `scripts/asc-api.mjs`; do not write them into files inside the repo.
- Get explicit user confirmation before: creating Apple certificates (accounts have a low cert limit), using `--expo` cloud EAS builds (consumes build credits), and the TestFlight upload.
- Local builds do not consume Expo cloud credits, but they still sign a production App Store IPA and may increment the remote EAS build number when `appVersionSource` is `remote`.
- Builds bake env vars in permanently: confirm `eas.json` points at the PROD Convex deployment before building, or testers ship with a dev backend.
</critical_safety>

<phase n="A" title="Preflight">
From the repo root:

```bash
npm run check-setup          # must be free of errors (easProjectId warning is expected pre-init)
cd mobile-app && npx tsc --noEmit && npm run lint
npx eas-cli@latest whoami    # Expo account logged in?
command -v asc && asc version
xcodebuild -version && command -v pod   # required for default local builds
```

Read `site-config.ts` and confirm with the user: `title`, `bundleId`, `appleTeamId`, payment product IDs. The bundle ID is permanent once the app record exists — it must be final now.

Export the ASC credentials for the rest of the session:

```bash
export ASC_KEY_ID="<10-char key id>"
export ASC_ISSUER_ID="<issuer uuid>"
export ASC_P8_PATH="/path/to/AuthKey_<KEY_ID>.p8"
```
</phase>

<phase n="B" title="EAS project init">
Skip if `easProjectId` in `site-config.ts` is already a real UUID.

```bash
cd mobile-app
npx eas-cli@latest project:init --non-interactive --force
npx eas-cli@latest project:info
```

Write the printed project ID into `site-config.ts > easProjectId`. Re-run `npm run check-setup` — the easProjectId warning must be gone.
</phase>

<phase n="C" title="Convex production + eas.json">
Follow `docs/production-checklist.md` stage 1. Summary:

```bash
npx convex deploy -y
# prod env starts EMPTY — set every required var:
npx convex env set --prod SITE_URL "https://<the-app-domain>"
npx convex env set --prod BETTER_AUTH_SECRET "$(openssl rand -hex 32)"   # fresh, never reuse dev
npx convex env set --prod RESEND_API_KEY "$(npx convex env get RESEND_API_KEY)"
npx convex env set --prod EMAIL_FROM "$(npx convex env get EMAIL_FROM)"
# if Apple Sign In is enabled: APPLE_CLIENT_ID = {bundle_id}, APPLE_CLIENT_SECRET copied from dev
# if Google Sign In is enabled: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET copied from dev
npx convex env list --prod
```

Then put the prod URLs into `mobile-app/eas.json > build.production`:

```json
"production": {
  "autoIncrement": true,
  "credentialsSource": "local",
  "env": {
    "EXPO_PUBLIC_CONVEX_URL": "https://<prod-deployment>.convex.cloud",
    "EXPO_PUBLIC_CONVEX_SITE_URL": "https://<prod-deployment>.convex.site"
  }
}
```

`credentialsSource: "local"` is what makes the build fully non-interactive (Phase E).
</phase>

<phase n="D" title="Apple signing credentials via ASC API">
All API calls use `node mobile-app/scripts/asc-api.mjs <METHOD> <path> [body.json]` with the env vars from Phase A. Work in a directory OUTSIDE the repo (e.g. `~/ios-credentials/<slug>/`) so nothing secret can be committed.

**1. Resolve the app record (hard gate):**

```bash
node mobile-app/scripts/asc-api.mjs GET "/v1/apps?filter[bundleId]={bundle_id}"
```

Empty `data` → STOP. Tell the user to create the app record at appstoreconnect.apple.com (My Apps > + > New App) with this exact bundle ID, then resume. Otherwise save `{asc_app_id}` = `data[0].id`.

**2. Bundle ID registration + capabilities:**

```bash
node mobile-app/scripts/asc-api.mjs GET "/v1/bundleIds?filter[identifier]={bundle_id}"
# if missing, register it:
# POST /v1/bundleIds  {"data":{"type":"bundleIds","attributes":{"identifier":"{bundle_id}","name":"{title}","platform":"IOS"}}}
node mobile-app/scripts/asc-api.mjs GET "/v1/bundleIds/<BUNDLE_DB_ID>/bundleIdCapabilities"
# enable missing capabilities the app uses (IN_APP_PURCHASE, APPLE_ID_AUTH, PUSH_NOTIFICATIONS):
# POST /v1/bundleIdCapabilities {"data":{"type":"bundleIdCapabilities","attributes":{"capabilityType":"APPLE_ID_AUTH"},"relationships":{"bundleId":{"data":{"type":"bundleIds","id":"<BUNDLE_DB_ID>"}}}}}
```

**3. Distribution certificate.** First check for an existing one (Apple caps distribution certs at ~2-3 per account):

```bash
node mobile-app/scripts/asc-api.mjs GET "/v1/certificates?filter[certificateType]=DISTRIBUTION"
```

Reuse only if the user has its private key/.p12 locally. Otherwise create a new one (with user confirmation):

```bash
openssl req -new -newkey rsa:2048 -nodes -keyout dist.key -out dist.csr \
  -subj "/emailAddress=<user-email>/CN={title} Distribution/C=US"
node -e "const fs=require('fs');fs.writeFileSync('cert-req.json',JSON.stringify({data:{type:'certificates',attributes:{certificateType:'DISTRIBUTION',csrContent:fs.readFileSync('dist.csr','utf8')}}}))"
node mobile-app/scripts/asc-api.mjs POST /v1/certificates cert-req.json
# save body.data.id (cert id) and body.data.attributes.certificateContent (base64) -> dist.cer
```

**4. App Store provisioning profile:**

```bash
node -e "const fs=require('fs');fs.writeFileSync('profile-req.json',JSON.stringify({data:{type:'profiles',attributes:{name:'{title} AppStore',profileType:'IOS_APP_STORE'},relationships:{bundleId:{data:{type:'bundleIds',id:'<BUNDLE_DB_ID>'}},certificates:{data:[{type:'certificates',id:'<CERT_ID>'}]},devices:{data:[]}}}}))"
node mobile-app/scripts/asc-api.mjs POST /v1/profiles profile-req.json
# save body.data.attributes.profileContent (base64) -> profile.mobileprovision
```

**5. Build the .p12 (the `-legacy` flag is mandatory — Apple tooling rejects OpenSSL 3.x default ciphers):**

```bash
echo "<certificateContent-b64>" | base64 -d > dist.cer
P12PASS=$(openssl rand -hex 12)
openssl x509 -inform der -in dist.cer -out dist.pem 2>/dev/null || cp dist.cer dist.pem
openssl pkcs12 -export -in dist.pem -inkey dist.key -out dist.p12 \
  -name "{title} Distribution" -passout pass:"$P12PASS" -legacy
echo "<profileContent-b64>" | base64 -d > appstore.mobileprovision
```

**6. Wire into the project (gitignored paths only):**

```bash
mkdir -p mobile-app/credentials
cp dist.p12 mobile-app/credentials/dist.p12
cp appstore.mobileprovision mobile-app/credentials/
node -e "const fs=require('fs');fs.writeFileSync('mobile-app/credentials.json',JSON.stringify({ios:{provisioningProfilePath:'credentials/appstore.mobileprovision',distributionCertificate:{path:'credentials/dist.p12',password:process.argv[1]}}},null,2))" "$P12PASS"
git check-ignore mobile-app/credentials.json mobile-app/credentials/dist.p12   # MUST print both paths
```

Setup-only mode STOPS here — report readiness (app record, cert, profile, credentials.json, eas.json) and the next command.
</phase>

<phase n="E" title="Local iOS build (default)">
Default path. This uses the local Mac/Xcode toolchain and does **not** consume Expo cloud build credits. It still uses EAS CLI for config/versioning and local credentials for signing.

```bash
cd mobile-app
npx eas-cli@latest build --platform ios --profile production \
  --local --non-interactive --output /tmp/{slug}.ipa
```

If the build fails in `expo doctor` due to patch-version mismatches, inspect the exact error. Do not blindly upgrade dependencies during a release unless the build is blocked; if blocked, run `npx expo install --check`, apply the minimal Expo SDK patch updates, rerun `npx tsc --noEmit && npm run lint`, then rebuild.

Local `autoIncrement` can skip build numbers if a canceled cloud build already reserved one. That is acceptable for App Store Connect.
</phase>

<phase n="E-expo" title="EAS cloud build (--expo only)">
Run this phase only when the user passes `--expo`, and confirm once because it consumes Expo/EAS build credits:

```bash
cd mobile-app
npx eas-cli@latest build --platform ios --profile production --non-interactive --no-wait
```

Poll until terminal state (FINISHED / ERRORED):

```bash
npx eas-cli@latest build:list --platform ios --limit 1 --json --non-interactive
# or: npx eas-cli@latest build:view <BUILD_ID> --json
```

On FINISHED, download the artifact:

```bash
curl -sL -o /tmp/{slug}.ipa "<artifacts.buildUrl>"
```
</phase>

<phase n="F" title="TestFlight upload">
**1. Internal beta group** (TestFlight needs a group; `asc publish testflight` fails without `--group`):

```bash
node -e "const fs=require('fs');fs.writeFileSync('group-req.json',JSON.stringify({data:{type:'betaGroups',attributes:{name:'Internal',isInternalGroup:true,hasAccessToAllBuilds:true},relationships:{app:{data:{type:'apps',id:'{asc_app_id}'}}}}}))"
node mobile-app/scripts/asc-api.mjs POST /v1/betaGroups group-req.json
# 409 "already exists" is fine — fetch the id: GET "/v1/apps/{asc_app_id}/betaGroups"
```

**2. Upload and wait for processing** (asc must be authenticated — `asc auth status --validate`, else `asc auth login` with the same ASC key):

```bash
asc publish testflight --app "{asc_app_id}" --ipa /tmp/{slug}.ipa \
  --group "<BETA_GROUP_ID>" --wait --timeout 45m
```

**3. Add testers** (internal testers must be App Store Connect team members; external emails work via groups):

```bash
node -e "const fs=require('fs');fs.writeFileSync('tester-req.json',JSON.stringify({data:{type:'betaTesters',attributes:{email:'<tester-email>'},relationships:{betaGroups:{data:[{type:'betaGroups',id:'<BETA_GROUP_ID>'}]}}}}))"
node mobile-app/scripts/asc-api.mjs POST /v1/betaTesters tester-req.json
```

**4. Verify**: `asc status --app "{asc_app_id}" --output table` shows the build processed and attached to the group. Report build number, group, and tester list to the user.
</phase>

<failure_modes>
- **`.p12` rejected during signing** → it was exported without `-legacy`. Re-export: `openssl pkcs12 -in dist.p12 -nodes -out tmp.pem -passin pass:"$P12PASS" && openssl pkcs12 -export -in tmp.pem -out dist.p12 -passout pass:"$P12PASS" -legacy`.
- **Certificate creation returns 409 / limit reached** → list existing DISTRIBUTION certs; ask the user which to revoke (`DELETE /v1/certificates/<id>`) or whether they have its .p12 to reuse. Never revoke without confirmation — it breaks other apps signed with it.
- **Local build fails before Xcode archive** → verify macOS/Xcode/CocoaPods: `xcodebuild -version`, `xcode-select -p`, `command -v pod`. If unavailable and the user accepts cloud quota usage, rerun with `--expo`.
- **Local build fails asking for credentials** → `credentialsSource: "local"` is missing in `eas.json`, or `credentials.json` paths are wrong (they are relative to `mobile-app/`).
- **`--expo` cloud build fails asking for credentials** → same credential checks as local, then rerun cloud build.
- **`asc publish testflight` fails with "--group is required"** → create the beta group first (Phase F step 1).
- **Upload rejected: missing export compliance** → answer the encryption question in App Store Connect once, or add `"ITSAppUsesNonExemptEncryption": false` to `infoPlist` in `mobile-app/app.config.ts` so future builds skip it.
- **App opens but can't reach backend** → build was made before `eas.json` had prod URLs, or prod Convex env vars are missing (`npx convex env list --prod`). Rebuild after fixing — env is baked at build time.
- **User insists on EAS-managed credentials (Apple ID login)** → that flow requires interactive 2FA and cannot run with `--non-interactive`. Run `npx eas-cli@latest credentials` in a real terminal with the user present, then build. Do not attempt to script the 2FA prompt.
</failure_modes>

<success_metrics>
- `npm run check-setup` passes with a real `easProjectId`.
- Default local build produces `/tmp/{slug}.ipa` without any interactive prompt; `--expo` cloud builds reach FINISHED.
- The build shows as processed in TestFlight, attached to a beta group with at least one tester.
- The TestFlight app signs in and talks to the PROD Convex deployment.
- `git status` shows no credential files staged; nothing secret printed in the transcript.
</success_metrics>
