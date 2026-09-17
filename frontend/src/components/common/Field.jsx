export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export function TextInput(props) {
  return <input className={inputClass} {...props} />;
}

export function TextArea(props) {
  return <textarea className={`${inputClass} min-h-[120px] resize-none`} {...props} />;
}
