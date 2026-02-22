import { useState, useEffect, type FormEvent, type KeyboardEvent } from "react";
import HUDLayout from "../components/HUDLayout";
import { getProfile, saveProfile, type UserProfile } from "../lib/profile";
import { apiGet, apiPost } from "../lib/api";
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

              <div className="hud-field">
                <label className="hud-label" htmlFor="s-age">Age</label>
                <input
                  id="s-age"
                  type="number"
                  className="hud-input hud-input-narrow"
                  placeholder="e.g. 25"
                  min={1}
                  max={120}
                  value={profile.age}
                  onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))}
                />
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
    </HUDLayout>
  );
}
