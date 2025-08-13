
# Fantasy Logo Studio — Reddit-Ready (FREE)
**Zero-cost** to deploy & run:
- Next.js + Vercel (free tier)
- Free image generation via Pollinations (no API keys)
- Adapters for **Sleeper**, **MFL**, and **ESPN** (ESPN private leagues require SWID/ESPN_S2 cookies pasted into the UI)

## How to deploy
1. Create a new GitHub repo and push this folder (it must be the repo root).
2. Connect the repo to Vercel. No env vars needed. No `vercel.json` required.
3. Deploy. Open the site, choose your provider, enter League ID (and season if MFL/ESPN).

## Notes
- ESPN private leagues need user cookies (SWID, ESPN_S2) pasted into the inputs—kept client-to-server only for that one request.
- Image generation is free but variable in quality; you can swap `/pages/api/generate-logo.ts` for a different provider later.
