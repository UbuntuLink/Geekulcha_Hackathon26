export default function Card({ children, className = "", ...props }) {
  const interactive = Boolean(props.onClick);

  return (
    <div
      className={`glass-surface rounded-2xl p-4 ${
        interactive
          ? "interactive-card interactive-sheen cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-brand/18 hover:shadow-[0_18px_38px_rgba(23,35,30,0.10)] active:translate-y-0"
          : ""
      } ${className}`}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); props.onClick(event); } } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
