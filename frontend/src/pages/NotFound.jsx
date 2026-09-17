import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream px-6 text-center">
      <p className="text-lg font-semibold text-gray-900">Page not found</p>
      <Link to="/" className="text-sm font-medium text-brand hover:underline">
        Back to UbuntuLink
      </Link>
    </div>
  );
}
