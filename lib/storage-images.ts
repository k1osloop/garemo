import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export const GAREMO_IMAGE_BUCKET = "garemo-images";
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

type UploadResult = {
  path: string;
  publicUrl: string;
};

export function validateImageFile(file: File) {
  if (file.size === 0) {
    return "El archivo esta vacio.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "La imagen debe pesar maximo 2MB.";
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
    return "Solo se permiten imagenes JPG, PNG o WebP. SVG no esta permitido.";
  }

  return null;
}

export function buildBusinessCoverPath(businessId: string, file: File) {
  return `businesses/${businessId}/cover/${crypto.randomUUID()}.${extensionFor(file)}`;
}

export function buildProductImagePath(
  businessId: string,
  productId: string,
  file: File,
) {
  return `businesses/${businessId}/products/${productId}/${crypto.randomUUID()}.${extensionFor(file)}`;
}

export async function uploadGaremoImage(
  supabase: SupabaseClient<Database>,
  path: string,
  file: File,
): Promise<UploadResult> {
  const validationError = validateImageFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const { error } = await supabase.storage
    .from(GAREMO_IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw new Error("No pudimos subir la imagen. Revisa permisos y formato.");
  }

  const { data } = supabase.storage
    .from(GAREMO_IMAGE_BUCKET)
    .getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl,
  };
}

function extensionFor(file: File) {
  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}
