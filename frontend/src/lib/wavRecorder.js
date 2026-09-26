// Records the microphone as 16 kHz mono WAV, for the ML service's /transcribe endpoint.
//
// Why not MediaRecorder: it produces WebM/Opus in Chrome and MP4 in Safari, and the model's
// audio input only accepts WAV or MP3. Capturing raw samples and writing the WAV header here
// gives one format in every browser, with no library. 16 kHz mono is what speech models use, and
// keeps a minute of audio under 2 MB.

const TARGET_RATE = 16000;

export const MAX_RECORDING_SECONDS = 60;

export function isRecordingSupported() {
  return Boolean(
    navigator.mediaDevices?.getUserMedia && (window.AudioContext || window.webkitAudioContext)
  );
}

/**
 * Starts recording. Resolves to `{ stop, cancel }` once the microphone is open:
 * `stop()` resolves to the recording as base64 WAV (no "data:" prefix); `cancel()` discards it.
 * Rejects with the getUserMedia error (e.g. NotAllowedError) if the microphone can't be opened.
 */
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const context = new AudioCtx();
  const source = context.createMediaStreamSource(stream);
  // ScriptProcessorNode is deprecated in favour of AudioWorklet, but it is the one capture path
  // every current browser still supports without serving a separate worklet file.
  const processor = context.createScriptProcessor(4096, 1, 1);
  const chunks = [];

  processor.onaudioprocess = (event) => {
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };
  source.connect(processor);
  processor.connect(context.destination);

  const release = () => {
    processor.disconnect();
    source.disconnect();
    stream.getTracks().forEach((track) => track.stop());
    context.close().catch(() => {});
  };

  return {
    stop: async () => {
      release();
      const samples = downsample(concat(chunks), context.sampleRate, TARGET_RATE);
      return toBase64(encodeWav(samples, TARGET_RATE));
    },
    cancel: release,
  };
}

function concat(chunks) {
  const out = new Float32Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

// Averages each block of input samples into one output sample — enough to avoid aliasing for
// speech, without pulling in a resampling library.
function downsample(samples, fromRate, toRate) {
  if (fromRate <= toRate) return samples;
  const ratio = fromRate / toRate;
  const out = new Float32Array(Math.floor(samples.length / ratio));
  for (let i = 0; i < out.length; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), samples.length);
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += samples[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  // In slices: String.fromCharCode(...bytes) on a whole recording overflows the call stack.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
