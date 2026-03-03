import { useState, useCallback, useEffect } from "react";
import HUDLayout from "../components/HUDLayout";
import SystemToast from "../components/SystemToast";
import type { ToastMessage } from "../components/SystemToast";
import { addLog } from "../lib/storage";
import type { LogItem } from "../lib/storage";
import { getProfile } from "../lib/profile";
import { apiGet, apiPost } from "../lib/api";
import "../styles/hud.css";

interface DailyLogPageProps {
  onLogout?: () => void;
  onSettings?: () => void;
  onStats?: () => void;
  onHelp?: () => void;
  onQuests?: () => void;
  onHealth?: () => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DailyLogPage({ onLogout, onSettings, onStats, onHelp, onQuests, onHealth }: DailyLogPageProps) {
  const categories = getProfile().categories;
  const [input, setInput] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch today's logs from DynamoDB on mount
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    apiGet<{ logs: Array<{ userid: string; timestamp: string; category: string; activity: string }> }>(
      `/logs?date=${today}`
    )
      .then((res) => {
        const fetched: LogItem[] = res.logs.map((l) => ({
          id: l.timestamp,
          text: l.activity,
          category: l.category,
          createdAt: l.timestamp,
        }));
        // already sorted latest-first by backend
        setLogs(fetched);
      })
      .catch(() => {
        // fallback: nothing shown, user will see empty state
      })
      .finally(() => setLoadingLogs(false));
  }, []);

  const pushToast = (text: string) => {
    setToasts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text },
    ]);
  };

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      // Save to DynamoDB
      const res = await apiPost<{ timestamp: string }>("/logs", { activity: trimmed, category });
      // Mirror to localStorage as cache
      addLog(trimmed, category);
      // Prepend the new log directly to state (instant UI update)
      const newLog: LogItem = {
        id: res.timestamp,
        text: trimmed,
        category,
        createdAt: res.timestamp,
      };
      setLogs((prev) => [newLog, ...prev]);
      setInput("");
      pushToast("SYSTEM: Activity recorded. +1 XP");
    } catch {
      pushToast("SYSTEM: Failed to save. Check connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HUDLayout onLogout={onLogout} onSettings={onSettings} onStats={onStats} onHelp={onHelp} onQuests={onQuests} onHealth={onHealth}>
      {/* ── Input panel ── */}
      <div className="hud-card">
        <h1 className="hud-section-title">Log Activity</h1>

        <form onSubmit={handleSubmit}>
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
          <textarea
            className="hud-textarea"
            placeholder="What did you work on? (e.g. Ran 3km, Studied React for 1h…)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Activity description"
          />
          <button
            type="submit"
            className="hud-btn"
            disabled={!input.trim() || submitting}
          >
            {submitting ? "SAVING…" : "▶ Record"}
          </button>
        </form>
      </div>

      {/* ── Today's logs ── */}
      <div className="hud-card mt-24">
        <h2 className="hud-section-title">
          Today's Logs
          {logs.length > 0 && (
            <span style={{ marginLeft: "auto", opacity: 0.6, fontWeight: 400 }}>
              {logs.length} entr{logs.length === 1 ? "y" : "ies"}
            </span>
          )}
        </h2>

        {loadingLogs ? (
          <p className="log-empty">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="log-empty">— No activities logged today —</p>
        ) : (
          <ul className="log-list" aria-label="Today's activity logs">
            {logs.map((log) => (
              <li key={log.id} className="log-item">
                <div className="log-item-meta">
                  {formatTime(log.createdAt)}
                  {log.category && (
                    <span className="log-item-category">{log.category}</span>
                  )}
                </div>
                <div className="log-item-text">{log.text}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Toast layer ── */}
      <SystemToast messages={toasts} onExpire={removeToast} />
    </HUDLayout>
  );
}
