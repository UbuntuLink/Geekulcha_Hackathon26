import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Button from "../../components/common/Button.jsx";
import { Field, TextInput } from "../../components/common/Field.jsx";
import { setOnboarding, getOnboarding } from "../../lib/preferences.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

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
    <Screen title={t("customer.setup")} subtitle={t("customer.subtitle")} showBack={false}>
      <div className="space-y-4">
        <Field label={t("form.name")}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Tebogo" />
        </Field>
        <Field label={t("form.location")}>
          <TextInput
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Pretoria, Gauteng"
          />
        </Field>
        <div>
          <p className="mb-1 text-sm font-medium text-gray-700">{t("form.whatMatters")}</p>
          <div className="flex gap-2">
            {["price", "ratings"].map((option) => (
              <button
                key={option}
                onClick={() => setPriority(option)}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium capitalize transition-colors ${
                  priority === option
                    ? "border-brand bg-brand text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-brand/40"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={handleContinue} disabled={!name || !location} className="mt-4">
          {t("action.continue")}
        </Button>
      </div>
    </Screen>
  );
}
