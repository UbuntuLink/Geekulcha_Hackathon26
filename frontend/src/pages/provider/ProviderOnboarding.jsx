import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { Field, TextArea, TextInput } from "../../components/common/Field.jsx";
import LocationPicker from "../../components/common/LocationPicker.jsx";
import { addMyProviderService, listServices, updateMyProviderProfile } from "../../api/services.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

/** Shown once, right after a provider's first login (see ProviderDashboard's redirect check). */
export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [allServices, setAllServices] = useState([]);
  const [bio, setBio] = useState("");
  const [place, setPlace] = useState({ label: "", latitude: null, longitude: null });
  const [serviceId, setServiceId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listServices().then(setAllServices);
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      // serviceRadiusKm finally does something: with coordinates on both sides, matching drops
      // this provider for jobs further away than this.
      await updateMyProviderProfile({
        bio,
        location: place.label,
        latitude: place.latitude,
        longitude: place.longitude,
        serviceRadiusKm: 15,
        availableToday: true,
      });
      if (serviceId) {
        await addMyProviderService({
          serviceId: Number(serviceId),
          minPrice: Number(minPrice) || 0,
          maxPrice: Number(maxPrice) || 0,
        });
      }
      navigate("/provider/dashboard", { replace: true });
    } catch (err) {
      setError("Couldn't save your profile — is the backend running?");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen title={t("provider.setup")} subtitle={t("provider.subtitle")} showBack={false}>
      <Card>
        <div className="space-y-4">
          <Field label={t("form.bio")}>
            <TextArea value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t("provider.bioPlaceholder")} />
          </Field>
          <LocationPicker
            label={t("form.location")}
            hint="Pin where you work from — customers within your service radius will see you."
            value={place}
            onChange={setPlace}
          />
          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">{t("provider.optional")}</p>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">{t("provider.choose")}</option>
              {allServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {serviceId && (
            <div className="flex gap-2">
              <TextInput type="number" min="0" placeholder="Min price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              <TextInput type="number" min="0" placeholder="Max price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
          )}
        </div>
      </Card>

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}

      <Button className="mt-6" onClick={handleSubmit} disabled={submitting || !bio || !location}>
        {submitting ? t("provider.saving") : t("provider.finish")}
      </Button>
    </Screen>
  );
}
