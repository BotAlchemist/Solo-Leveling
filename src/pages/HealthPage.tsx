import { useState, useEffect, useCallback } from "react";
import HUDLayout from "../components/HUDLayout";
import SystemToast from "../components/SystemToast";
import type { ToastMessage } from "../components/SystemToast";
import { apiGet, apiPost, apiDelete, apiPut } from "../lib/api";
import { getProfile } from "../lib/profile";
import "../styles/hud.css";

interface HealthPageProps {
  onBack: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
  onStats?: () => void;
  onHelp?: () => void;
  onQuests?: () => void;
}

interface MealEntry {
  timestamp: string;
  description: string;
  mealType: string;
  hp_points: number | null;
  // Nutrition — populated by LLM after logging
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fibre_g?: number;
  micros?: Record<string, number>;
  items?: Array<{
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fibre_g: number;
  }>;
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export default function HealthPage({ onBack, onLogout, onSettings, onStats, onHelp, onQuests }: HealthPageProps) {
  const [meals, setMeals]         = useState<MealEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [toasts, setToasts]       = useState<ToastMessage[]>([]);

  // Form state
  const [description, setDescription] = useState("");
  const [mealType, setMealType]       = useState(MEAL_TYPES[0]);
  const [submitting, setSubmitting]   = useState(false);

  // Date filter — default to today
  const todayStr = new Date().toISOString().slice(0, 10);
  const [dateFilter, setDateFilter] = useState(todayStr);

  // Edit modal
  const [editTarget, setEditTarget]   = useState<MealEntry | null>(null);
  const [editDesc, setEditDesc]       = useState("");
  const [editType, setEditType]       = useState(MEAL_TYPES[0]);
  const [editSaving, setEditSaving]   = useState(false);

  // Per-row delete loading
  const [deletingTs, setDeletingTs]   = useState<string | null>(null);

  // Targets from profile
  const profile = getProfile();
  const calorieTarget = profile.calorie_target;
  const proteinTarget = profile.protein_target;

  const pushToast = (text: string) => {
    setToasts((prev) => [...prev, { id: crypto.randomUUID(), text }]);
  };

  const expireToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Load meals on date change ────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    apiGet<{ meals: MealEntry[] }>(`/meals?date=${dateFilter}`)
      .then((res) => setMeals(res.meals))
      .catch(() => pushToast("SYSTEM: Failed to load meals."))
      .finally(() => setLoading(false));
  }, [dateFilter]);

  // ── Log meal (auto-analyzed by backend) ─────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const res = await apiPost<MealEntry & { message: string; timestamp: string }>("/meals", {
        description: trimmed,
        mealType,
      });
      const newEntry: MealEntry = {
        timestamp:   res.timestamp,
        description: trimmed,
        mealType,
        hp_points:   null,
        calories:    res.calories,
        protein_g:   res.protein_g,
        carbs_g:     res.carbs_g,
        fat_g:       res.fat_g,
        fibre_g:     res.fibre_g,
        micros:      res.micros,
        items:       res.items,
      };
      if (res.timestamp.startsWith(dateFilter)) {
        setMeals((prev) => [newEntry, ...prev]);
      }
      setDescription("");
      pushToast("SYSTEM: Meal logged with nutrition analysis.");
    } catch {
      pushToast("SYSTEM: Failed to log meal. Check connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete meal ───────────────────────────────────────────────────────
  const handleDelete = async (timestamp: string) => {
    if (deletingTs) return;
    setDeletingTs(timestamp);
    try {
      await apiDelete("/meals", { timestamp });
      setMeals((prev) => prev.filter((m) => m.timestamp !== timestamp));
      pushToast("SYSTEM: Meal deleted.");
    } catch {
      pushToast("SYSTEM: Failed to delete meal.");
    } finally {
      setDeletingTs(null);
    }
  };

  // ── Open edit modal ───────────────────────────────────────────────────
  const openEdit = (meal: MealEntry) => {
    setEditTarget(meal);
    setEditDesc(meal.description);
    setEditType(meal.mealType || MEAL_TYPES[0]);
  };

  // ── Save edit ────────────────────────────────────────────────────────
  const handleEditSave = async () => {
    if (!editTarget || !editDesc.trim() || editSaving) return;
    setEditSaving(true);
    try {
      const res = await apiPut<MealEntry & { message: string }>("/meals", {
        timestamp: editTarget.timestamp,
        description: editDesc.trim(),
        mealType: editType,
      });
      setMeals((prev) => prev.map((m) =>
        m.timestamp === editTarget.timestamp
          ? { ...m, description: editDesc.trim(), mealType: editType,
              calories: res.calories, protein_g: res.protein_g,
              carbs_g: res.carbs_g, fat_g: res.fat_g, fibre_g: res.fibre_g,
              micros: res.micros, items: res.items }
          : m
      ));
      setEditTarget(null);
      pushToast("SYSTEM: Meal updated with fresh nutrition analysis.");
    } catch {
      pushToast("SYSTEM: Failed to update meal.");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Group meals by mealType for display ──────────────────────────────
  const grouped = MEAL_TYPES.reduce<Record<string, MealEntry[]>>((acc, type) => {
    acc[type] = meals.filter((m) => m.mealType === type);
    return acc;
  }, {});
  const ungrouped = meals.filter((m) => !MEAL_TYPES.includes(m.mealType));

  return (
    <HUDLayout
      onLogout={onLogout}
      onSettings={onSettings}
      onStats={onStats}
      onHelp={onHelp}
      onQuests={onQuests}
    >
      <SystemToast messages={toasts} onExpire={expireToast} />

      {/* ── Edit modal ── */}
      {editTarget && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.78)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999, padding: "16px",
        }}>
          <div className="hud-card" style={{ width: "100%", maxWidth: 420 }}>
            <h2 className="hud-section-title" style={{ fontSize: "0.85rem", marginBottom: "16px" }}>✎ EDIT MEAL</h2>

            <div className="hud-field">
              <label className="hud-label">Meal Type</label>
              <div className="category-selector">
                {MEAL_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`category-card${editType === t ? " category-card--active" : ""}`}
                    onClick={() => setEditType(t)}
                  >{t}</button>
                ))}
              </div>
            </div>

            <div className="hud-field">
              <label className="hud-label">Description</label>
              <textarea
                className="hud-textarea"
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                maxLength={500}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                className="hud-btn"
                style={{ flex: 1 }}
                onClick={handleEditSave}
                disabled={editSaving || !editDesc.trim()}
              >{editSaving ? "Saving…" : "✔ Save"}</button>
              <button
                className="hud-btn"
                style={{ flex: 1, opacity: 0.6 }}
                onClick={() => setEditTarget(null)}
              >✕ Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="hud-card">
        <div className="settings-header-row">
          <h1 className="hud-section-title" style={{ marginBottom: 0 }}>
            ♥ HEALTH — HP TRACKER
          </h1>
          <button className="hud-btn hud-btn-sm" onClick={onBack}>
            ← Back
          </button>
        </div>
        <p style={{ color: "var(--clr-text-dim)", marginTop: "0.4rem", fontSize: "0.82rem" }}>
          Log your meals below. Nutrition is analyzed automatically after each entry.
        </p>
      </div>

      {/* ── Daily Overview card ── */}
      <div className="hud-card">

        {/* Top row: title + date picker */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", gap: "0.75rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "var(--font-hud)", fontSize: "0.62rem", letterSpacing: "0.18em", color: "var(--clr-neon)", textTransform: "uppercase", opacity: 0.8 }}>
              Daily Overview
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--clr-text-dim)", marginTop: "2px" }}>
              {dateFilter === todayStr ? "Today" : formatDate(dateFilter + "T12:00:00")}
              {meals.length > 0 && (
                <span style={{ marginLeft: 8, opacity: 0.6 }}>
                  · {meals.length} meal{meals.length !== 1 ? "s" : ""} logged
                </span>
              )}
            </div>
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="hud-input"
            style={{ width: "auto", fontSize: "0.82rem", padding: "6px 10px" }}
          />
        </div>

        {/* State: no meals logged */}
        {meals.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "1.2rem 0", color: "var(--clr-text-dim)", fontSize: "0.82rem", opacity: 0.9 }}>
            No meals logged{dateFilter === todayStr ? " today" : " for this day"} yet.
          </div>
        )}

        {/* Totals derived from per-meal nutrition */}
        {meals.length > 0 && (() => {
          const analyzed = meals.filter((m) => m.calories != null);
          if (analyzed.length === 0) return null;
          const totalCal  = analyzed.reduce((s, m) => s + (m.calories  ?? 0), 0);
          const totalProt = analyzed.reduce((s, m) => s + (m.protein_g ?? 0), 0);
          const totalCarb = analyzed.reduce((s, m) => s + (m.carbs_g   ?? 0), 0);
          const totalFat  = analyzed.reduce((s, m) => s + (m.fat_g     ?? 0), 0);
          const totalFib  = analyzed.reduce((s, m) => s + (m.fibre_g   ?? 0), 0);
          return (
            <div>
              <NutritionBar label="Calories" value={Math.round(totalCal)}  unit="kcal" target={calorieTarget} color="var(--clr-neon)" />
              <NutritionBar label="Protein"  value={+totalProt.toFixed(1)} unit="g"    target={proteinTarget} color="var(--clr-success)" />
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "0.75rem" }}>
                {([
                  { label: "Carbs", val: +totalCarb.toFixed(1), color: "#c792ea" },
                  { label: "Fat",   val: +totalFat.toFixed(1),  color: "#ffcb6b" },
                  { label: "Fibre", val: +totalFib.toFixed(1),  color: "#89ddff" },
                ] as const).map(({ label, val, color }) => (
                  <div key={label} style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px", padding: "6px 12px",
                    fontFamily: "var(--font-hud)", fontSize: "0.7rem",
                    display: "flex", flexDirection: "column", alignItems: "center", minWidth: "60px",
                  }}>
                    <span style={{ color, fontSize: "0.85rem", fontWeight: 700 }}>{val}g</span>
                    <span style={{ opacity: 0.5, fontSize: "0.6rem", marginTop: "1px" }}>{label}</span>
                  </div>
                ))}
              </div>
              {analyzed.length < meals.length && (
                <div style={{ fontSize: "0.72rem", color: "var(--clr-text-dim)", marginTop: "0.6rem", opacity: 0.8 }}>
                  ⧗ Analyzing {meals.length - analyzed.length} meal{meals.length - analyzed.length > 1 ? "s" : ""}…
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Log Meal Form ── */}
      <div className="hud-card">
        <h2 className="hud-section-title" style={{ fontSize: "0.9rem" }}>Log a Meal</h2>
        <form onSubmit={handleSubmit}>

          {/* Meal type selector */}
          <div className="hud-field">
            <label className="hud-label">Meal Type</label>
            <div className="category-selector">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`category-card${mealType === type ? " category-card--active" : ""}`}
                  onClick={() => setMealType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="hud-field">
            <label className="hud-label">What did you eat?</label>
            <textarea
              className="hud-textarea"
              placeholder="e.g. 2 toast with peanut butter and two eggs"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              className="hud-btn"
              disabled={submitting || !description.trim()}
            >
              {submitting ? "Logging…" : "▶ Log Meal"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Meal Log ── */}
      <div className="hud-card">
        <h2 className="hud-section-title" style={{ fontSize: "0.9rem" }}>
          Meals — {dateFilter === todayStr ? "Today" : formatDate(dateFilter + "T00:00:00")}
          <span style={{ fontWeight: 400, opacity: 0.55, marginLeft: "0.5rem" }}>
            ({meals.length} entr{meals.length === 1 ? "y" : "ies"})
          </span>
        </h2>

        {loading && (
          <p style={{ color: "var(--clr-text-dim)", fontSize: "0.85rem" }}>Loading…</p>
        )}

        {!loading && meals.length === 0 && (
          <p style={{ color: "var(--clr-text-dim)", fontSize: "0.85rem" }}>
            No meals logged for this day yet.
          </p>
        )}

        {/* Grouped sections */}
        {MEAL_TYPES.map((type) =>
          grouped[type].length === 0 ? null : (
            <div key={type} style={{ marginBottom: "1.2rem" }}>
              <div style={{
                fontFamily: "var(--font-hud)",
                fontSize: "0.62rem",
                letterSpacing: "0.2em",
                color: "var(--clr-accent)",
                textTransform: "uppercase",
                marginBottom: "0.4rem",
                opacity: 0.85,
              }}>
                {type}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {grouped[type].map((meal) => (
                  <MealRow
                    key={meal.timestamp}
                    meal={meal}
                    deleting={deletingTs === meal.timestamp}
                    onEdit={() => openEdit(meal)}
                    onDelete={() => handleDelete(meal.timestamp)}
                  />
                ))}
              </div>
            </div>
          )
        )}

        {/* Ungrouped (no meal type) */}
        {ungrouped.length > 0 && (
          <div style={{ marginBottom: "1.2rem" }}>
            <div style={{
              fontFamily: "var(--font-hud)",
              fontSize: "0.62rem",
              letterSpacing: "0.2em",
              color: "var(--clr-text-dim)",
              textTransform: "uppercase",
              marginBottom: "0.4rem",
            }}>
              Other
            </div>
            {ungrouped.map((meal) => (
              <MealRow
                key={meal.timestamp}
                meal={meal}
                deleting={deletingTs === meal.timestamp}
                onEdit={() => openEdit(meal)}
                onDelete={() => handleDelete(meal.timestamp)}
              />
            ))}
          </div>
        )}
      </div>
    </HUDLayout>
  );
}

