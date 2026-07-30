/**
 * Kysely database contract. One schema, two drivers:
 * better-sqlite3 (zero-config default) and Postgres (production).
 *
 * Portability rules:
 * - ids are text (uuid), timestamps are ISO-8601 text (lexicographically sortable)
 * - flags/counters are integers; JSON payloads are serialized text
 */

export interface SiteConfigTable {
  id: number;
  overrides: string;
  updated_at: string;
}

export interface AuditLogTable {
  id: string;
  at: string;
  actor_id: string;
  actor_label: string;
  action: string;
  target: string | null;
  meta: string | null;
  ip: string | null;
}

export interface ModerationWarningTable {
  id: string;
  at: string;
  user_id: string;
  username: string | null;
  reason: string;
  by_id: string;
  by_label: string;
}

export interface ModerationNoteTable {
  id: string;
  at: string;
  user_id: string;
  body: string;
  by_id: string;
  by_label: string;
}

export interface ModerationPurgeTable {
  id: string;
  at: string;
  user_id: string;
  username: string | null;
  scope: string;
  status: string;
  note: string | null;
  by_id: string;
  by_label: string;
  processed_at: string | null;
}

export interface AnalyticsPageTable {
  path: string;
  views: number;
  dwell_ms: number;
  clicks: number;
}

export interface AnalyticsSessionTable {
  id: string;
  first_at: string;
  last_at: string;
  dwell_ms: number;
  pageviews: number;
  user_id: string | null;
  user_label: string | null;
  paths: string;
}

export interface AnalyticsClickTable {
  id: string;
  at: string;
  path: string;
  target: string;
  session_id: string;
  user_id: string | null;
}

export interface AnalyticsTotalsTable {
  id: number;
  pageviews: number;
  sessions: number;
  dwell_ms: number;
  clicks: number;
  updated_at: string | null;
}

export interface ForumCategoryTable {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  position: number;
  locked: number;
}

export interface ForumThreadTable {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  author_id: string;
  author_label: string;
  created_at: string;
  updated_at: string;
  last_post_at: string;
  reply_count: number;
  pinned: number;
  locked: number;
  hidden: number;
}

export interface ForumPostTable {
  id: string;
  thread_id: string;
  author_id: string;
  author_label: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  hidden: number;
  hidden_by: string | null;
  hidden_reason: string | null;
}

export interface ForumReactionTable {
  id: string;
  post_id: string;
  user_id: string;
  emoji: string;
  at: string;
}

export interface ForumReportTable {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  status: string;
  at: string;
  resolved_by: string | null;
  resolved_at: string | null;
}

export interface NotificationTable {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  actor_label: string | null;
  read: number;
  at: string;
}

export interface UserStatsTable {
  user_id: string;
  first_seen_at: string;
  post_count: number;
  thread_count: number;
  reactions_received: number;
}

export interface Database {
  site_config: SiteConfigTable;
  audit_log: AuditLogTable;
  moderation_warnings: ModerationWarningTable;
  moderation_notes: ModerationNoteTable;
  moderation_purges: ModerationPurgeTable;
  analytics_pages: AnalyticsPageTable;
  analytics_sessions: AnalyticsSessionTable;
  analytics_clicks: AnalyticsClickTable;
  analytics_totals: AnalyticsTotalsTable;
  forum_categories: ForumCategoryTable;
  forum_threads: ForumThreadTable;
  forum_posts: ForumPostTable;
  forum_reactions: ForumReactionTable;
  forum_reports: ForumReportTable;
  notifications: NotificationTable;
  user_stats: UserStatsTable;
}
