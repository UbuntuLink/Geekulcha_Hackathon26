import AppRoutes from "./routes/AppRoutes.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";

export default function App() {
  return (
    <LanguageProvider>
      <AppRoutes />
    </LanguageProvider>
  );
}
