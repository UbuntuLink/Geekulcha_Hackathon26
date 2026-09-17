import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col justify-between bg-brand px-6 py-10 text-white">
      <div>
        <p className="text-xl font-bold">UbuntuLink</p>
        <h1 className="mt-10 text-4xl font-bold leading-tight">
          Local help.
          <br />
          Right when you need it.
        </h1>
        <p className="mt-4 text-white/80">
          Describe the problem. We identify the service and connect you with trusted local providers.
        </p>
      </div>

      <div>
        <button
          onClick={() => navigate("/onboarding")}
          className="text-xl font-bold transition-opacity hover:opacity-80"
        >
          Get started →
        </button>
        <p className="mt-1 text-sm text-white/70">Find local skills. Compare confidently.</p>
      </div>
    </div>
  );
}
