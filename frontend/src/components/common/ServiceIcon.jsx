const paths = {
  plumbing: <><path d="M8 3h8M12 3v5M5 8h12a3 3 0 0 1 3 3v3h-5v-2H9v3H4V9a1 1 0 0 1 1-1Z"/><path d="M17.5 17s-2 2.2-2 3.2a2 2 0 0 0 4 0c0-1-2-3.2-2-3.2Z"/></>,
  electrical: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>,
  cleaning: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/><path d="M20 2v4M18 4h4"/></>,
  gardening: <><path d="M5 15C2 7 10 3 21 3c0 11-4 19-12 16M4 21 16 9"/><path d="M10 15v-5M10 15h5"/></>,
  mechanic: <><path d="m14 6 4 4 4-4a7 7 0 0 1-9 9l-6 6a3 3 0 0 1-4-4l6-6a7 7 0 0 1 9-9l-4 4Z"/></>,
  tutoring: <><path d="m2 8 10-5 10 5-10 5L2 8ZM6 10v7c4 3 8 3 12 0v-7M22 8v8"/></>,
  beauty: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/><path d="M4 2v4M2 4h4"/></>,
  painting: <><rect x="3" y="3" width="14" height="6" rx="2"/><path d="M17 6h4v7H11v3"/><rect x="9" y="16" width="4" height="6" rx="1"/></>,
  handyman: <><path d="m14 6 4 4 4-4a7 7 0 0 1-9 9l-6 6a3 3 0 0 1-4-4l6-6a7 7 0 0 1 9-9l-4 4Z"/></>,
};
export default function ServiceIcon({ name = "" }) {
  const key = name.toLowerCase();
  const match = Object.keys(paths).find((item) => key.includes(item) || (item === "electrical" && key.includes("electric")));
  return <svg className="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[match] || <><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/></>}</svg>;
}
