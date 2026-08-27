# Render Secret Files — sadi-pro-doc (R2)

Use **either** Environment Variables **or** Secret Files. Code in `server/lib/r2.ts:12` reads both:
1. `process.env.R2_*`
2. `/etc/secrets/R2_*`  (Render Secret Files)

## Option A — 4 separate Secret Files (recommended for Render)
In Render Dashboard → Service `sadi-pro-ai` → **Environment** → **Secret Files** → **Add Secret File**:

1. **Filename:** `R2_ENDPOINT`
   ```
   https://1961d0f09efce3a8108477a413fa5f3f.r2.cloudflarestorage.com
   ```
   (DO NOT append /sadi-pro-doc)

2. **Filename:** `R2_BUCKET`
   ```
   sadi-pro-doc
   ```

3. **Filename:** `R2_ACCESS_KEY_ID`
   ```
   <paste your R2 Access Key ID here>
   ```

4. **Filename:** `R2_SECRET_ACCESS_KEY`
   ```
   <paste your R2 Secret Access Key here>
   ```

To get the keys: Cloudflare Dashboard → R2 → **Manage R2 API Tokens** → **Create API Token** → Permissions: **Object Read & Write** → Select bucket `sadi-pro-doc` → Create.

## Option B — Single .env Secret File
Create one Secret File named `.env` with:
```
R2_ENDPOINT=https://1961d0f09efce3a8108477a413fa5f3f.r2.cloudflarestorage.com
R2_BUCKET=sadi-pro-doc
R2_ACCESS_KEY_ID=PASTE_HERE
R2_SECRET_ACCESS_KEY=PASTE_HERE
```

## Verify after Deploy
Open (no auth needed):
- https://sadi-pro-ai.onrender.com/api/health → expect `{"r2":"configured"}`
- https://sadi-pro-ai.onrender.com/api/r2-status → expect `{"isR2Configured":true,"hasKey":true}`

If `isR2Configured:false` → check filenames are exact (case-sensitive) and no extra spaces.

## Template file for upload (fill keys)
See `r2-secrets.env` in this repo — fill and use as Secret File content.
