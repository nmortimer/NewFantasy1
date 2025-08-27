'use client';
import { useMemo, useState } from "react";
import TeamCard, { Team } from "../components/TeamCard";

type Provider = "sleeper" | "mfl" | "espn";

const KNOWN_MASCOTS = [
  "Foxes","Fox","Wolves","Wolf","Tigers","Tiger","Bears","Bear","Hawks","Hawk","Eagles","Eagle",
  "Falcons","Falcon","Sharks","Shark","Dragons","Dragon","Knights","Knight","Buccaneers","Buccaneer",
  "Runners","Runner","Raiders","Raider","Warriors","Warrior","Raptors","Raptor","Vikings","Viking",
  "Titans","Titan","Gators","Gator","Bulls","Bull","Spartans","Spartan","Panthers","Panther","Pirates","Pirate"
];

function deriveMascot(name: string, owner?: string) {
  const tokens = name.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const lower = tokens.map((t) => t.toLowerCase());
  for (const m of KNOWN_MASCOTS) {
    if (lower.includes(m.toLowerCase())) return m.endsWith("s") ? m : m + "s";
  }
  const pool = ["Foxes","Wolves","Tigers","Bears","Hawks","Eagles","Falcons","Sharks","Dragons","Knights","Raiders","Warriors","Raptors","Vikings","Titans","Gators","Bulls","Spartans","Panthers","Pirates"];
  const basis = (owner || name || "Team").toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < basis.length; i++) {
    h ^= basis.charCodeAt(i);
    h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);
  }
  return pool[(h >>> 0) % pool.length];
}

const NFL_PALETTE = [
  { primary: "#002244", secondary: "#A5ACAF" },
  { primary: "#203731", secondary: "#FFB612" },
  { primary: "#008E97", secondary: "#F36F21" },
  { primary: "#101820", secondary: "#D3BC8D" },
  { primary: "#003594", secondary: "#C8102E" },
  { primary: "#4F2683", secondary: "#FFC62F" },
  { primary: "#AA0000", secondary: "#B3995D" },
  { primary: "#006778", secondary: "#101820" },
  { primary: "#0B2265", secondary: "#FF3C00" },
  { primary: "#97233F", secondary: "#000000" },
  { primary: "#0076B6", secondary: "#B0B7BC" },
  { primary: "#0B162A", secondary: "#C83803" },
  { primary: "#D50A0A", secondary: "#5A615E" },
  { primary: "#0038A8", secondary: "#FFD100" },
  { primary: "#2A0845", secondary: "#111111" },
  { primary: "#0B4F3D", secondary: "#E1C699" },
  { primary: "#002244", secondary: "#69BE28" },
  { primary: "#A71930", secondary: "#0B2265" },
  { primary: "#1C1C1C", secondary: "#FFB612" },
  { primary: "#1D428A", secondary: "#A2AAAD" }
];

