import { useEffect, useRef } from "react";
import "../styles/hud.css";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "CONFIRM",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on open, close on Escape
  useEffect(() => {
    cancelRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="dialog-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="dialog-panel" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <span className="dialog-icon">⚠</span>
          <h2 className="dialog-title" id="dialog-title">{title}</h2>
        </div>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button
            ref={cancelRef}
            className="hud-btn hud-btn-sm dialog-cancel"
            onClick={onCancel}
          >
            ✕ CANCEL
          </button>
          <button
            className="hud-btn hud-btn-danger dialog-confirm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
