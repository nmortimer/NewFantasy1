import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const TeamSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  owner: z.string().optional(),
  mascot: z.string(),           // we will base the logo on this (not the name)
  primary: z.string(),          // hex or hsl string
  secondary: z.string(),        // hex or hsl string
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

    const hex = (v: string) => (v.startsWith('#') || v.startsWith('hsl') ? v : `#${v}`);
    const primary = hex(team.primary);
    const secondary = hex(team.secondary);
    const seed =
      Number.isFinite(team.seed) ? (team.seed as number) : Math.floor(Math.random() * 1_000_000_000);

    // STRONG, TEXT‑FREE PROMPT (no team name passed)
    const prompt = [
      'professional American football team logo, modern sports branding',
      `mascot focus: ${team.mascot}`,
      `team colors: primary ${primary}, secondary ${secondary}`,
      'vector illustration, clean color blocking, bold geometric shapes, thick outline,',
      'high contrast, centered emblem, dynamic but minimal, no gradients,',
      'crisp edges, flat background',
      // very strong negative prompt
      'no text, no typography, no letters, no words, no watermark, no captions, no jersey numbers, no signatures',
    ].join(', ');

    // Free, keyless provider
    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?seed=${encodeURIComponent(String(seed))}` +
      `&width=1024&height=1024&nologo=true&enhance=true`;

    return res.status(200).json({ url });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message ?? 'Bad Request' });
  }
}