function shuffle<T>(arr: T[], seed: number) {
  const out = arr.slice();
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const rseed = () => Math.floor(Math.random() * 1_000_000_000);

export default function Home() {
  const [provider, setProvider] = useState<Provider>("sleeper");
  const [leagueId, setLeagueId] = useState("");
  const [season, setSeason] = useState("2025");
  const [swid, setSwid] = useState("");
  const [s2, setS2] = useState("");
  const [mode, setMode] = useState<"commissioner" | "manager">("commissioner");
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const hasTeams = teams.length > 0;

  const remixSeed = useMemo(
    () => Number(String(leagueId).replace(/\D/g, "")) || 2025,
    [leagueId]
  );

  function applyPalette(bump = 0) {
    const pal = shuffle(NFL_PALETTE, remixSeed + bump);
    setTeams((prev) =>
      prev.map((t, i) => ({
        ...t,
        primary: pal[i % pal.length].primary,
        secondary: pal[i % pal.length].secondary
      }))
    );
  }

  async function loadLeague() {
    if (!leagueId) return;
    try {
      setLoading(true);
      const qs = new URLSearchParams({
        provider,
        leagueId,
        ...(provider !== "sleeper" ? { season } : {}),
        ...(provider === "espn" ? { swid, s2 } : {})
      });
      const res = await fetch(`/api/league?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed league load");

      const pal = shuffle(NFL_PALETTE, remixSeed);
      const mapped: Team[] = (data.teams as any[]).map((t, i) => {
        const name = (t.name || `Team ${i + 1}`).trim();
        const owner = (t.owner || "Unknown").trim();
        const colors = pal[i % pal.length];
        return {
          id: String(t.id ?? i),
          name,
          owner,
          mascot: deriveMascot(name, owner),
          primary: colors.primary,
          secondary: colors.secondary,
          seed: rseed(),
          logoUrl: null
        };
      });
      setTeams(mapped);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function generate(team: Team) {
    const res = await fetch("/api/generate-logo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "gen failed");
    setTeams((prev) =>
      prev.map((x) => (x.id === team.id ? { ...x, logoUrl: data.url } : x))
    );
  }

  async function generateAll() {
    for (const t of teams) {
      try {
        await generate(t);
      } catch {}
    }
  }

  const [remixCount, setRemixCount] = useState(0);
  function remix() {
    const n = remixCount + 1;
    setRemixCount(n);
    applyPalette(n);
  }

  return (
    <>
      {/* Top Bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-gradient-to-b from-bg/95 to-bg/80 backdrop-blur">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-3 px-4 py-3 md:grid-cols-[1fr_auto]">
          <div className="flex items-center gap-3">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent2 shadow-soft" />
            <div>
              <div className="text-base font-extrabold leading-tight">
                Fantasy Logo Studio
              </div>
              <div className="text-[11px] text-muted -mt-0.5">
                AI-powered league logos (free)
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <select
              className="select"
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
            >
              <option value="sleeper">Sleeper</option>
              <option value="mfl">MFL</option>
              <option value="espn">ESPN</option>
            </select>
            <input
              className="input w-40 md:w-56"
              placeholder="League ID"
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
            />
            {provider !== "sleeper" && (
              <input
                className="input w-24"
                placeholder="Season"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
              />
            )}
            {provider === "espn" && (
              <>
                <input
                  className="input w-36"
                  placeholder="SWID (private)"
                  value={swid}
                  onChange={(e) => setSwid(e.target.value)}
                />
                <input
                  className="input w-36"
                  placeholder="ESPN_S2 (private)"
                  value={s2}
                  onChange={(e) => setS2(e.target.value)}
                />
              </>
            )}
            <button
              className="btn btn-primary"
              onClick={loadLeague}
              disabled={loading}
            >
              {loading ? "Loading…" : "Load League"}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-[1240px] px-4 py-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="card h-fit p-4">
            <div className="space-y-3">
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  League
                </div>
                <div className="flex gap-2">
                  <button
                    className={`btn ${
                      mode === "commissioner" ? "btn-primary" : ""
                    }`}
                    onClick={() => setMode("commissioner")}
                  >
                    Commissioner
                  </button>
                  <button
                    className={`btn ${
                      mode === "manager" ? "btn-primary" : ""
                    }`}
                    onClick={() => setMode("manager")}
                  >
                    Manager
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="btn"
                  onClick={generateAll}
                  disabled={!hasTeams}
                >
                  Generate All
                </button>
                <button
                  className="btn"
                  onClick={() => setTeams([])}
                  disabled={!hasTeams}
                >
                  Clear
                </button>
              </div>

              <hr className="border-border" />

              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Colors
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn"
                    onClick={() => applyPalette(0)}
                    disabled={!hasTeams}
                  >
                    Apply NFL Palette
                  </button>
                  <button className="btn" onClick={remix} disabled={!hasTeams}>
                    Remix Palette
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Sets distinct, NFL-style colors across all teams. Users can
                  still edit per team.
                </p>
              </div>

              <hr className="border-border" />

              <div className="text-xs text-muted">
                Teams: <b className="text-text">{teams.length || 0}</b>
              </div>
            </div>
          </aside>

          {/* Grid / Empty */}
          <main>
            {!hasTeams ? (
              <div className="card grid place-items-center p-8 text-center text-sm text-muted">
                Load your league above, then click <b>Generate</b> on a team or{" "}
                <b>Generate All</b>. Logos are free—no keys. Click a logo to
                view or download.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((t) => (
                  <TeamCard
                    key={t.id}
                    team={t}
                    onUpdate={(p) =>
                      setTeams((prev) =>
                        prev.map((x) =>
                          x.id === t.id ? { ...x, ...p } : x
                        )
                      )
                    }
                    onGenerate={() => generate(t)}
                    roomy={mode === "manager"}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
