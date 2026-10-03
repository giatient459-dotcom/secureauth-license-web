# SecureAuth License Web

Admin panel + online verify API (JSON file storage, no native DB).

## Quick start

```bash
cd secureauth-license-web
cp .env.example .env
# Edit ADMIN_USER, ADMIN_PASS, API_SIGNING_SECRET, PLUGIN_API_TOKEN
npm install
npm start
```

- Admin UI: http://127.0.0.1:3080/admin/
- Health: http://127.0.0.1:3080/api/health
- Verify: `POST /api/v1/verify`

## Plugin verify request

```http
POST /api/v1/verify
Authorization: Bearer <PLUGIN_API_TOKEN>
Content-Type: application/json

{"key":"...","hwid":"...","plugin":"SecureAuth","version":"1.0.2"}
```

Response (signed):

```json
{
  "ok": true,
  "premium": true,
  "customer": "TenKH",
  "expiresAt": 1735689600000,
  "serverTime": 1710000000000,
  "signature": "..."
}
```

Plugin verifies HMAC-SHA256 of JSON body (without signature field) using `API_SIGNING_SECRET`.

## Admin

Browser opens `/admin/` → HTTP Basic (ADMIN_USER / ADMIN_PASS).

- Create license (days, optional HWID)
- Copy key → customer puts in config or license.key
- First successful verify **binds HWID**
- Reset HWID / Revoke / Delete

## Deploy (Pterodactyl / VPS)

- Node 20+
- Open port `3080` (or set PORT)
- Persist `data/licenses.json`
- HTTPS reverse proxy recommended

## Next: hybrid plugin client

Java side will call this API on enable + cache grace days; offline local HMAC can be removed.
