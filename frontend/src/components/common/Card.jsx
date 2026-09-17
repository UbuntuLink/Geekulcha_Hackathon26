export default function Card({ children, className = "", ...props }) {
  return (
    <div className={`rounded-xl bg-white p-4 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}
