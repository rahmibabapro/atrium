import fs from "node:fs";
import path from "node:path";

export type AuditEvent = {
  id: string;
  at: string;
  actorId: string;
  actorLabel: string;
  action: string;
  target?: string;
  meta?: Record<string, unknown>;
  ip?: string;
};

const auditPath = () =>
  path.join(process.cwd(), "data", "admin-audit.jsonl");

/** Append-only audit log (file). Never truncates from the UI. */
export function appendAudit(event: Omit<AuditEvent, "id" | "at"> & { at?: string }) {
  const full: AuditEvent = {
    id: `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    at: event.at || new Date().toISOString(),
    actorId: event.actorId,
    actorLabel: event.actorLabel,
    action: event.action,
    target: event.target,
    meta: event.meta,
    ip: event.ip,
  };
  const file = auditPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${JSON.stringify(full)}\n`, "utf8");
  return full;
}

export function readAudit(limit = 100): AuditEvent[] {
  const file = auditPath();
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean);
  return lines
    .slice(-limit)
    .map((line) => {
      try {
        return JSON.parse(line) as AuditEvent;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse() as AuditEvent[];
}
