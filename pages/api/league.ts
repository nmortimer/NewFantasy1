import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

/**
 * Query params:
 * - provider: 'sleeper' | 'mfl' | 'espn'
 * - leagueId: string
 * - season?: string (required for MFL/ESPN)
 * - swid?: string, s2?: string (optional cookies for private ESPN leagues)
 */
const Q = z.object({
  provider: z.enum(['sleeper', 'mfl', 'espn']),
  leagueId: z.string(),
  season: z.string().optional(),
  swid: z.string().optional(),
  s2: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const q = Q.parse(req.query);

    if (q.provider === 'sleeper') {
      // Fetch both endpoints so we can resolve the real team name
      const [rostersRes, usersRes] = await Promise.all([
        fetch(`https://api.sleeper.app/v1/league/${q.leagueId}/rosters`),
        fetch(`https://api.sleeper.app/v1/league/${q.leagueId}/users`),
      ]);
      if (!rostersRes.ok || !usersRes.ok) throw new Error('Failed to fetch Sleeper league');

      const rosters: any[] = await rostersRes.json();
      const users: any[] = await usersRes.json();
      const userById: Map<string, any> = new Map(users.map((u: any) => [u.user_id, u]));

      const teams = rosters.map((r: any, i: number) => {
        const ownerId: string = r.owner_id || r.ownerId || r.owner || '';
        const user: any = ownerId ? (userById.get(ownerId) as any) : null; // <-- cast to any to avoid TS error

        const customName = ((user?.metadata?.team_name as string) || '').trim();
        const rosterName = ((r?.settings?.team_name as string) || '').trim();
        const displayName = ((user?.display_name as string) || '').trim();

        const name = customName || rosterName || displayName || `Team ${i + 1}`;
        const owner = displayName || 'Unknown';

        return {
          id: String(r.roster_id ?? i),
          name,
          owner,
        };
      });

      return res.status(200).json({ teams });
    }

    if (q.provider === 'mfl') {
      if (!q.season) throw new Error('season required for MFL');
      const base = `https://api.myfantasyleague.com/${q.season}/export`;
      const r = await fetch(`${base}?TYPE=league&L=${q.leagueId}&W=1&JSON=1`);
      if (!r.ok) throw new Error('Failed to fetch MFL league');
      const data: any = await r.json();
      const franchises: any[] = data?.league?.franchises?.franchise || [];
      const teams = franchises.map((t: any, i: number) => ({
        id: String(t.id ?? i),
        name: (t.name as string)?.trim() || `Team ${i + 1}`,
        owner: (t.owner_name as string)?.trim() || 'Unknown',
      }));
      return res.status(200).json({ teams });
    }

    // ESPN
    if (!q.season) throw new Error('season required for ESPN');
    const url = `https://fantasy.espn.com/apis/v3/games/ffl/seasons/${q.season}/segments/0/leagues/${q.leagueId}?view=mTeam`;
    const headers: Record<string, string> = { 'User-Agent': 'Mozilla/5.0' };
    if (q.swid && q.s2) headers['Cookie'] = `SWID=${q.swid}; ESPN_S2=${q.s2}`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error('Failed to fetch ESPN league (is it private?)');
    const json: any = await r.json();
    const teams = (json?.teams || []).map((t: any, i: number) => ({
      id: String(t.id ?? i),
      name:
        (t.location && t.nickname ? `${t.location} ${t.nickname}` : '').trim() ||
        `Team ${i + 1}`,
      owner: (t.owners && t.owners[0]) ? String(t.owners[0]) : 'Unknown',
    }));
    return res.status(200).json({ teams });
  } catch (e: any) {
    return res.status(400).json({ error: e.message || 'Bad Request' });
  }
}
