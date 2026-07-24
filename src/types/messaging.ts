// ─── Messaging Types ──────────────────────────────────────────────────────

export type ThreadType = "dm" | "trip_query" | "group_chat";

export interface MessageData {
  id: number;
  thread_id: number;
  sender_username: string;
  sender_display_name: string;
  sender_avatar?: string;
  body: string;
  sent_at: string;
}

export interface ThreadParticipant {
  username: string;
  display_name: string;
  avatar_url?: string;
}

/** Lightweight inbox summary — no message bodies. */
export interface ThreadSummary {
  id: number;
  type: ThreadType;
  title: string;
  trip_id?: number;
  trip_title?: string;
  participants: ThreadParticipant[];
  last_message?: string;
  last_sent_at?: string;
  unread_count: number;
  readonly?: boolean;
  readonly_reason?: "blocked_by_you" | "blocked_you" | "deactivated" | "suspended";
}

/** Full thread including cached messages (used for optimistic newly created threads). */
export interface ThreadData extends ThreadSummary {
  messages: MessageData[];
}

export interface InboxResponse {
  threads: ThreadSummary[];
}

export interface ThreadMessagesResponse {
  messages: MessageData[];
  has_more: boolean;
}
