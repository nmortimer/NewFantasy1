import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const TeamSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  owner: z.string().optional(),
  mascot: z.string(),           // we base the logo on this (not the name)
  primary: z.string(),          // hex or hsl
  secondary: z.string(),        // hex or hsl
  seed: z.number().optional(),
  logoUrl: z.string().nullable().optional(),
});
const BodySchema = z.object({ team: TeamSchema });

/**
 * Returns a single URL for a free, keyless generator (Pollinations) using
 * a prompt tuned for NFL‑style, professional mascot emblems.
 * We do NOT pass the team name to avoid text in the image.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { team } = BodySchema.parse(req.body);

    const normalize = (v: string) =>
      v.startsWith('#') || v.startsWith('hsl') ? v : `#${v}`;
    const primary = normalize(team.primary);
    const secondary = normalize(team.secondary);

    // jitter seed slightly to avoid identical/blank frames on some prompts
    const baseSeed =
      Number.isFinite(team.seed) ? (team.seed as number) : Math.floor(Math.random() * 1_000_000_000);
    const seed = (baseSeed ^ 0x9e3779b1) >>> 0;

    // ——— Prompt tuned for pro, NFL‑style mascot head emblem ———
    // Notes:
    //  • Mascot HEAD focus (clean silhouette) gives more consistent results
    //  • Strict vector language, limited color use, strong negative text ban
    //  • Plain background to keep outputs crop‑ready
    const lines = [
      'professional american football team logo',
      `mascot head emblem: ${team.mascot}`,      // no team name (prevents text)
      `team colors: primary ${primary}, secondary ${secondary}, plus white/negative space`,
      'vector illustration, bold geometric shapes, thick outline, sharp silhouette',
      'clean color blocking, 2–3 colors total, high contrast, centered, symmetrical',
      'flat background, no gradient, no 3d, no photo, no clutter',
      // Very strong “no text” clause — repeat in different phrasings
      'no text, no typography, no letters, no words, no numbers, no jersey numbers',
      'no watermark, no signature, no captions, no banners, no ribbons, no wordmarks',
    ];

    const prompt = lines.join(', ');

    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?seed=${encodeURIComponent(String(seed))}` +
      `&width=1024&height=1024&nologo=true&enhance=true`;

    return res.status(200).json({ url });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message ?? 'Bad Request' });
  }
}
