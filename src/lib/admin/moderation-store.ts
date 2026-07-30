import fs from "node:fs";
import path from "node:path";
import {
  moderationStoreSchema,
  type ModerationStore,
} from "./moderation-types";

export type { ModerationStore } from "./moderation-types";

function storePath() {
  return path.join(process.cwd(), "data", "moderation.json");
}

export function readModerationStore(): ModerationStore {
  const file = storePath();
  if (!fs.existsSync(file)) {
    return { warnings: [], notes: [], purges: [] };
  }
  try {
    return moderationStoreSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch {
    return { warnings: [], notes: [], purges: [] };
  }
}

export function writeModerationStore(data: ModerationStore) {
  const parsed = moderationStoreSchema.parse(data);
  const file = storePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, file);
  return parsed;
}

function nid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function addWarning(input: {
  userId: string;
  username?: string;
  reason: string;
  by: string;
  byLabel: string;
}) {
  const store = readModerationStore();
  const row = {
    id: nid("warn"),
    at: new Date().toISOString(),
    ...input,
  };
  store.warnings.unshift(row);
  writeModerationStore(store);
  return row;
}

export function queuePurge(input: {
  userId: string;
  username?: string;
  scope: "messages" | "threads" | "all";
  by: string;
  byLabel: string;
  note?: string;
}) {
  const store = readModerationStore();
  const row = {
    id: nid("purge"),
    at: new Date().toISOString(),
    status: "queued" as const,
    ...input,
  };
  store.purges.unshift(row);
  writeModerationStore(store);
  return row;
}
