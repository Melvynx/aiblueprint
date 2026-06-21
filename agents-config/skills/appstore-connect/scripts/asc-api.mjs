#!/usr/bin/env node
/**
 * Minimal App Store Connect API client. Zero dependencies.
 * Used by the setup-testflight / deploy-ios-app skills to manage certificates,
 * provisioning profiles, beta groups, and testers without the web UI.
 *
 * Credentials come from env vars (never hardcode them):
 *   ASC_KEY_ID     - 10-char API key ID (from the AuthKey_<KEY_ID>.p8 filename)
 *   ASC_ISSUER_ID  - team issuer UUID (App Store Connect > Users and Access > Integrations)
 *   ASC_P8_PATH    - absolute path to the AuthKey_*.p8 private key file
 *
 * Usage:
 *   node scripts/asc-api.mjs GET "/v1/apps?filter[bundleId]=com.example.app"
 *   node scripts/asc-api.mjs POST /v1/betaGroups body.json
 *   node scripts/asc-api.mjs DELETE /v1/profiles/<id>
 *
 * Prints {"status": <http status>, "body": <json|null>} on stdout.
 * Exits non-zero on HTTP >= 400 so shell scripts can chain safely.
 */
import crypto from "node:crypto";
import fs from "node:fs";

const KEY_ID = process.env.ASC_KEY_ID;
const ISSUER_ID = process.env.ASC_ISSUER_ID;
const P8_PATH = process.env.ASC_P8_PATH;

if (!KEY_ID || !ISSUER_ID || !P8_PATH) {
  console.error(
    "Missing credentials. Set ASC_KEY_ID, ASC_ISSUER_ID, and ASC_P8_PATH env vars.\n" +
      "Key ID is in the .p8 filename (AuthKey_<KEY_ID>.p8); issuer ID is in\n" +
      "App Store Connect > Users and Access > Integrations > App Store Connect API.",
  );
  process.exit(2);
}
if (!fs.existsSync(P8_PATH)) {
  console.error(`ASC_P8_PATH not found: ${P8_PATH}`);
  process.exit(2);
}

const b64url = (buf) =>
  Buffer.from(buf)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

function makeJwt() {
  const header = { alg: "ES256", kid: KEY_ID, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: ISSUER_ID,
    iat: now,
    exp: now + 900,
    aud: "appstoreconnect-v1",
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const key = crypto.createPrivateKey(fs.readFileSync(P8_PATH, "utf8"));
  const sig = crypto.sign("sha256", Buffer.from(signingInput), {
    key,
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${b64url(sig)}`;
}

const [method, apiPath, bodyFile] = process.argv.slice(2);
if (!method || !apiPath) {
  console.error("usage: asc-api.mjs <GET|POST|PATCH|DELETE> </v1/...> [bodyFile.json]");
  process.exit(2);
}

const res = await fetch(`https://api.appstoreconnect.apple.com${encodeURI(apiPath)}`, {
  method: method.toUpperCase(),
  headers: {
    Authorization: `Bearer ${makeJwt()}`,
    "Content-Type": "application/json",
  },
  body: bodyFile ? fs.readFileSync(bodyFile, "utf8") : undefined,
});

const text = await res.text();
let body = null;
try {
  body = text ? JSON.parse(text) : null;
} catch {
  body = { raw: text.slice(0, 2000) };
}
console.log(JSON.stringify({ status: res.status, body }, null, 2));
if (res.status >= 400) process.exit(1);
