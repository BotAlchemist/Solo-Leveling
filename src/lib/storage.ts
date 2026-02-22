export interface LogItem {
  id: string;
  text: string;
  createdAt: string; // ISO string
}

const STORAGE_KEY = "sololeveling_logs";

export function getLogs(): LogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LogItem[]) : [];
  } catch {
    return [];
  }
}

export function addLog(text: string): LogItem {
  const item: LogItem = {
    id: crypto.randomUUID(),
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
  const logs = getLogs();
  logs.push(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  return item;
}

export function getTodaysLogs(): LogItem[] {
  const today = new Date().toDateString();
  return getLogs()
    .filter((l) => new Date(l.createdAt).toDateString() === today)
    .reverse(); // latest first
}
