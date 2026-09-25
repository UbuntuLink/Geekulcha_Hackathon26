import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import Loading from "../../components/common/Loading.jsx";
import { Field, TextArea, TextInput } from "../../components/common/Field.jsx";
import LocationPicker from "../../components/common/LocationPicker.jsx";
import { getCurrentUser } from "../../api/auth.js";
import { addMyProviderService, createMyProviderProfile, listServices } from "../../api/services.js";
import { getOnboarding } from "../../lib/preferences.js";
import { isValidSaId } from "../../lib/saId.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function BecomeProvider() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
  const onboarding = getOnboarding();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    idNumber: "",
    bio: "",
    location: onboarding.location || "",
    // Prefilled from customer onboarding: someone who already pinned their home is usually
    // working from the same place.
    latitude: onboarding.latitude ?? null,
    longitude: onboarding.longitude ?? null,
    serviceRadiusKm: 15,
    availableToday: true,
    serviceId: "",
    yearsExperience: "",
    minPrice: "",
    maxPrice: "",
  });

  useEffect(() => {
    if (user?.isProvider) {
      navigate("/provider/dashboard", { replace: true });
      return;
    }

    listServices()
      .then(setServices)
      .catch(() => setError(t("becomeProvider.servicesError")))
      .finally(() => setLoading(false));
  }, [navigate, t, user?.isProvider]);

  const selectedService = useMemo(
    () => services.find((service) => String(service.id) === String(form.serviceId)),
    [form.serviceId, services]
  );

  const update = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateIdNumber = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 13);
    setForm((current) => ({ ...current, idNumber: digitsOnly }));
  };

  const validate = () => {
    if (!/^\d{13}$/.test(form.idNumber)) {
      return t("becomeProvider.idError");
    }

    // Catch a mistyped digit here rather than after a round trip that comes back as a bare
    // rejection. Same rule the backend applies — see lib/saId.js.
    if (!isValidSaId(form.idNumber)) {
      return "That ID number doesn't look right. The last digit is a check digit, so one wrong digit invalidates the whole number.";
    }

    if (!form.bio.trim() || !form.location.trim() || !form.serviceId) {
      return t("becomeProvider.requiredError");
    }

    const min = Number(form.minPrice);
    const max = Number(form.maxPrice);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < 0) {
      return t("becomeProvider.priceError");
    }
    if (max < min) return t("becomeProvider.rangeError");

    const years = Number(form.yearsExperience || 0);
    if (!Number.isFinite(years) || years < 0 || years > 80) {
      return t("becomeProvider.experienceError");
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await createMyProviderProfile({
        idNumber: form.idNumber,
        bio: form.bio.trim(),
        location: form.location.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        serviceRadiusKm: Number(form.serviceRadiusKm) || 15,
        availableToday: form.availableToday,
      });

      await addMyProviderService({
        serviceId: Number(form.serviceId),
        yearsExperience: Number(form.yearsExperience) || 0,
        minPrice: Number(form.minPrice),
        maxPrice: Number(form.maxPrice),
      });

      const refreshedUser = await getCurrentUser();
      setUser(refreshedUser);
      navigate("/provider/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 409) {
        setError(t("becomeProvider.alreadyProvider"));
      } else if (err?.response?.status === 400) {
        const backendMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          (typeof err?.response?.data === "string" ? err.response.data : "");
        setError(backendMessage || t("becomeProvider.idRejected"));
      } else {
        // Says what actually happened. The old copy blamed a missing provider-upgrade endpoint,
        // which sent people looking for a deployment problem when the real cause was a 500 —
        // usually a rejected ID escaping as an unmapped exception.
        const backendMessage = err?.response?.data?.message;
        setError(
          backendMessage
            ? `Couldn't create your provider profile: ${backendMessage}`
            : "Couldn't create your provider profile. Check the backend log for the reason."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen title={t("becomeProvider.title")}>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen title={t("becomeProvider.title")} subtitle={t("becomeProvider.subtitle")}>
      <div className="space-y-4">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-lg">🛠️</div>
            <div>
              <p className="font-semibold text-gray-900">{t("becomeProvider.sameAccount")}</p>
              <p className="mt-1 text-sm leading-5 text-gray-500">{t("becomeProvider.sameAccountHelp")}</p>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <h2 className="mb-4 text-base font-semibold text-gray-900">{t("becomeProvider.aboutTitle")}</h2>
            <div className="space-y-4">
              <Field label={t("becomeProvider.idLabel")}>
                <TextInput
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={13}
                  value={form.idNumber}
                  onChange={updateIdNumber}
                  placeholder="8001015009087"
                />
                <p className="mt-1.5 text-xs leading-5 text-gray-500">
                  {t("becomeProvider.idHelp")}
                </p>
              </Field>

              <Field label={t("provider.bio")}>
                <TextArea
                  value={form.bio}
                  onChange={update("bio")}
                  placeholder={t("provider.bioPlaceholder")}
                  rows={4}
                />
              </Field>

              <LocationPicker
                label={t("provider.location")}
                hint="Pin where you work from — jobs inside your service radius will reach you."
                value={{ label: form.location, latitude: form.latitude, longitude: form.longitude }}
                onChange={(place) =>
                  setForm((current) => ({
                    ...current,
                    location: place.label,
                    latitude: place.latitude,
                    longitude: place.longitude,
                  }))
                }
              />

              <Field label={t("provider.serviceRadius")}>
                <TextInput
                  type="number"
                  min="1"
                  max="250"
                  value={form.serviceRadiusKm}
                  onChange={update("serviceRadiusKm")}
                />
              </Field>

              <label className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 text-sm text-gray-700">
                <input type="checkbox" checked={form.availableToday} onChange={update("availableToday")} />
                <span>{t("becomeProvider.availableHelp")}</span>
              </label>
            </div>
          </Card>

          <Card>
            <h2 className="mb-1 text-base font-semibold text-gray-900">{t("becomeProvider.firstService")}</h2>
            <p className="mb-4 text-sm text-gray-500">{t("becomeProvider.firstServiceHelp")}</p>

            <div className="space-y-4">
              <Field label={t("common.service")}>
                <select
                  value={form.serviceId}
                  onChange={update("serviceId")}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="">{t("provider.chooseService")}</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>{service.name}</option>
                  ))}
                </select>
              </Field>

              <Field label={t("becomeProvider.experience")}>
                <TextInput
                  type="number"
                  min="0"
                  max="80"
                  value={form.yearsExperience}
                  onChange={update("yearsExperience")}
                  placeholder="e.g. 5"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t("provider.minPrice")}>
                  <TextInput type="number" min="0" value={form.minPrice} onChange={update("minPrice")} placeholder="300" />
                </Field>
                <Field label={t("provider.maxPrice")}>
                  <TextInput type="number" min="0" value={form.maxPrice} onChange={update("maxPrice")} placeholder="800" />
                </Field>
              </div>

              {selectedService && (
                <p className="rounded-lg bg-brand/5 px-3 py-2 text-xs leading-5 text-brand-dark">
                  {t("becomeProvider.priceHelp").replace("{service}", selectedService.name)}
                </p>
              )}
            </div>
          </Card>

          {error && <ErrorBanner>{error}</ErrorBanner>}

          <Button type="submit" disabled={submitting}>
            {submitting ? t("provider.saving") : t("becomeProvider.submit")}
          </Button>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            {t("becomeProvider.notNow")}
          </button>
        </form>
      </div>
    </Screen>
  );
}
