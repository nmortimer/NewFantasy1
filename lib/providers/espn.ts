
// Supports public leagues (private ones require user-provided cookies: SWID & ESPN_S2)
export async function fetchESPNLeague(leagueId: string, season: string, swid?: string, s2?: string){
  const url = `https://fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}?view=mTeam`;
  const headers: Record<string,string> = { 'User-Agent': 'Mozilla/5.0' };
  if (swid && s2) headers['Cookie'] = `SWID=${swid}; ESPN_S2=${s2}`;
  const res = await fetch(url, { headers });
  if(!res.ok) throw new Error('Failed to fetch ESPN league (is it private?)');
  const data = await res.json();
  const teams = data?.teams || [];
  return teams.map((t:any)=> ({
    id: String(t.id),
    name: t.location && t.nickname ? `${t.location} ${t.nickname}` : `Team ${t.id}`,
    owner: (t.owners && t.owners[0]) ? String(t.owners[0]) : 'Unknown'
  }));
}
