import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Screen from "../../components/layout/Screen.jsx";
import Button from "../../components/common/Button.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import Loading from "../../components/common/Loading.jsx";

import {
  classifyMessage,
  listServices,
  createUnsupportedServiceRequest,
} from "../../api/services.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { matchService } from "../../lib/matching.js";

export default function DescribeProblem() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [description, setDescription] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for the photo upload.");
      event.target.value = "";
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(String(reader.result || ""));
      setPhotoName(file.name);
    };
    reader.onerror = () => {
      setError("The selected photo could not be read. Please try another image.");
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoDataUrl("");
    setPhotoName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!description.trim() && !photoDataUrl) return;

    setLoading(true);
    setError("");

    try {
      const customerMessage =
        description.trim() ||
        `Customer uploaded an image for diagnosis${photoName ? ` (${photoName})` : ""}.`;

      // Load the catalog first, so the classifier answers in the names the database actually
      // uses instead of its own vocabulary.
      const services = await listServices().catch(() => []);

      const classification = await classifyMessage(
        customerMessage,
        services.map((service) => service.name),
        photoDataUrl || null
      );

      // The matcher decides whether we support this, not a string comparison against "other".
      // It reads the AI's category and the customer's own words, so "mechanic" still finds
      // "Automotive Repair", and a misspelling doesn't push a real job down the unsupported
      // path. See lib/matching.js.
      const matchedService = matchService(
        services,
        classification.category,
        customerMessage
      )?.service;

      if (!matchedService) {
        await createUnsupportedServiceRequest({
          description: description.trim() || customerMessage,
          advice: classification.advice,
        });

        navigate("/requests/not-supported", {
          state: {
            originalDescription: description.trim() || customerMessage,
            advice: classification.advice,
          },
        });

        return;
      }

      navigate("/requests/review", {
        state: {
          originalDescription: description.trim() || customerMessage,
          classification,
          serviceId: matchedService.id,
        },
      });
    } catch (err) {
      console.error(err);

      setError(
        "Couldn't reach the ML service or backend — make sure both are running locally (see INSTRUCTIONS.md)."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title={t("customer.problemTitle")} subtitle={t("customer.problemSubtitle")}>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t("customer.problemPreview")}
        className="min-h-[140px] w-full rounded-xl border border-gray-200 bg-white p-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-gray-700">{t("customer.photoOptional")}</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-2xl text-gray-400 transition-colors hover:border-brand hover:text-brand"
        >
          +
        </button>

        {photoDataUrl && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
            <img
              src={photoDataUrl}
              alt="Problem preview"
              className="h-16 w-16 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800">{photoName}</p>
              <p className="text-xs text-gray-500">{t("customer.readyAttach")}</p>
            </div>
            <button
              type="button"
              onClick={clearPhoto}
              className="text-xs font-medium text-brand hover:text-brand-dark"
            >
              {t("common.remove")}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4">
          <ErrorBanner>{error}</ErrorBanner>
        </div>
      )}

      {loading && (
        <div className="mt-4 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2">
          <Loading label={t("customer.aiLoading")} />
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading || (!description.trim() && !photoDataUrl)}
        className="mt-6"
      >
        {loading ? t("customer.aiLoadingShort") : t("customer.findRightService")}
      </Button>
    </Screen>
  );
}
