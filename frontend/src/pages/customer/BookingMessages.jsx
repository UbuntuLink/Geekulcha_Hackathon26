import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import Loading from "../../components/common/Loading.jsx";
import { getBooking, getBookingMessages, sendBookingMessage } from "../../api/services.js";
import { useAuth } from "../../context/AuthContext.jsx";

function displayName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Your service contact";
}

export default function BookingMessages() {
  const { bookingId } = useParams();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const providerView = pathname.startsWith("/provider/");

  const loadMessages = useCallback(async (initial = false) => {
    try {
      const latest = await getBookingMessages(bookingId);
      setMessages((current) => {
        if (current && JSON.stringify(current) === JSON.stringify(latest)) return current;
        return latest;
      });
      setError("");
    } catch (err) {
      if (initial) setError(err.response?.data?.message || "Couldn't open this conversation.");
    }
  }, [bookingId]);

  useEffect(() => {
    let active = true;
    getBooking(bookingId)
      .then((result) => { if (active) setBooking(result); })
      .catch((err) => { if (active) setError(err.response?.data?.message || "Couldn't open this booking."); });
    getBookingMessages(bookingId)
      .then((result) => { if (active) setMessages(result); })
      .catch((err) => { if (active) setError(err.response?.data?.message || "Couldn't open this conversation."); });

    const interval = window.setInterval(() => loadMessages(false), 2500);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [bookingId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages?.length]);

  const customer = booking?.quote?.serviceRequest?.user;
  const provider = booking?.quote?.providerProfile?.user;
  const contact = providerView ? customer : provider;

  const submit = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setError("");
    try {
      const sent = await sendBookingMessage(bookingId, content);
      setMessages((current) => [...(current ?? []), sent]);
      setDraft("");
    } catch (err) {
      setError(err.response?.data?.message || "Message not sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen title={contact ? displayName(contact) : "Messages"} subtitle={booking?.quote?.serviceRequest?.description}
      withNav navRole={providerView ? "provider" : "customer"}>
      <section className="flex min-h-[68vh] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
            {displayName(contact).split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{displayName(contact)}</p>
            <p className="text-xs text-gray-500">{booking?.status?.replaceAll("_", " ") || "Booking conversation"}</p>
          </div>
          <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" aria-label="Conversation available" />
        </div>

        {error && <div className="px-4 pt-3"><ErrorBanner>{error}</ErrorBanner></div>}

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gray-50/70 px-4 py-5" aria-live="polite">
          {messages === null ? <Loading /> : messages.length === 0 ? (
            <div className="m-auto max-w-xs text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand shadow-sm" aria-hidden="true">•••</div>
              <p className="text-sm font-semibold text-gray-800">Start the conversation</p>
              <p className="mt-1 text-sm text-gray-500">Coordinate arrival time, access, or any details for this service.</p>
            </div>
          ) : messages.map((message) => {
            const mine = Number(message.senderId) === Number(user?.id);
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:max-w-[72%] ${mine ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"}`}>
                  <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.content}</p>
                  <time className={`mt-1 block text-right text-[10px] ${mine ? "text-white/75" : "text-gray-400"}`} dateTime={message.createdAt}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </time>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={submit} className="flex items-end gap-2 border-t border-gray-100 bg-white p-3">
          <label className="sr-only" htmlFor="booking-message">Message</label>
          <textarea id="booking-message" value={draft} onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form.requestSubmit(); } }}
            maxLength={2000} rows={1} placeholder="Write a message..."
            className="max-h-32 min-h-11 flex-1 resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15" />
          <button type="submit" disabled={!draft.trim() || sending || messages === null}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="Send message" title="Send message">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </form>
      </section>
    </Screen>
  );
}