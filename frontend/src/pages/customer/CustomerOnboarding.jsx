import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import { Field, TextInput } from "../../components/common/Field.jsx";
import { setOnboarding, getOnboarding } from "../../lib/preferences.js";

export default function CustomerOnboarding() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const existing = getOnboarding();
  const [name, setName] = useState(existing.name || "");
  const [location, setLocation] = useState(existing.location || "");
  const [priority, setPriority] = useState(existing.priority || "price");

  const handleContinue = () => {
    setOnboarding({ name, location, priority });
    navigate("/home");
  };

  return (
    <Screen
      title={t("customer.setup")}
      subtitle={t("customer.subtitle")}
      showBack={false}
      eyebrow="Quick setup"
    >
      <div className="mb-5 flex items-center gap-2">
        {[0, 1, 2].map((step, index) => (
          <div key={step} className={`h-1.5 flex-1 rounded-full ${index === 0 ? "bg-brand" : "bg-brand/15"}`} />
        ))}
      </div>

      <Card className="space-y-5">
        <Field label={t("form.name")}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" />
        </Field>

        <Field label={t("form.location")} hint="A suburb or city is enough for now.">
          <TextInput value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Durban, KwaZulu-Natal" />
        </Field>

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-700">{t("form.whatMatters")}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { key: "price", title: "Best price", detail: "Prioritise affordability", icon: "R" },
              { key: "ratings", title: "Top rated", detail: "Prioritise reviews", icon: "★" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setPriority(option.key)}
                className={`rounded-2xl border p-3.5 text-left transition-all active:scale-[0.98] ${
                  priority === option.key
                    ? "border-brand bg-brand text-white shadow-soft"
                    : "border-gray-200 bg-white text-gray-700 hover:border-brand/30 hover:bg-brand-mist"
                }`}
              >
                <span className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-bold ${priority === option.key ? "bg-white/15" : "bg-brand-soft text-brand"}`}>{option.icon}</span>
                <span className="mt-3 block text-sm font-bold">{option.title}</span>
                <span className={`mt-0.5 block text-xs ${priority === option.key ? "text-white/70" : "text-gray-500"}`}>{option.detail}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Button onClick={handleContinue} disabled={!name.trim() || !location.trim()} className="mt-5">
        {t("action.continue")} <span aria-hidden="true">→</span>
      </Button>
    </Screen>
  );
}
