export default function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "w-full rounded-lg py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    outline: "border border-brand text-brand bg-white hover:bg-brand/5",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
