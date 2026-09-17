export default function Header({ title }) {
  return (
    <header className="sticky top-0 border-b bg-white px-4 py-3">
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
