import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { listConversations } from "../../api/services.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatChatTime, initialsOf } from "../../lib/chat.js";

/** Inbox: every conversation, most recent first, with unread counts. Refreshes itself. */
export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    listConversations()
      .then((list) => {
        setConversations(list);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError("Couldn't load your messages. We'll keep trying.");
      });
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => document.visibilityState === "visible" && load(), 10000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <Screen title="Messages" showBack={false} withNav navRole={user?.isProvider ? "provider" : "customer"}>
      {error && <div className="mb-3"><ErrorBanner>{error}</ErrorBanner></div>}
      {conversations === null && !error && <Loading label="Loading messages…" />}
      {conversations?.length === 0 && (
        <EmptyState>
          No messages yet. Start a chat from a provider's profile, a quote or a booking.
        </EmptyState>
      )}

      <ul className="space-y-2">
        {conversations?.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => navigate(`/messages/${c.id}`)}
              className="glass-surface flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition-shadow hover:shadow-md"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                {initialsOf(c.otherPartyName)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`truncate text-sm ${c.unreadCount ? "font-extrabold text-ink" : "font-semibold text-gray-800"}`}>
                    {c.otherPartyName}
                    <span className="ml-1.5 text-xs font-normal text-gray-400">
                      {c.otherPartyRole === "PROVIDER" ? "Provider" : "Customer"}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">{formatChatTime(c.lastMessageAt)}</span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className={`truncate text-sm ${c.unreadCount ? "font-semibold text-gray-800" : "text-gray-500"}`}>
                    {c.lastMessagePreview || "No messages yet"}
                  </span>
                  {c.unreadCount > 0 && (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
