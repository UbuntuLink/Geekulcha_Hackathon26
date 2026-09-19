import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { Field, TextArea, TextInput } from "../../components/common/Field.jsx";
import { addMyProviderService, listServices, updateMyProviderProfile } from "../../api/services.js";

/** Shown once, right after a provider's first login (see ProviderDashboard's redirect check). */
export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const [allServices, setAllServices] = useState([]);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
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
      await updateMyProviderProfile({ bio, location, serviceRadiusKm: 15, availableToday: true });
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
    <Screen title="Set up your provider profile" subtitle="Customers will see this when they browse providers." showBack={false}>
      <Card>
        <div className="space-y-4">
          <Field label="Bio">
            <TextArea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell customers about your experience..." />
          </Field>
          <Field label="Location">
            <TextInput value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Pretoria, Gauteng" />
          </Field>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">A service you offer (optional, add more later)</p>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">Choose a service...</option>
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
        {submitting ? "Saving..." : "Finish setup"}
      </Button>
    </Screen>
  );
}
