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

export interface ThreadData {
  id: number;
  type: ThreadType;
  title: string;
  trip_id?: number;
  trip_title?: string;
  participants: {
    username: string;
    display_name: string;
    avatar_url?: string;
  }[];
  last_message?: string;
  last_sent_at?: string;
  unread_count: number;
  messages: MessageData[];
  readonly?: boolean;
  readonly_reason?: "blocked_by_you" | "blocked_you" | "deactivated" | "suspended";
}

export interface InboxResponse {
  threads: ThreadData[];
}
