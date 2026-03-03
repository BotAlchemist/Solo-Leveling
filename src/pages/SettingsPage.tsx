import { useState, useEffect, type FormEvent, type KeyboardEvent } from "react";
import HUDLayout from "../components/HUDLayout";
import ConfirmDialog from "../components/ConfirmDialog";
import { getProfile, saveProfile, type UserProfile } from "../lib/profile";
import { apiGet, apiPost, apiDelete } from "../lib/api";
import "../styles/hud.css";

interface SettingsPageProps {
  onBack: () => void;
  onLogout?: () => void;
}

export default function SettingsPage({ onBack, onLogout }: SettingsPageProps) {
  const [profile, setProfile] = useState<UserProfile>(getProfile);
  const [categoryInput, setCategoryInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dangerStatus, setDangerStatus] = useState<{ logs?: string; xp?: string }>({});
  const [deleting, setDeleting] = useState<{ logs?: boolean; xp?: boolean }>({});
  const [confirm, setConfirm] = useState<null | { type: 'logs' | 'xp' }>(null);

  // ── Load profile from API on mount ────────────────────────────────────
  useEffect(() => {
    apiGet<UserProfile>("/settings")
      .then((data) => {
        setProfile(data);
        saveProfile(data); // keep localStorage in sync as cache
      })
      .catch((err: Error) => {
        // 404 = first time user, stay with empty/localStorage defaults
        if (!err.message.includes("404")) {
          setError(`SYSTEM: Failed to load profile — ${err.message}`);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Category helpers ──────────────────────────────────────────────────
  const addCategory = () => {
    const val = categoryInput.trim();
    if (!val) return;
    if (profile.categories.map((c) => c.toLowerCase()).includes(val.toLowerCase())) {
      setCategoryInput("");
      return;
    }
    setProfile((p) => ({ ...p, categories: [...p.categories, val] }));
    setCategoryInput("");
  };

  const removeCategory = (index: number) => {
    setProfile((p) => ({
      ...p,
      categories: p.categories.filter((_, i) => i !== index),
    }));
  };

  const handleCategoryKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addCategory(); }
  };

  // ── Danger zone actions ───────────────────────────────────────────────
  const handleDeleteLogs = async () => {
    setDeleting((d) => ({ ...d, logs: true }));
    setConfirm(null);
    try {
      const res = await apiDelete<{ message: string }>("/logs");
      setDangerStatus((s) => ({ ...s, logs: `✓ ${res.message}` }));
    } catch (err: unknown) {
      setDangerStatus((s) => ({ ...s, logs: `Error: ${err instanceof Error ? err.message : "Failed"}` }));
    } finally {
      setDeleting((d) => ({ ...d, logs: false }));
    }
  };

  const handleResetXP = async () => {
    setDeleting((d) => ({ ...d, xp: true }));
    setConfirm(null);
    try {
      const res = await apiDelete<{ message: string }>("/status");
      setDangerStatus((s) => ({ ...s, xp: `✓ ${res.message}` }));
    } catch (err: unknown) {
      setDangerStatus((s) => ({ ...s, xp: `Error: ${err instanceof Error ? err.message : "Failed"}` }));
    } finally {
      setDeleting((d) => ({ ...d, xp: false }));
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiPost("/settings", profile);
      saveProfile(profile); // update localStorage cache
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed.";
      setError(`SYSTEM: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <HUDLayout onLogout={onLogout}>
      {confirm && (
        <ConfirmDialog
          title={confirm.type === 'logs' ? 'Delete Activity Logs' : 'Reset XP'}
          message={
            confirm.type === 'logs'
              ? 'All your activity logs will be permanently deleted from the database. This cannot be undone.'
              : 'All your XP points across every category will be permanently reset to zero. This cannot be undone.'
          }
          confirmLabel={confirm.type === 'logs' ? '⚠ DELETE LOGS' : '⚠ RESET XP'}
          onConfirm={confirm.type === 'logs' ? handleDeleteLogs : handleResetXP}
          onCancel={() => setConfirm(null)}
        />
      )}
      <div className="hud-card">
        {/* Header row */}
        <div className="settings-header-row">
          <h1 className="hud-section-title" style={{ marginBottom: 0 }}>Settings</h1>
          <button className="hud-btn hud-btn-sm" onClick={onBack}>← Back</button>
        </div>

        {loading ? (
          <p className="log-empty">SYSTEM: Loading profile…</p>
        ) : (
          <form onSubmit={handleSave} noValidate>
            {/* ── Player info ── */}
            <div className="settings-group">
              <h2 className="settings-group-title">Player Info</h2>

              <div className="hud-field">
                <label className="hud-label" htmlFor="s-name">Name</label>
                <input
                  id="s-name"
                  type="text"
                  className="hud-input"
                  placeholder="Your name"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div className="hud-field" style={{ flex: 1 }}>
                  <label className="hud-label" htmlFor="s-cal">
                    Daily Calorie Target
                    <span style={{ opacity: 0.5, fontWeight: 400, marginLeft: 6 }}>kcal</span>
                  </label>
                  <input
                    id="s-cal"
                    type="number"
                    min={0}
                    className="hud-input"
                    placeholder="e.g. 2000"
                    value={profile.calorie_target ?? ""}
                    onChange={(e) => setProfile((p) => ({ ...p, calorie_target: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
                <div className="hud-field" style={{ flex: 1 }}>
                  <label className="hud-label" htmlFor="s-prot">
                    Daily Protein Target
                    <span style={{ opacity: 0.5, fontWeight: 400, marginLeft: 6 }}>g</span>
                  </label>
                  <input
                    id="s-prot"
                    type="number"
                    min={0}
                    className="hud-input"
                    placeholder="e.g. 150"
                    value={profile.protein_target ?? ""}
                    onChange={(e) => setProfile((p) => ({ ...p, protein_target: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
              </div>

            </div>

            {/* ── Categories ── */}
            <div className="settings-group">
              <h2 className="settings-group-title">Skill Categories</h2>
              <p className="settings-group-hint">
                Categories you want to track (e.g. Fitness, Coding, Reading).
              </p>

              {profile.categories.length > 0 && (
                <div className="category-chips">
                  {profile.categories.map((cat, i) => (
                    <span key={i} className="category-chip">
                      {cat}
                      <button
                        type="button"
                        className="category-chip-remove"
                        onClick={() => removeCategory(i)}
                        aria-label={`Remove ${cat}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="category-add-row">
                <input
                  type="text"
                  className="hud-input"
                  placeholder="Add a category…"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyDown={handleCategoryKey}
                  aria-label="New category name"
                />
                <button
                  type="button"
                  className="hud-btn hud-btn-add"
                  onClick={addCategory}
                  disabled={!categoryInput.trim()}
                  aria-label="Add category"
                >
                  +
                </button>
              </div>
            </div>

            {error && <p className="hud-login-error" role="alert">{error}</p>}

            <div className="settings-save-row">
              <button type="submit" className="hud-btn hud-btn-block" disabled={saving}>
                {saving ? "SAVING…" : saved ? "✓ SAVED" : "▶ SAVE CHANGES"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Danger Zone card ── */}
      <div className="hud-card danger-zone-card">
        <h2 className="hud-section-title danger-zone-title">⚠ Danger Zone</h2>
        <p className="settings-group-hint" style={{ marginBottom: 20 }}>
          These actions are permanent and cannot be undone.
        </p>

        <div className="danger-zone-row">
          <div className="danger-zone-info">
            <span className="danger-zone-label">Delete Activity Logs</span>
            <span className="danger-zone-desc">Removes all your logged activities from the database</span>
          </div>
          <button
            className="hud-btn hud-btn-danger"
            onClick={() => setConfirm({ type: 'logs' })}
            disabled={!!deleting.logs}
          >
            {deleting.logs ? "DELETING…" : "DELETE LOGS"}
          </button>
        </div>
        {dangerStatus.logs && (
          <p className={`danger-zone-feedback${dangerStatus.logs.startsWith("✓") ? " danger-zone-feedback--ok" : ""}`}>
            {dangerStatus.logs}
          </p>
        )}

        <div className="danger-zone-row" style={{ marginTop: 16 }}>
          <div className="danger-zone-info">
            <span className="danger-zone-label">Reset XP</span>
            <span className="danger-zone-desc">Clears all your XP points across every category</span>
          </div>
          <button
            className="hud-btn hud-btn-danger"
            onClick={() => setConfirm({ type: 'xp' })}
            disabled={!!deleting.xp}
          >
            {deleting.xp ? "RESETTING…" : "RESET XP"}
          </button>
        </div>
        {dangerStatus.xp && (
          <p className={`danger-zone-feedback${dangerStatus.xp.startsWith("✓") ? " danger-zone-feedback--ok" : ""}`}>
            {dangerStatus.xp}
          </p>
        )}
      </div>
    </HUDLayout>
  );
}
