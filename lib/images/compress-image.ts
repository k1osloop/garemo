export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxSizeMB?: number;
    quality?: number;
  } = {}
): Promise<File> {
  const { maxWidth = 1600, maxSizeMB = 1.5, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    // If the file is smaller than 500KB or not an image, just return it
    if (!file.type.startsWith("image/") || file.type.includes("svg")) {
      resolve(file);
      return;
    }

    if (file.size <= maxSizeMB * 1024 * 1024 && file.type === "image/webp") {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback: If browser can't load the image (e.g. unsupported HEIC on some OS), return original if allowed size, or error.
      if (file.size <= maxSizeMB * 1024 * 1024) {
        resolve(file);
      } else {
        reject(new Error("No se pudo cargar la imagen. Si es formato especial (HEIC), intenta convertirla a JPG/PNG."));
      }
    };

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      try {
        ctx.drawImage(img, 0, 0, width, height);
      } catch (err) {
        reject(new Error("No pudimos procesar esta imagen. Intenta con otra foto."));
        return;
      }

      const tryCompress = (currentQuality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            
            if (blob.size > maxSizeMB * 1024 * 1024 && currentQuality > 0.5) {
              tryCompress(currentQuality - 0.15);
              return;
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: "image/webp",
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          "image/webp",
          currentQuality
        );
      };

      tryCompress(quality);
    };

    img.src = url;
  });
}
