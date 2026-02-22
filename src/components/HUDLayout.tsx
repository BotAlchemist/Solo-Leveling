import React from "react";
import "../styles/hud.css";

interface HUDLayoutProps {
  children: React.ReactNode;
  /** Player level number, defaults to 1 */
  level?: number;
  /** Single letter rank, defaults to "E" */
  rank?: string;
}

export default function HUDLayout({
  children,
  level = 1,
  rank = "E",
}: HUDLayoutProps) {
  return (
    <div className="hud-root">
      <header className="hud-header">
        <span className="hud-brand">Solo Leveling</span>

        <div className="hud-player-info">
          <span>Lv.{level}</span>
          <div className="hud-rank-badge" title={`Rank ${rank}`}>
            {rank}
          </div>
        </div>
      </header>

      <main className="hud-content">{children}</main>
    </div>
  );
}
