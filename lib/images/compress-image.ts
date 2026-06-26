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
      reject(new Error("Failed to load image for compression"));
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

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          
          // Create a new File from the blob
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
            type: "image/webp",
            lastModified: Date.now(),
          });

          // If the compressed file is somehow larger and we wanted to reduce it,
          // or if compression didn't help much, we might fallback.
          // But usually webp compression reduces size significantly.
          resolve(compressedFile);
        },
        "image/webp",
        quality
      );
    };

    img.src = url;
  });
}
