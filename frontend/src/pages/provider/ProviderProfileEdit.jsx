import { useEffect, useState } from "react";
import Screen from "../../components/layout/Screen.jsx";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import Loading from "../../components/common/Loading.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import { Field, TextArea, TextInput } from "../../components/common/Field.jsx";
import {
  addMyProviderService,
  getMyProviderProfile,
  listServices,
  removeMyProviderService,
  updateMyProviderProfile,
} from "../../api/services.js";
import { formatRange } from "../../lib/format.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function ProviderProfileEdit() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [form, setForm] = useState(null);
  const [newService, setNewService] = useState({ serviceId: "", minPrice: "", maxPrice: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    getMyProviderProfile().then((p) => {
      setProfile(p);
      setForm({
        bio: p.bio ?? "",
        location: p.location ?? "",
        serviceRadiusKm: p.serviceRadiusKm ?? 0,
        availableToday: p.availableToday,
      });
    });

  useEffect(() => {
    load();
    listServices().then(setAllServices);
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setError("");
    try {
      await updateMyProviderProfile(form);
      await load();
    } catch (err) {
      setError("Couldn't save your profile — is the backend running?");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = async () => {
    if (!newService.serviceId) return;
    setError("");
    try {
      await addMyProviderService({
        serviceId: Number(newService.serviceId),
        minPrice: Number(newService.minPrice) || 0,
        maxPrice: Number(newService.maxPrice) || 0,
      });
      setNewService({ serviceId: "", minPrice: "", maxPrice: "" });
      await load();
    } catch (err) {
      setError("Couldn't add that service — is the backend running?");
      console.error(err);
    }
  };

  const handleRemoveService = async (serviceId) => {
    try {
      await removeMyProviderService(serviceId);
      await load();
    } catch (err) {
      setError("Couldn't remove that service — is the backend running?");
      console.error(err);
    }
  };

  if (!profile || !form) {
    return (
      <Screen title={t("provider.profile")} showBack={false} withNav navRole="provider">
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen title={t("provider.profile")} showBack={false} withNav navRole="provider">
      <Card>
        <div className="space-y-4">
          <Field label={t("provider.bio")}>
            <TextArea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </Field>
          <Field label={t("provider.location")}>
            <TextInput value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label={t("provider.serviceRadius")}>
            <TextInput
              type="number"
              min="0"
              value={form.serviceRadiusKm}
              onChange={(e) => setForm({ ...form, serviceRadiusKm: Number(e.target.value) })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.availableToday}
              onChange={(e) => setForm({ ...form, availableToday: e.target.checked })}
            />
            {form.availableToday ? t("provider.availableToday") : t("provider.unavailableToday")}
          </label>
        </div>
        {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}
        <Button className="mt-4" onClick={handleSaveProfile} disabled={saving}>
          {saving ? t("provider.saving") : t("provider.saveProfile")}
        </Button>
      </Card>

      <div className="mt-4">
        <h2 className="mb-2 text-base font-semibold text-gray-900">{t("provider.yourServices")}</h2>
        {profile.services.length === 0 && <p className="mb-2 text-sm text-gray-500">{t("provider.noServices")}</p>}
        {profile.services.map((s) => (
          <Card key={s.serviceId} className="mb-2 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{s.serviceName}</p>
              <p className="text-sm text-gray-500">{formatRange(s.minPrice, s.maxPrice)}</p>
            </div>
            <button
              onClick={() => handleRemoveService(s.serviceId)}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              {t("provider.remove")}
            </button>
          </Card>
        ))}

        <Card className="mt-2">
          <p className="mb-2 text-sm font-medium text-gray-700">{t("provider.addService")}</p>
          <select
            value={newService.serviceId}
            onChange={(e) => setNewService({ ...newService, serviceId: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="">{t("provider.chooseService")}</option>
            {allServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="mt-2 flex gap-2">
            <TextInput
              type="number"
              min="0"
              placeholder={t("provider.minPrice")}
              value={newService.minPrice}
              onChange={(e) => setNewService({ ...newService, minPrice: e.target.value })}
            />
            <TextInput
              type="number"
              min="0"
              placeholder={t("provider.maxPrice")}
              value={newService.maxPrice}
              onChange={(e) => setNewService({ ...newService, maxPrice: e.target.value })}
            />
          </div>
          <Button variant="outline" className="mt-2" onClick={handleAddService} disabled={!newService.serviceId}>
            {t("provider.addService")}
          </Button>
        </Card>

        {/* Customers sign out from their Profile screen; providers had nowhere to, except a
            header control that was hidden on desktop. */}
        <Card>
          <p className="font-semibold text-gray-900">{user?.email}</p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            {t("common.signOut")}
          </Button>
        </Card>
      </div>
    </Screen>
  );
}
