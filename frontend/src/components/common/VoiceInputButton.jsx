import { useEffect, useRef, useState } from "react";
import { transcribeAudio } from "../../api/services.js";
import { MAX_RECORDING_SECONDS, isRecordingSupported, startRecording } from "../../lib/wavRecorder.js";

/**
 * Speak instead of type: tap to record, tap again to stop, and the words are added to the field
 * via onText. Same recorder and /transcribe service as "Describe your problem", so it works in
 * any language and any modern browser. Used on quote messages, tracker notes, bios and chat, so
 * providers and customers who find typing hard can use every text field.
 */
export default function VoiceInputButton({ onText, disabled = false, label = "Speak instead of typing", className = "" }) {
  const [state, setState] = useState("idle"); // idle | recording | transcribing
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const recorderRef = useRef(null);

  useEffect(() => {
    if (state !== "recording") return undefined;
    setSeconds(0);
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [state]);

  useEffect(() => {
    if (state === "recording" && seconds >= MAX_RECORDING_SECONDS) stop();
  }, [state, seconds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Release the microphone if the page closes mid-recording.
  useEffect(() => () => recorderRef.current?.cancel(), []);

  const start = async () => {
    setError("");
    if (!isRecordingSupported()) {
      setError("Voice input isn't supported in this browser.");
      return;
    }
    try {
      recorderRef.current = await startRecording();
      setState("recording");
    } catch (err) {
      setError(
        err?.name === "NotAllowedError" || err?.name === "SecurityError"
          ? "Microphone access was blocked. Allow it in your browser's site settings."
          : "The microphone couldn't be started."
      );
    }
  };

  const stop = async () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (!recorder) return;
    setState("transcribing");
    try {
      const text = (await transcribeAudio(await recorder.stop())).trim();
      if (text) onText(text);
      else setError("We didn't catch any speech. Please try again.");
    } catch (err) {
      console.error(err);
      setError("Couldn't turn that into text. Please try again or type instead.");
    } finally {
      setState("idle");
    }
  };

  const recording = state === "recording";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={disabled || state === "transcribing"}
        aria-pressed={recording}
        className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${
          recording ? "animate-pulse border-red-300 bg-red-50 text-red-700" : "border-brand/25 text-brand hover:bg-brand/5"
        }`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
          {recording ? (
            <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" />
          ) : (
            <>
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" />
            </>
          )}
        </svg>
        {recording ? `Stop recording (${seconds}s)` : state === "transcribing" ? "Turning speech into text…" : label}
      </button>
      <span className="sr-only" aria-live="polite">
        {recording ? "Recording" : state === "transcribing" ? "Converting speech to text" : ""}
      </span>
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
