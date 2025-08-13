import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { noTextClause } from '@/lib/utils';

const TeamSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  owner: z.string().optional(),
  mascot: z.string(),
  primary: z.string(),
  secondary: z.string(),
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
    const hex = (v: string) => (v.startsWith('#') ? v : `#${v}`);
    const primary = hex(team.primary);
    const secondary = hex(team.secondary);
    const seed = Number.isFinite(team.seed) ? (team.seed as number) : Math.floor(Math.random() * 1_000_000_000);

    const prompt = [
      'clean modern vector sports logo, fantasy football team',
      `team name: ${team.name}`,
      `mascot: ${team.mascot}`,
      `primary color ${primary}, secondary color ${secondary}`,
      'centered emblem, bold lines, crisp edges, high contrast',
      noTextClause(), // <— stronger “no text”
    ].join(', ');

    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?seed=${encodeURIComponent(String(seed))}&width=1024&height=1024&nologo=true&enhance=true`;

    return res.status(200).json({ url });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message ?? 'Bad Request' });
  }
}
