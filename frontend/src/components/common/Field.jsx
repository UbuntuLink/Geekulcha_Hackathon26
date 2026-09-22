export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-relaxed text-gray-500">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200/90 bg-white/90 px-3.5 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 hover:border-brand/30 focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10";

export function TextInput({ className = "", ...props }) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function TextArea({ className = "", ...props }) {
  return <textarea className={`${inputClass} min-h-[120px] resize-y ${className}`} {...props} />;
}
