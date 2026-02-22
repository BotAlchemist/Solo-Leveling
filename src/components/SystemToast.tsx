import { useEffect, useState } from "react";
import "../styles/hud.css";

export interface ToastMessage {
  id: string;
  text: string;
}

interface SystemToastProps {
  messages: ToastMessage[];
  onExpire: (id: string) => void;
  /** Duration in ms before a toast is removed. Default 2500 */
  duration?: number;
}

export default function SystemToast({
  messages,
  onExpire,
  duration = 2500,
}: SystemToastProps) {
  const [visible, setVisible] = useState<Set<string>>(new Set());

  useEffect(() => {
    messages.forEach((msg) => {
      if (!visible.has(msg.id)) {
        setVisible((prev) => new Set(prev).add(msg.id));
        const timer = setTimeout(() => {
          onExpire(msg.id);
          setVisible((prev) => {
            const next = new Set(prev);
            next.delete(msg.id);
            return next;
          });
        }, duration);
        return () => clearTimeout(timer);
      }
    });
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  if (messages.length === 0) return null;

  return (
    <div className="system-toast-wrapper" aria-live="polite">
      {messages.map((msg) => (
        <div key={msg.id} className="system-toast" role="status">
          {msg.text}
        </div>
      ))}
    </div>
  );
}
