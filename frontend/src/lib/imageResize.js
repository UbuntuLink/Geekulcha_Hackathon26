// Shrinks a photo in the browser before upload: longest side at most `maxSize` px, re-encoded as
// JPEG. A phone photo is typically 3–8 MB; after this it's usually 150–300 KB, which keeps review
// uploads quick on mobile data and well inside the server's 2 MB per-photo limit.
//
// Re-encoding also strips EXIF metadata, including the GPS location phones embed in photos, so a
// customer doesn't publish where they live by posting a picture of the finished job.

export async function resizeImage(file, { maxSize = 1280, quality = 0.82 } = {}) {
  const image = await loadImage(file);
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  // JPEG has no transparency: paint white first so transparent PNGs don't turn black.
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable image"));
    };
    image.src = url;
  });
}
