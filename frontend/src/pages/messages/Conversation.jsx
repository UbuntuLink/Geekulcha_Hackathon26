import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { getMessages, listConversations, sendMessage } from "../../api/services.js";
import { formatChatTime } from "../../lib/chat.js";

// An open chat checks for new messages this often.
const POLL_MS = 4000;
const MAX_LENGTH = 2000;

/**
 * One conversation. Loads the thread once, then polls for messages newer than the last one it
 * has, so both people see each other's messages within a few seconds. Opening it marks it read.
 */
export default function Conversation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [messages, setMessages] = useState(null);
  const [other, setOther] = useState(state?.conversation ?? null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const lastId = useRef(0);
  const bottomRef = useRef(null);

  const append = (incoming) => {
    if (!incoming.length) return;
    lastId.current = Math.max(lastId.current, ...incoming.map((m) => m.id));
    setMessages((current) => {
      const known = new Set((current ?? []).map((m) => m.id));
      return [...(current ?? []), ...incoming.filter((m) => !known.has(m.id))];
    });
  };

  const poll = useCallback(async () => {
    try {
      const fresh = await getMessages(id, lastId.current);
      setMessages((current) => current ?? []);
      append(fresh);
      setError("");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.status === 403
          ? "You're not part of this conversation."
          : err?.response?.status === 404
            ? "This conversation doesn't exist."
            : "Connection lost. Retrying…"
      );
    }
  }, [id]);

  useEffect(() => {
    lastId.current = 0;
    setMessages(null);
    poll();
    // The header needs the other person's name; fetch it if we didn't arrive with it.
    if (!state?.conversation) {
      listConversations()
        .then((list) => setOther(list.find((c) => String(c.id) === String(id)) ?? null))
        .catch(() => {});
    }
    const timer = setInterval(() => document.visibilityState === "visible" && poll(), POLL_MS);
    return () => clearInterval(timer);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const handleSend = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    try {
      const sent = await sendMessage(id, text);
      append([sent]);
      setDraft("");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Couldn't send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen
      title={other?.otherPartyName ?? "Messages"}
      subtitle={other ? (other.otherPartyRole === "PROVIDER" ? "Service provider" : "Customer") : undefined}
      onBack={() => navigate("/messages")}
    >
      {other?.otherPartyRole === "PROVIDER" && (
        <button
          type="button"
          onClick={() => navigate(`/providers/${other.providerProfileId}`)}
          className="-mt-2 mb-3 text-xs font-semibold text-brand hover:underline"
        >
          View profile →
        </button>
      )}

      <div className="glass-surface flex h-[60vh] min-h-[360px] flex-col rounded-2xl">
        <div className="flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
          {messages === null && <Loading />}
          {messages?.length === 0 && (
            <p className="mt-10 text-center text-sm text-gray-400">No messages yet. Say hello 👋</p>
          )}
          {messages?.map((m) =>
            m.kind === "SYSTEM" ? (
              <div key={m.id} className="mx-auto max-w-[90%] rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
                {m.body}
                <span className="ml-1.5 text-amber-600/70">{formatChatTime(m.createdAt)}</span>
              </div>
            ) : (
              <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-6 ${
                    m.mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-white text-gray-800 shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-line break-words">{m.body}</p>
                  <p className={`mt-0.5 text-right text-[10px] ${m.mine ? "text-white/70" : "text-gray-400"}`}>
                    {formatChatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            )
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-gray-100 p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleSend(e);
            }}
            maxLength={MAX_LENGTH}
            rows={1}
            placeholder="Write a message…"
            aria-label="Message"
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="h-11 shrink-0 rounded-xl bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {sending ? "…" : "Send"}
          </button>
        </form>
      </div>

      {error && <div className="mt-3"><ErrorBanner>{error}</ErrorBanner></div>}
    </Screen>
  );
}
