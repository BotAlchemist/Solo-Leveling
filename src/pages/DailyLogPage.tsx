import { useState, useCallback } from "react";
import HUDLayout from "../components/HUDLayout";
import SystemToast from "../components/SystemToast";
import type { ToastMessage } from "../components/SystemToast";
import { addLog, getTodaysLogs } from "../lib/storage";
import type { LogItem } from "../lib/storage";
import "../styles/hud.css";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DailyLogPage() {
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<LogItem[]>(() => getTodaysLogs());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = (text: string) => {
    setToasts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text },
    ]);
  };

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    addLog(trimmed);
    setLogs(getTodaysLogs());
    setInput("");
    pushToast("SYSTEM: Activity recorded. +1 XP");
  };

  return (
    <HUDLayout>
      {/* ── Input panel ── */}
      <div className="hud-card">
        <h1 className="hud-section-title">Log Activity</h1>

        <form onSubmit={handleSubmit}>
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
            disabled={!input.trim()}
          >
            ▶ Record
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

        {logs.length === 0 ? (
          <p className="log-empty">— No activities logged today —</p>
        ) : (
          <ul className="log-list" aria-label="Today's activity logs">
            {logs.map((log) => (
              <li key={log.id} className="log-item">
                <div className="log-item-meta">{formatTime(log.createdAt)}</div>
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
