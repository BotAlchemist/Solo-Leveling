import { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import HUDLayout from "../components/HUDLayout";
import { apiGet } from "../lib/api";
import { getProfile } from "../lib/profile";
import "../styles/hud.css";

interface StatsPageProps {
  onBack: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
}

interface XpData {
  category: string;
  xp: number;
}

export default function StatsPage({ onBack, onLogout, onSettings }: StatsPageProps) {
  const [data, setData] = useState<XpData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalXp, setTotalXp] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = getProfile();
        const categories = profile.categories ?? [];

        // Fetch XP from API
        const res = await apiGet<{ xp: Record<string, number> }>("/status");
        const xpMap = res.xp ?? {};

        // Merge: all categories from profile, fill 0 for any with no logs yet
        const merged: XpData[] = categories.map((cat) => ({
          category: cat,
          xp: xpMap[cat] ?? 0,
        }));

        // Also include categories that have XP but aren't in profile (edge case)
        Object.entries(xpMap).forEach(([cat, pts]) => {
          if (!categories.includes(cat)) {
            merged.push({ category: cat, xp: pts });
          }
        });

        setData(merged);
        setTotalXp(merged.reduce((sum, d) => sum + d.xp, 0));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const rank = (xp: number) => {
    if (xp >= 200) return "S";
    if (xp >= 100) return "A";
    if (xp >= 50)  return "B";
    if (xp >= 20)  return "C";
    if (xp >= 5)   return "D";
    return "E";
  };

  return (
    <HUDLayout
      level={totalXp}
      rank={rank(totalXp)}
      onLogout={onLogout}
      onSettings={onSettings}
    >
      <div className="stats-page">
        <div className="hud-card stats-card">
          <div className="stats-header">
            <button className="hud-btn hud-btn-sm" onClick={onBack}>
              ← BACK
            </button>
            <h2 className="stats-title">SYSTEM STATUS</h2>
            <span className="stats-total-xp">Total XP: {totalXp}</span>
          </div>

          {loading && <p className="stats-loading">Loading status data…</p>}
          {error   && <p className="stats-error">{error}</p>}

          {!loading && !error && data.length === 0 && (
            <p className="stats-empty">
              No categories found. Add some in Settings and start logging!
            </p>
          )}

          {!loading && !error && data.length > 0 && (
            <>
              <div className="stats-chart-container">
                <ResponsiveContainer width="100%" height={340}>
                  <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="#1a2a3a" />
                    <PolarAngleAxis
                      dataKey="category"
                      tick={{ fill: "#00c8ff", fontSize: 13, fontFamily: "Courier New" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0d1117",
                        border: "1px solid #00c8ff",
                        color: "#e0e8f0",
                        fontFamily: "Courier New",
                        fontSize: 13,
                      }}
                      formatter={(value: number | undefined) => [`${value ?? 0} XP`, "Points"]}
                    />
                    <Radar
                      name="XP"
                      dataKey="xp"
                      stroke="#00c8ff"
                      fill="#00c8ff"
                      fillOpacity={0.2}
                      dot={{ fill: "#00c8ff", r: 4 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* XP table */}
              <div className="stats-table">
                {data
                  .slice()
                  .sort((a, b) => b.xp - a.xp)
                  .map((d) => (
                    <div key={d.category} className="stats-row">
                      <span className="stats-cat">{d.category}</span>
                      <div className="stats-bar-wrap">
                        <div
                          className="stats-bar"
                          style={{
                            width: `${Math.min(100, (d.xp / Math.max(1, Math.max(...data.map((x) => x.xp)))) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="stats-xp">{d.xp} XP</span>
                      <span className="stats-rank-badge">{rank(d.xp)}</span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    </HUDLayout>
  );
}
