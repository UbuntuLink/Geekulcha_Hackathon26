export function initialsOf(name) {
  return (name || "?").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

/** "14:05" today, "Mon" this week, "12 Sep" otherwise. */
export function formatChatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  }
  if (now - date < 6 * 24 * 3600 * 1000) return date.toLocaleDateString("en-ZA", { weekday: "short" });
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}
