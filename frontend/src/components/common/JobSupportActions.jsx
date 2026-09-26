import { useState } from "react";

/**
 * "Chat with …" and "Report an issue" for a quote or booking.
 *
 * Chat isn't built yet, so it opens a "coming soon" note. Report an issue collects a message and
 * confirms it was received; it isn't sent anywhere yet either.
 */
export default function JobSupportActions({ otherPartyName = "the provider", compact = false }) {
  const [panel, setPanel] = useState(null); // null | "chat" | "report"
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState(null);

  const toggle = (name) => {
    setPanel((current) => (current === name ? null : name));
    if (name === "report") {
      setMessage("");
      setReference(null);
    }
  };

  const submitReport = (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    setReference(`UL-${Math.floor(100000 + Math.random() * 900000)}`);
    setMessage("");
  };

  const buttonClass = `flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${compact ? "py-2 text-xs" : ""}`;

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => toggle("chat")}
          aria-expanded={panel === "chat"}
          className={`${buttonClass} ${panel === "chat" ? "border-brand bg-brand/5 text-brand" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
        >
          Chat with {otherPartyName}
          <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">Soon</span>
        </button>
        <button
          type="button"
          onClick={() => toggle("report")}
          aria-expanded={panel === "report"}
          className={`${buttonClass} ${panel === "report" ? "border-red-300 bg-red-50 text-red-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
        >
          Report an issue
        </button>
      </div>

      {panel === "chat" && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
          <p className="font-semibold">Chat is coming soon</p>
          <p className="mt-0.5 text-xs">
            You'll be able to message {otherPartyName} right here. Until then, use the notes on the work tracker.
          </p>
        </div>
      )}

      {panel === "report" && (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
          {reference ? (
            <div role="status">
              <p className="font-semibold text-emerald-700">✓ Report received</p>
              <p className="mt-1 text-sm text-gray-600">
                Our team has been notified and will look into it. Your reference is <span className="font-bold">{reference}</span>.
              </p>
              <button type="button" onClick={() => setPanel(null)} className="mt-3 text-sm font-semibold text-brand hover:underline">
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={submitReport}>
              <label htmlFor="issue-message" className="text-sm font-semibold text-gray-900">
                What went wrong?
              </label>
              <textarea
                id="issue-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Describe the problem, e.g. the provider didn't arrive, or the price changed."
                className="mt-2 w-full resize-y rounded-xl border border-gray-200 p-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  Send report
                </button>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
