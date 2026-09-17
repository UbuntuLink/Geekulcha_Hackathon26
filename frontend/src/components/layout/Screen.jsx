import { useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav.jsx";

/** Shared page shell: optional back arrow + title, cream background, bottom nav slot. */
export default function Screen({ title, subtitle, showBack = true, withNav = false, children }) {
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen bg-cream px-4 pt-4 ${withNav ? "pb-24" : "pb-8"}`}>
      {(title || showBack) && (
        <div className="mb-4">
          {showBack && (
            <button onClick={() => navigate(-1)} className="mb-2 text-sm text-gray-500 hover:text-gray-700">
              ← Back
            </button>
          )}
          {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      {children}
      {withNav && <BottomNav />}
    </div>
  );
}
