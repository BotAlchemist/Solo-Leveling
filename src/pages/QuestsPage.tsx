import { useState, useEffect, useCallback } from "react";
import HUDLayout from "../components/HUDLayout";
import SystemToast from "../components/SystemToast";
import type { ToastMessage } from "../components/SystemToast";
import { getProfile } from "../lib/profile";
import { apiGet, apiPost } from "../lib/api";
import "../styles/hud.css";

interface QuestsPageProps {
  onBack: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
  onStats?: () => void;
  onHelp?: () => void;
  onHealth?: () => void;
}

interface Quest {
  questid: string;
  title: string;
  category: string;
  status: "pending" | "completed";
  createdAt: string;
  completedAt?: string;
}

export default function QuestsPage({ onBack, onLogout, onSettings, onStats, onHelp, onHealth }: QuestsPageProps) {
  const categories = getProfile().categories;

  const [quests, setQuests]       = useState<Quest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [toasts, setToasts]       = useState<ToastMessage[]>([]);
  const [completing, setCompleting] = useState<string | null>(null);

  // Add-quest form state
  const [title, setTitle]         = useState("");
  const [category, setCategory]   = useState(categories[0] ?? "");
  const [submitting, setSubmitting] = useState(false);

  // ── Load quests ─────────────────────────────────────────────────────
  useEffect(() => {
    apiGet<{ quests: Quest[] }>("/quests")
      .then((res) => setQuests(res.quests))
      .catch(() => pushToast("SYSTEM: Failed to load quests."))
      .finally(() => setLoading(false));
  }, []);

  const pushToast = (text: string) => {
    setToasts((prev) => [...prev, { id: crypto.randomUUID(), text }]);
  };

  const expireToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Add quest ────────────────────────────────────────────────────────
  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const res = await apiPost<{ questid: string; createdAt: string }>("/quests", {
        title: trimmed,
        category,
      });
      const newQuest: Quest = {
        questid: res.questid,
        title: trimmed,
        category,
        status: "pending",
        createdAt: res.createdAt,
      };
      setQuests((prev) => [newQuest, ...prev]);
      setTitle("");
      pushToast(`SYSTEM: Quest added — "${trimmed}"`);
    } catch {
      pushToast("SYSTEM: Failed to add quest. Check connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Complete quest ───────────────────────────────────────────────────
  const handleComplete = async (quest: Quest) => {
    if (completing) return;
    setCompleting(quest.questid);
    try {
      await apiPost("/quests/complete", { questid: quest.questid });
      setQuests((prev) =>
        prev.map((q) =>
          q.questid === quest.questid
            ? { ...q, status: "completed", completedAt: new Date().toISOString() }
            : q
        )
      );
      pushToast(`SYSTEM: Quest complete! +1 XP in ${quest.category}`);
    } catch {
      pushToast("SYSTEM: Failed to complete quest. Try again.");
    } finally {
      setCompleting(null);
    }
  };

  const pending   = quests.filter((q) => q.status === "pending");
  const completed = quests.filter((q) => q.status === "completed");

  return (
    <HUDLayout
      onLogout={onLogout}
      onSettings={onSettings}
      onStats={onStats}
      onHelp={onHelp}
      onHealth={onHealth}
    >
      <SystemToast messages={toasts} onExpire={expireToast} />

      {/* ── Header ── */}
      <div className="hud-card">
        <div className="settings-header-row">
          <h1 className="hud-section-title" style={{ marginBottom: 0 }}>
            ☆ QUESTS
          </h1>
          <button className="hud-btn hud-btn-sm" onClick={onBack}>
            ← Back
          </button>
        </div>
        <p style={{ color: "var(--hud-muted, #7a9bb0)", marginTop: "0.4rem", fontSize: "0.85rem" }}>
          Track future tasks. Complete them to earn XP.
        </p>
      </div>

      {/* ── Add Quest Form ── */}
      <div className="hud-card">
        <h2 className="hud-section-title" style={{ fontSize: "0.95rem" }}>Add New Quest</h2>
        <form onSubmit={handleAddQuest}>
          {categories.length > 0 && (
            <div className="hud-field">
              <label className="hud-label">Category</label>
              <div className="category-selector">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-card${category === cat ? " category-card--active" : ""}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="hud-field">
            <label className="hud-label">Quest Title</label>
            <input
              className="hud-textarea"
              style={{ resize: "none", height: "2.6rem", padding: "0.5rem 0.75rem" }}
              placeholder="Describe the task…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button
              type="submit"
              className="hud-btn"
              disabled={submitting || !title.trim()}
            >
              {submitting ? "Adding…" : "＋ Add Quest"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Pending Quests ── */}
      <div className="hud-card">
        <h2 className="hud-section-title" style={{ fontSize: "0.95rem" }}>
          Pending ({pending.length})
        </h2>

        {loading && (
          <p style={{ color: "var(--hud-muted, #7a9bb0)", fontSize: "0.85rem" }}>Loading…</p>
        )}

        {!loading && pending.length === 0 && (
          <p style={{ color: "var(--hud-muted, #7a9bb0)", fontSize: "0.85rem" }}>
            No pending quests. Add one above!
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {pending.map((quest) => (
            <div key={quest.questid} className="log-entry" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="log-text">{quest.title}</span>
                <span
                  className="log-category"
                  style={{ marginLeft: "0.5rem", fontSize: "0.75rem", opacity: 0.7 }}
                >
                  [{quest.category}]
                </span>
              </div>
              <button
                className="hud-btn hud-btn-sm"
                style={{ flexShrink: 0, fontSize: "0.75rem" }}
                disabled={completing === quest.questid}
                onClick={() => handleComplete(quest)}
                title="Mark as complete and earn XP"
              >
                {completing === quest.questid ? "…" : "✔ Complete"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Completed Quests ── */}
      {completed.length > 0 && (
        <div className="hud-card">
          <h2 className="hud-section-title" style={{ fontSize: "0.95rem" }}>
            Completed ({completed.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {completed.map((quest) => (
              <div
                key={quest.questid}
                className="log-entry"
                style={{ opacity: 0.55, textDecoration: "line-through" }}
              >
                <span className="log-text">{quest.title}</span>
                <span
                  className="log-category"
                  style={{ marginLeft: "0.5rem", fontSize: "0.75rem" }}
                >
                  [{quest.category}]
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </HUDLayout>
  );
}
