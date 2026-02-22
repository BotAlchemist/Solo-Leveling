import HUDLayout from "../components/HUDLayout";
import "../styles/hud.css";

interface HelpPageProps {
  onBack: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
  onStats?: () => void;
}

const RANKS = [
  { rank: "S", xp: "200+",   color: "#ffd700", description: "Sovereign — elite mastery" },
  { rank: "A", xp: "100–199", color: "#9b59ff", description: "Advanced — high proficiency" },
  { rank: "B", xp: "50–99",  color: "#00c8ff", description: "Adept — solid skill" },
  { rank: "C", xp: "20–49",  color: "#00ffaa", description: "Capable — growing foundation" },
  { rank: "D", xp: "5–19",   color: "#88a0b0", description: "Developing — early progress" },
  { rank: "E", xp: "0–4",    color: "#445566", description: "Entry — just starting out" },
];

export default function HelpPage({ onBack, onLogout, onSettings, onStats }: HelpPageProps) {
  return (
    <HUDLayout onLogout={onLogout} onSettings={onSettings} onStats={onStats}>
      <div className="help-page">

        {/* Header */}
        <div className="hud-card help-card">
          <div className="settings-header-row">
            <h1 className="hud-section-title" style={{ marginBottom: 0 }}>Help &amp; Guide</h1>
            <button className="hud-btn hud-btn-sm" onClick={onBack}>← Back</button>
          </div>
        </div>

        {/* How XP works */}
        <div className="hud-card help-card">
          <h2 className="help-section-title">⚡ How XP Works</h2>
          <p className="help-body">
            Every time you log an activity, you earn <span className="help-highlight">+1 XP</span> in
            that activity's category. XP accumulates over time and reflects your total effort in each skill area.
          </p>
          <div className="help-steps">
            <div className="help-step">
              <span className="help-step-num">1</span>
              <span>Select a category on the Daily Log page</span>
            </div>
            <div className="help-step">
              <span className="help-step-num">2</span>
              <span>Describe what you did and hit <span className="help-highlight">▶ Record</span></span>
            </div>
            <div className="help-step">
              <span className="help-step-num">3</span>
              <span>Your category XP increases by 1 instantly</span>
            </div>
            <div className="help-step">
              <span className="help-step-num">4</span>
              <span>Visit <span className="help-highlight">◈ Stats</span> to see your radar chart and rank progress</span>
            </div>
          </div>
        </div>

        {/* Rank table */}
        <div className="hud-card help-card">
          <h2 className="help-section-title">🏅 Rank System</h2>
          <p className="help-body">
            Ranks apply to each category individually <em>and</em> to your overall total XP (shown in the header).
          </p>

          <div className="rank-table">
            {RANKS.map(({ rank, xp, color, description }) => (
              <div key={rank} className="rank-row">
                <div className="rank-badge-large" style={{ borderColor: color, color, boxShadow: `0 0 10px ${color}55` }}>
                  {rank}
                </div>
                <div className="rank-info">
                  <span className="rank-xp-range" style={{ color }}>{xp} XP</span>
                  <span className="rank-desc">{description}</span>
                </div>
                <div className="rank-bar-wrap">
                  <div
                    className="rank-bar"
                    style={{
                      width: `${rank === "S" ? 100 : rank === "A" ? 83 : rank === "B" ? 65 : rank === "C" ? 45 : rank === "D" ? 27 : 10}%`,
                      background: color,
                      boxShadow: `0 0 6px ${color}88`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="hud-card help-card">
          <h2 className="help-section-title">💡 Tips</h2>
          <ul className="help-tips">
            <li>Add your skill categories in <span className="help-highlight">⚙ Settings</span> before logging</li>
            <li>Log small consistent efforts — 1 entry per session is enough to rank up over time</li>
            <li>The radar chart shows your balance across all categories</li>
            <li>Your overall rank (header badge) is based on <em>total</em> XP across all categories</li>
            <li>Use <span className="help-highlight">Danger Zone</span> in Settings to reset data if needed</li>
          </ul>
        </div>

      </div>
    </HUDLayout>
  );
}