// ── Sub-component: single meal row ────────────────────────────────────
interface MealRowProps {
  meal: MealEntry;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function MealRow({ meal, deleting, onEdit, onDelete }: MealRowProps) {
  return (
    <div className="log-entry" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {/* Top row: description + actions */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="log-text">{meal.description}</span>
          <span style={{ display: "block", fontFamily: "var(--font-hud)", fontSize: "0.65rem", color: "var(--clr-text-dim)", marginTop: "2px" }}>
            {formatTime(meal.timestamp)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <button
            className="hud-btn hud-btn-sm"
            style={{ fontSize: "0.68rem", padding: "4px 8px" }}
            onClick={onEdit}
            title="Edit meal"
          >✎</button>
          <button
            className="hud-btn hud-btn-sm"
            style={{ fontSize: "0.68rem", padding: "4px 8px", color: "#ff6b6b", borderColor: "rgba(255,107,107,0.4)" }}
            onClick={onDelete}
            disabled={deleting}
            title="Delete meal"
          >{deleting ? "…" : "✕"}</button>
        </div>
      </div>

      {/* Nutrition pills — shown once analysis returns */}
      {meal.calories != null ? (
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {([
            { label: "Cal",     val: meal.calories,   unit: "kcal", hi: true  },
            { label: "Protein", val: meal.protein_g,  unit: "g",    hi: false },
            { label: "Carbs",   val: meal.carbs_g,    unit: "g",    hi: false },
            { label: "Fat",     val: meal.fat_g,      unit: "g",    hi: false },
            { label: "Fibre",   val: meal.fibre_g,    unit: "g",    hi: false },
          ] as const).map(({ label, val, unit, hi }) => (
            <div key={label} style={{
              background: hi ? "rgba(0,255,255,0.06)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${hi ? "rgba(0,255,255,0.18)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: "4px", padding: "2px 7px",
              fontFamily: "var(--font-hud)", fontSize: "0.62rem",
            }}>
              <span style={{ opacity: 0.65, marginRight: 3 }}>{label}</span>
              <span style={{ color: hi ? "var(--clr-neon)" : "var(--clr-text)" }}>{val}{unit}</span>
            </div>
          ))}
          {/* Collapsible items breakdown */}
          {meal.items && meal.items.length > 0 && (
            <details style={{ width: "100%", marginTop: "2px" }}>
              <summary style={{ fontFamily: "var(--font-hud)", fontSize: "0.58rem", color: "var(--clr-text-dim)", cursor: "pointer", userSelect: "none", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                ▸ {meal.items.length} item{meal.items.length > 1 ? "s" : ""}
              </summary>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px", paddingLeft: "4px" }}>
                {meal.items.map((item, j) => (
                  <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--clr-text)", opacity: 0.85, flex: 1 }}>{item.name}</span>
                    <span style={{ fontFamily: "var(--font-hud)", fontSize: "0.62rem", color: "var(--clr-neon)", whiteSpace: "nowrap" }}>
                      {item.calories} kcal · {item.protein_g}g P · {item.carbs_g}g C · {item.fat_g}g F
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
          {/* Collapsible micros breakdown */}
          {meal.micros && Object.keys(meal.micros).length > 0 && (
            <details style={{ width: "100%", marginTop: "2px" }}>
              <summary style={{ fontFamily: "var(--font-hud)", fontSize: "0.58rem", color: "var(--clr-text-dim)", cursor: "pointer", userSelect: "none", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                ▸ Micros
              </summary>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px", paddingLeft: "4px" }}>
                {(
                  [
                    { key: "vitamin_a_mcg",   label: "Vit A",   unit: "µg" },
                    { key: "vitamin_c_mg",    label: "Vit C",   unit: "mg" },
                    { key: "vitamin_d_mcg",   label: "Vit D",   unit: "µg" },
                    { key: "vitamin_e_mg",    label: "Vit E",   unit: "mg" },
                    { key: "vitamin_k_mcg",   label: "Vit K",   unit: "µg" },
                    { key: "vitamin_b12_mcg", label: "Vit B12", unit: "µg" },
                    { key: "calcium_mg",      label: "Ca",      unit: "mg" },
                    { key: "iron_mg",         label: "Fe",      unit: "mg" },
                    { key: "sodium_mg",       label: "Na",      unit: "mg" },
                    { key: "potassium_mg",    label: "K",       unit: "mg" },
                    { key: "magnesium_mg",    label: "Mg",      unit: "mg" },
                    { key: "zinc_mg",         label: "Zn",      unit: "mg" },
                    { key: "omega3_g",        label: "Ω-3",     unit: "g"  },
                  ] as { key: string; label: string; unit: string }[]
                )
                  .filter(({ key }) => meal.micros![key] != null)
                  .map(({ key, label, unit }) => (
                    <div key={key} style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "4px", padding: "2px 7px",
                      fontFamily: "var(--font-hud)", fontSize: "0.58rem",
                    }}>
                      <span style={{ opacity: 0.55, marginRight: 3 }}>{label}</span>
                      <span style={{ color: "var(--clr-text-dim)" }}>{meal.micros![key]}{unit}</span>
                    </div>
                  ))}
              </div>
            </details>
          )}
        </div>
      ) : (
        <div style={{ fontFamily: "var(--font-hud)", fontSize: "0.62rem", color: "var(--clr-text-dim)", opacity: 0.7 }}>
          ⧗ Analyzing nutrition…
        </div>
      )}
    </div>
  );
}

// ── NutritionBar sub-component ────────────────────────────────────────
interface NutritionBarProps {
  label: string;
  value: number;
  unit: string;
  target?: number;
  color: string;
}

function NutritionBar({ label, value, unit, target, color }: NutritionBarProps) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : null;
  const over = target ? value > target : false;

  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
        <span style={{ fontFamily: "var(--font-hud)", fontSize: "0.65rem", color: "var(--clr-text-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-hud)", fontSize: "0.68rem", color: over ? "#ff6b6b" : color }}>
          {value}{unit}{target ? ` / ${target}${unit}` : ""}
          {pct !== null && <span style={{ opacity: 0.55, marginLeft: 5 }}>({pct}%)</span>}
        </span>
      </div>
      {pct !== null && (
        <div style={{ height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${pct}%`,
            background: over ? "#ff6b6b" : color,
            borderRadius: "2px",
            transition: "width 0.4s ease",
          }} />
        </div>
      )}
    </div>
  );
}
