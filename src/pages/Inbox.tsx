import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost } from "@/lib/api";
import type { ThreadData, InboxResponse, MessageData } from "@/types/messaging";
import {
  MessageCircle, Send, ArrowLeft, Users, MapPin,
  Loader2, Inbox as InboxIcon, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Inbox = () => {
  const { user, isAuthenticated, requireAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [threads, setThreads] = useState<ThreadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check for query params to auto-open a thread
  const openThreadParam = searchParams.get("thread");
  const newDmParam = searchParams.get("dm");
  const tripQueryParam = searchParams.get("trip_query");

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth(() => {});
      return;
    }
    setLoading(true);
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    apiGet<InboxResponse>(`${cfg.api.dm_inbox}`)
      .then((data) => {
        setThreads(data.threads || []);
        // Auto-select thread from params
        if (openThreadParam) {
          setActiveThreadId(parseInt(openThreadParam));
        } else if (data.threads.length > 0 && window.innerWidth >= 768) {
          setActiveThreadId(data.threads[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  // Handle new DM or trip query params
  useEffect(() => {
    if (newDmParam && threads.length > 0) {
      const existing = threads.find(
        (t) => t.type === "dm" && t.participants.some((p) => p.username === newDmParam)
      );
      if (existing) setActiveThreadId(existing.id);
    }
    if (tripQueryParam && threads.length > 0) {
      const existing = threads.find(
        (t) => t.type === "trip_query" && String(t.trip_id) === tripQueryParam
      );
      if (existing) setActiveThreadId(existing.id);
    }
  }, [newDmParam, tripQueryParam, threads]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) || null,
    [threads, activeThreadId]
  );

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages?.length]);

  const handleSend = async () => {
    if (!messageInput.trim() || !activeThread || !user) return;
    setSending(true);
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    const newMsg: MessageData = {
      id: Date.now(),
      thread_id: activeThread.id,
      sender_username: user.username || "dev_user",
      sender_display_name: user.name || "Dev User",
      sender_avatar: user.avatar,
      body: messageInput.trim(),
      sent_at: new Date().toISOString(),
    };

    // Optimistic update
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              messages: [...t.messages, newMsg],
              last_message: newMsg.body,
              last_sent_at: newMsg.sent_at,
            }
          : t
      )
    );
    setMessageInput("");

    try {
      await apiPost(`${cfg.api.dm_inbox}${activeThread.id}/messages/`, {
        body: newMsg.body,
      });
    } catch {
      // Message already shown optimistically
    } finally {
      setSending(false);
    }
  };

  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const q = searchQuery.toLowerCase();
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.last_message?.toLowerCase().includes(q) ||
        t.participants.some((p) => p.display_name.toLowerCase().includes(q))
    );
  }, [threads, searchQuery]);

  const groupedThreads = useMemo(() => {
    const dms = filteredThreads.filter((t) => t.type === "dm");
    const queries = filteredThreads.filter((t) => t.type === "trip_query");
    const groups = filteredThreads.filter((t) => t.type === "group_chat");
    return { dms, queries, groups };
  }, [filteredThreads]);

  const formatTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getThreadAvatar = (thread: ThreadData) => {
    if (thread.type === "group_chat") return undefined;
    const other = thread.participants.find(
      (p) => p.username !== (user?.username || "dev_user")
    );
    return other?.avatar_url;
  };

  const getThreadName = (thread: ThreadData) => {
    if (thread.type === "group_chat") return thread.title;
    if (thread.type === "trip_query") return thread.title;
    const other = thread.participants.find(
      (p) => p.username !== (user?.username || "dev_user")
    );
    return other?.display_name || thread.title;
  };

  const getThreadInitial = (thread: ThreadData) => {
    const name = getThreadName(thread);
    return name?.[0]?.toUpperCase() || "?";
  };

  const typeIcon = (type: ThreadData["type"]) => {
    if (type === "group_chat") return <Users className="h-3 w-3" />;
    if (type === "trip_query") return <MapPin className="h-3 w-3" />;
    return null;
  };

  // ─── Thread List Item ───
  const ThreadItem = ({ thread }: { thread: ThreadData }) => {
    const isActive = activeThreadId === thread.id;
    return (
      <button
        onClick={() => setActiveThreadId(thread.id)}
        className={cn(
          "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors",
          isActive
            ? "bg-primary/10"
            : "hover:bg-muted/60"
        )}
      >
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={getThreadAvatar(thread)} />
          <AvatarFallback className="text-sm bg-accent text-accent-foreground">
            {thread.type === "group_chat" ? (
              <Users className="h-4 w-4" />
            ) : (
              getThreadInitial(thread)
            )}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={cn("truncate text-sm", thread.unread_count > 0 ? "font-semibold text-foreground" : "font-medium text-foreground")}>
              {getThreadName(thread)}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatTime(thread.last_sent_at)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {typeIcon(thread.type) && (
              <span className="text-muted-foreground">{typeIcon(thread.type)}</span>
            )}
            <p className={cn("truncate text-xs", thread.unread_count > 0 ? "text-foreground" : "text-muted-foreground")}>
              {thread.last_message || "No messages yet"}
            </p>
          </div>
        </div>
        {thread.unread_count > 0 && (
          <Badge className="ml-1 mt-1 h-5 min-w-[20px] shrink-0 rounded-full px-1.5 text-[10px]">
            {thread.unread_count}
          </Badge>
        )}
      </button>
    );
  };

  // ─── Thread Section ───
  const ThreadSection = ({ label, threads: sectionThreads }: { label: string; threads: ThreadData[] }) => {
    if (sectionThreads.length === 0) return null;
    return (
      <div className="mb-2">
        <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {sectionThreads.map((t) => (
          <ThreadItem key={t.id} thread={t} />
        ))}
      </div>
    );
  };

  // ─── Sidebar ───
  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-bold text-foreground">Inbox</h2>
        <div className="mt-2 relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-2 px-1">
          <ThreadSection label="Direct Messages" threads={groupedThreads.dms} />
          <ThreadSection label="Trip Queries" threads={groupedThreads.queries} />
          <ThreadSection label="Group Chats" threads={groupedThreads.groups} />
          {filteredThreads.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <InboxIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No matching conversations" : "No conversations yet"}
              </p>
              {!searchQuery && (
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Start a conversation from a profile or trip page
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // ─── Chat Window ───
  const ChatWindow = () => {
    if (!activeThread) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-center p-8">
          <MessageCircle className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-foreground">Select a conversation</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a conversation from the sidebar to start messaging
          </p>
        </div>
      );
    }

    const myUsername = user?.username || "dev_user";

    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <button
            onClick={() => setActiveThreadId(null)}
            className="shrink-0 rounded-md p-1 transition-colors hover:bg-muted md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={getThreadAvatar(activeThread)} />
            <AvatarFallback className="text-sm bg-accent text-accent-foreground">
              {activeThread.type === "group_chat" ? (
                <Users className="h-4 w-4" />
              ) : (
                getThreadInitial(activeThread)
              )}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {getThreadName(activeThread)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {activeThread.type === "group_chat"
                ? `${activeThread.participants.length} participants`
                : activeThread.type === "trip_query"
                ? activeThread.trip_title
                : "Direct Message"}
            </p>
          </div>
          {activeThread.trip_id && (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => navigate(`/trips/${activeThread.trip_id}`)}
            >
              <MapPin className="mr-1 h-3 w-3" /> View Trip
            </Button>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-3">
            {activeThread.messages.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No messages yet. Say hello! 👋
                </p>
              </div>
            )}
            {activeThread.messages.map((msg) => {
              const isMine = msg.sender_username === myUsername;
              return (
                <div
                  key={msg.id}
                  className={cn("flex gap-2", isMine ? "justify-end" : "justify-start")}
                >
                  {!isMine && (
                    <Avatar className="h-7 w-7 shrink-0 mt-1">
                      <AvatarImage src={msg.sender_avatar} />
                      <AvatarFallback className="text-[10px] bg-accent text-accent-foreground">
                        {msg.sender_display_name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3.5 py-2",
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}
                  >
                    {!isMine && activeThread.type === "group_chat" && (
                      <p className="mb-0.5 text-[10px] font-medium opacity-70">
                        {msg.sender_display_name}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                      )}
                    >
                      {formatTime(msg.sent_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t px-4 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button
              type="submit"
              size="icon"
              disabled={!messageInput.trim() || sending}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  // Mobile: show list or chat
  const showChatOnMobile = activeThreadId !== null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
        {/* Desktop: two-column */}
        <div className="hidden w-full md:flex">
          <div className="w-80 shrink-0 border-r bg-card">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-background">
            <ChatWindow />
          </div>
        </div>

        {/* Mobile: stacked */}
        <div className="flex w-full flex-col md:hidden">
          {showChatOnMobile ? (
            <ChatWindow />
          ) : (
            <SidebarContent />
          )}
        </div>
      </main>
    </div>
  );
};

export default Inbox;
