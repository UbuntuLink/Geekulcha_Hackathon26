import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Screen from "../../components/layout/Screen.jsx";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import ErrorBanner from "../../components/common/ErrorBanner.jsx";
import Loading from "../../components/common/Loading.jsx";
import ProgressSteps from "../../components/common/ProgressSteps.jsx";

import {
  classifyMessage,
  listServices,
  createUnsupportedServiceRequest,
  transcribeAudio,
} from "../../api/services.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { matchService } from "../../lib/matching.js";
import { MAX_RECORDING_SECONDS, isRecordingSupported, startRecording } from "../../lib/wavRecorder.js";

export default function DescribeProblem() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [description, setDescription] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // "idle" | "recording" | "transcribing"
  const [voiceState, setVoiceState] = useState("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recorderRef = useRef(null);

  // Count the seconds while recording, and stop at the limit so a forgotten mic can't run on.
  useEffect(() => {
    if (voiceState !== "recording") return undefined;
    setRecordingSeconds(0);
    const timer = setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [voiceState]);

  useEffect(() => {
    if (voiceState === "recording" && recordingSeconds >= MAX_RECORDING_SECONDS) stopRecording();
  }, [voiceState, recordingSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Release the microphone if the customer leaves the page mid-recording.
  useEffect(() => () => recorderRef.current?.cancel(), []);

  const startVoiceInput = async () => {
    if (!isRecordingSupported()) {
      setError("Voice input isn't supported in this browser. Please type your problem instead.");
      return;
    }

    setError("");
    try {
      recorderRef.current = await startRecording();
      setVoiceState("recording");
    } catch (err) {
      setError(
        err?.name === "NotAllowedError" || err?.name === "SecurityError"
          ? "Microphone access was blocked. Allow it in your browser's site settings and try again."
          : err?.name === "NotFoundError"
            ? "No microphone was found. Check your device settings, or type your problem instead."
            : "The microphone couldn't be started. Please try again or type your problem."
      );
    }
  };

  const stopRecording = async () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (!recorder) return;

    setVoiceState("transcribing");
    try {
      const audio = await recorder.stop();
      const text = (await transcribeAudio(audio)).trim();
      if (!text) {
        setError("We didn't catch any speech. Please try again, a little closer to the microphone.");
      } else {
        setDescription((prev) => `${prev}${prev ? " " : ""}${text}`.slice(0, 1000));
      }
    } catch (err) {
      console.error(err);
      setError("We couldn't turn your voice note into text right now. Please try again or type your problem.");
    } finally {
      setVoiceState("idle");
    }
  };

  const toggleVoiceInput = () => {
    if (voiceState === "recording") stopRecording();
    else if (voiceState === "idle") startVoiceInput();
  };

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

      // Do NOT create the service request yet.
      // First send the user to the review screen.
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
        "We couldn't process that request right now. Make sure the AI service and backend are running, then try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title={t("customer.problemTitle")}
      subtitle={t("customer.problemSubtitle")}
      eyebrow="Step 1 of 3"
      size="wide"
    >
      <ProgressSteps current={1} className="mb-6 max-w-3xl" />

      <div className="lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.65fr)] lg:items-start lg:gap-5 xl:gap-7">
        <Card className="lg:p-6 xl:p-7">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink lg:text-base">Describe the problem</p>
              <p className="mt-0.5 text-xs text-gray-500 lg:text-sm">Include what happened, where it is, and how urgent it feels.</p>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand lg:h-10 lg:w-10">✦</span>
          </div>

          <div className="mb-3 flex items-center justify-end">
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={voiceState === "transcribing" || loading}
              className={`grid h-11 w-11 place-items-center rounded-2xl border transition-all disabled:cursor-wait disabled:opacity-60 ${
                voiceState === "recording"
                  ? "animate-pulse border-red-200 bg-red-50 text-red-600"
                  : "border-brand/20 bg-brand-soft text-brand hover:-translate-y-0.5 hover:bg-brand/10"
              }`}
              aria-label={voiceState === "recording" ? "Stop recording" : "Record a voice note"}
              aria-pressed={voiceState === "recording"}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                {voiceState === "recording" ? (
                  <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" />
                ) : (
                  <>
                    <rect x="9" y="3" width="6" height="11" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <path d="M12 17v4" />
                    <path d="M8 21h8" />
                  </>
                )}
              </svg>
            </button>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            placeholder={t("customer.problemPreview")}
            className="min-h-[190px] w-full resize-y rounded-2xl border border-gray-200 bg-brand-mist/45 p-4 text-sm leading-6 text-gray-900 transition-all placeholder:text-gray-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15"
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-400">
            <span role="status">
              {voiceState === "recording"
                ? `Recording… ${recordingSeconds}s — tap the button again to finish`
                : voiceState === "transcribing"
                  ? "Turning your voice note into text…"
                  : "Type, or tap the microphone and speak in any language."}
            </span>
            <span>{description.length}/1000</span>
          </div>
        </Card>

        <div className="mt-3 space-y-3 lg:mt-0">
          <Card className="lg:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-ink">{t("customer.photoOptional")}</p>
                <p className="mt-0.5 text-xs leading-5 text-gray-500">Optional — useful for damage, leaks, or visible faults.</p>
              </div>

              {/* A real upload, not a placeholder: the image is sent to the classifier alongside
                  the text, so the model can diagnose from the picture. */}
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
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-dashed border-brand/30 bg-brand-mist text-xl font-light text-brand transition-all hover:-translate-y-0.5 hover:border-brand/50 hover:bg-brand-soft"
                aria-label={t("customer.photoOptional")}
              >
                +
              </button>
            </div>

            {photoDataUrl && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3">
                <img src={photoDataUrl} alt="Problem preview" className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">{photoName}</p>
                  <p className="text-xs text-gray-500">{t("customer.readyAttach")}</p>
                </div>
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="text-xs font-bold text-brand hover:text-brand-dark"
                >
                  {t("common.remove")}
                </button>
              </div>
            )}
          </Card>

          <Card className="hidden lg:block lg:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand/60">What happens next</p>
            <div className="mt-4 space-y-4">
              {[
                ["1", "AI identifies the service", "We classify your problem and create a clearer summary."],
                ["2", "You review it", "Add extra details before anything is saved."],
                ["3", "We find providers", "You’ll see matching providers for the service."],
              ].map(([number, heading, copy]) => (
                <div key={number} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-extrabold text-brand">{number}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{heading}</p>
                    <p className="mt-0.5 text-xs leading-5 text-gray-500">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}

      {loading && (
        <div className="mt-4 rounded-2xl border border-brand/15 bg-brand-mist px-4">
          <Loading label={t("customer.aiLoading")} />
        </div>
      )}

      <div className="mt-5 lg:flex lg:justify-end">
        <Button
          onClick={handleSubmit}
          disabled={loading || voiceState !== "idle" || (!description.trim() && !photoDataUrl)}
          className="lg:max-w-[320px]"
        >
          {loading ? t("customer.aiLoadingShort") : <>{t("customer.findRightService")} <span aria-hidden="true">→</span></>}
        </Button>
      </div>
    </Screen>
  );
}
