
export async function fetchMFLLeague(leagueId: string, season: string){
  const base = `https://api.myfantasyleague.com/${season}/export`;
  const res = await fetch(`${base}?TYPE=league&L=${leagueId}&W=1&JSON=1`);
  if(!res.ok) throw new Error('Failed to fetch MFL league');
  const data = await res.json();
  const teams = data?.league?.franchises?.franchise || [];
  return teams.map((t:any, i:number)=> ({
    id: String(t.id ?? i),
    name: t.name || `Team ${i+1}`,
    owner: t.owner_name || 'Unknown'
  }));
}
