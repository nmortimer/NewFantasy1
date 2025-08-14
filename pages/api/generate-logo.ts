import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const TeamSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  owner: z.string().optional(),
  mascot: z.string(),           // logo is based on mascot only (not team name)
  primary: z.string(),          // hex or hsl
  secondary: z.string(),        // hex or hsl
  seed: z.number().optional(),
  logoUrl: z.string().nullable().optional(),
});
const BodySchema = z.object({ team: TeamSchema });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { team } = BodySchema.parse(req.body);

    const normalize = (v: string) =>
      v.startsWith('#') || v.startsWith('hsl') ? v : `#${v}`;
    const primary = normalize(team.primary).toUpperCase();
    const secondary = normalize(team.secondary).toUpperCase();

    // jitter seed slightly to reduce rare blank frames
    const baseSeed =
      Number.isFinite(team.seed) ? (team.seed as number) : Math.floor(Math.random() * 1_000_000_000);
    const seed = (baseSeed ^ 0x9e3779b1) >>> 0;

    // —— PRO, NFL‑style mascot head emblem — with HARD color constraints ——
    // We repeat palette constraints multiple times and assign roles (dominant/accent)
    // to strongly bias the model toward the exact colors provided.
    const lines = [
      'professional american football team logo',
      `mascot head emblem: ${team.mascot}`,
      'vector illustration, bold geometric shapes, thick outline, sharp silhouette',
      'clean color blocking, 2–3 colors total, high contrast, centered, symmetrical',
      'flat background, no gradient, no 3d, no photo, no clutter',
      // COLOR CONTROL (repeat in different phrasings)
      `color palette ONLY: ${primary}, ${secondary}, white`,
      `dominant color: ${primary}; accent color: ${secondary}`,
      `use strictly these colors: ${primary}, ${secondary}, white (no other hues)`,
      'limit colors to the palette; match hex codes exactly; no extra tints or shades',
      // Strong “no text”
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
