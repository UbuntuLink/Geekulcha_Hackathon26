import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { openChatWithCustomer, openChatWithProvider } from "../../api/services.js";

/**
 * "Chat with …" and "Report an issue" for a quote, booking or provider profile.
 *
 * Chat opens the one conversation between these two people (creating it the first time): pass
 * providerProfileId when the viewer is the customer, customerUserId when they're the provider.
 * Report an issue collects a message and confirms it; it isn't sent anywhere yet.
 */
export default function JobSupportActions({
  otherPartyName = "the provider",
  providerProfileId,
  customerUserId,
  compact = false,
}) {
  const navigate = useNavigate();
  const [panel, setPanel] = useState(null); // null | "report"
  const [opening, setOpening] = useState(false);
  const [chatError, setChatError] = useState("");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState(null);

  const openChat = async () => {
    setOpening(true);
    setChatError("");
    try {
      const conversation =
        providerProfileId != null
          ? await openChatWithProvider(providerProfileId)
          : await openChatWithCustomer(customerUserId);
      navigate(`/messages/${conversation.id}`, { state: { conversation } });
    } catch (err) {
      console.error(err);
      setChatError(err?.response?.data?.message || "Couldn't open the chat. Please try again.");
    } finally {
      setOpening(false);
    }
  };

  const canChat = providerProfileId != null || customerUserId != null;

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
        {canChat && (
          <button
            type="button"
            onClick={openChat}
            disabled={opening}
            className={`${buttonClass} border-brand/30 text-brand hover:bg-brand/5 disabled:opacity-60`}
          >
            {opening ? "Opening…" : `Chat with ${otherPartyName}`}
          </button>
        )}
        <button
          type="button"
          onClick={() => toggle("report")}
          aria-expanded={panel === "report"}
          className={`${buttonClass} ${panel === "report" ? "border-red-300 bg-red-50 text-red-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
        >
          Report an issue
        </button>
      </div>

      {chatError && <p role="alert" className="mt-2 text-xs text-red-600">{chatError}</p>}

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
