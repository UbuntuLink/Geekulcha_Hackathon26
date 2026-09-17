import Screen from "../layout/Screen.jsx";

/** Consistent placeholder for provider-side screens — no Figma design exists yet, see PROJECT.md §9a. */
export default function NotBuiltYet({ title }) {
  return (
    <Screen title={title}>
      <div className="rounded-xl border border-dashed border-gray-300 bg-white/50 p-6 text-center">
        <p className="text-sm text-gray-500">
          This screen isn't built yet — there's no Figma design for the provider side. See{" "}
          <span className="font-medium">PROJECT.md §9a</span>.
        </p>
      </div>
    </Screen>
  );
}
