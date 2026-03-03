import React, { useState, useEffect, useRef } from "react";
import "../styles/hud.css";

interface HUDLayoutProps {
  children: React.ReactNode;
  level?: number;
  rank?: string;
  onLogout?: () => void;
  onSettings?: () => void;
  onStats?: () => void;
  onHelp?: () => void;
  onQuests?: () => void;
  onHealth?: () => void;
}

export default function HUDLayout({
  children,
  level = 1,
  rank = "E",
  onLogout,
  onSettings,
  onStats,
  onHelp,
  onQuests,
  onHealth,
}: HUDLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const closeAndCall = (fn?: () => void) => {
    setMenuOpen(false);
    fn?.();
  };

  const hasActions = onStats || onSettings || onLogout || onHelp || onQuests || onHealth;

  return (
    <div className="hud-root">
      <header className="hud-header">
        <span className="hud-brand">Solo Leveling</span>

        <div className="hud-player-info">
          <span>Lv.{level}</span>
          <div className="hud-rank-badge" title={`Rank ${rank}`}>{rank}</div>

          {/* Desktop buttons — hidden on mobile via CSS */}
          <div className="hud-nav-desktop">
            {onHealth && (
              <button className="hud-btn hud-btn-sm" onClick={onHealth} title="Health">
                ♥ HEALTH
              </button>
            )}
            {onQuests && (
              <button className="hud-btn hud-btn-sm" onClick={onQuests} title="Quests">
                ☆ QUESTS
              </button>
            )}
            {onStats && (
              <button className="hud-btn hud-btn-sm" onClick={onStats} title="Stats">
                ◈ STATS
              </button>
            )}
            {onHelp && (
              <button className="hud-btn hud-btn-sm" onClick={onHelp} title="Help">
                ? HELP
              </button>
            )}
            {onSettings && (
              <button className="hud-btn hud-btn-sm" onClick={onSettings} title="Settings">
                ⚙ SETTINGS
              </button>
            )}
            {onLogout && (
              <button className="hud-btn hud-btn-logout" onClick={onLogout} title="Sign out">
                ⏏ LOGOUT
              </button>
            )}
          </div>

          {/* Burger menu — shown only on mobile */}
          {hasActions && (
            <div className="hud-burger-wrap" ref={menuRef}>
              <button
                className={`hud-burger${menuOpen ? " hud-burger--open" : ""}`}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
              >
                <span /><span /><span />
              </button>

              {menuOpen && (
                <div className="hud-dropdown">
                  {onHealth && (
                    <button className="hud-dropdown-item" onClick={() => closeAndCall(onHealth)}>
                      ♥ HEALTH
                    </button>
                  )}
                  {onQuests && (
                    <button className="hud-dropdown-item" onClick={() => closeAndCall(onQuests)}>
                      ☆ QUESTS
                    </button>
                  )}
                  {onStats && (
                    <button className="hud-dropdown-item" onClick={() => closeAndCall(onStats)}>
                      ◈ STATS
                    </button>
                  )}
                  {onHelp && (
                    <button className="hud-dropdown-item" onClick={() => closeAndCall(onHelp)}>
                      ? HELP
                    </button>
                  )}
                  {onSettings && (
                    <button className="hud-dropdown-item" onClick={() => closeAndCall(onSettings)}>
                      ⚙ SETTINGS
                    </button>
                  )}
                  {onLogout && (
                    <button className="hud-dropdown-item hud-dropdown-item--danger" onClick={() => closeAndCall(onLogout)}>
                      ⏏ LOGOUT
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="hud-content">{children}</main>
    </div>
  );
}
