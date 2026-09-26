import { useEffect, useRef, useState } from "react";

export default function ImageCaptureInput({ label, hint, value, onChange, required = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  const openCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      setError("Camera access was unavailable. Check your browser permission or choose an image file instead.");
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) onChange(new File([blob], "provider-selfie.jpg", { type: "image/jpeg" }));
      closeCamera();
    }, "image/jpeg", 0.9);
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span>
      <div className="space-y-2">
        <input
          type="file"
          accept="image/*"
          required={required && !value}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm"
        />
        <button type="button" onClick={cameraOpen ? closeCamera : openCamera} className="rounded-lg border border-brand px-3 py-2 text-sm font-semibold text-brand hover:bg-brand/5">
          {cameraOpen ? "Close camera" : "Take a selfie"}
        </button>
        {cameraOpen && (
          <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-900 p-2">
            <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-lg object-cover" />
            <button type="button" onClick={takePhoto} className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
              Capture photo
            </button>
          </div>
        )}
        {value && <p className="text-xs font-medium text-brand">Selected: {value.name}</p>}
        {hint && <p className="text-xs leading-relaxed text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
