
export async function fetchSleeperLeague(leagueId: string){
  const [rostersRes, usersRes] = await Promise.all([
    fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`),
    fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`),
  ]);
  if(!rostersRes.ok || !usersRes.ok) throw new Error('Failed to fetch Sleeper league');
  const rosters = await rostersRes.json();
  const users = await usersRes.json();
  const userMap = new Map(users.map((u:any)=> [u.user_id, u.display_name]));
  return rosters.map((r:any, i:number)=> ({
    id: String(r.roster_id ?? i),
    name: r.settings?.team_name || `Team ${i+1}`,
    owner: userMap.get(r.owner_id) || 'Unknown'
  }));
}
