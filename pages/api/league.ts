
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { fetchSleeperLeague } from '@/lib/providers/sleeper';
import { fetchMFLLeague } from '@/lib/providers/mfl';
import { fetchESPNLeague } from '@/lib/providers/espn';

const Q = z.object({
  provider: z.enum(['sleeper','mfl','espn']),
  leagueId: z.string(),
  season: z.string().optional(),
  swid: z.string().optional(),
  s2: z.string().optional()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  try{
    const q = Q.parse(req.query);
    let teams:any[] = [];
    if(q.provider==='sleeper'){
      teams = await fetchSleeperLeague(q.leagueId);
    } else if(q.provider==='mfl'){
      if(!q.season) throw new Error('season required for MFL');
      teams = await fetchMFLLeague(q.leagueId, q.season);
    } else {
      if(!q.season) throw new Error('season required for ESPN');
      teams = await fetchESPNLeague(q.leagueId, q.season, q.swid, q.s2);
    }
    res.status(200).json({ teams });
  } catch (e:any){
    res.status(400).json({ error: e.message || 'Bad Request' });
  }
}
