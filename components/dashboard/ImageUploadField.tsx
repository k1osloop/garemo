"use client";

import { useEffect, useState } from "react";
import { ImageUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { validateImageFile } from "@/lib/storage-images";

type ImageUploadFieldProps = {
  currentUrl?: string | null;
  description: string;
  disabled?: boolean;
  label: string;
  onUpload: (file: File) => Promise<string>;
};

export function ImageUploadField({
  currentUrl,
  description,
  disabled = false,
  label,
  onUpload,
}: ImageUploadFieldProps) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    const timer = window.setTimeout(() => {
      if (!file) {
        setPreviewUrl(currentUrl ?? null);
        return;
      }

      objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }, 0);

    return () => {
      window.clearTimeout(timer);

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [currentUrl, file]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setMessage(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validationError = validateImageFile(selectedFile);

    if (validationError) {
      setFile(null);
      event.target.value = "";
      setMessage({ type: "error", text: validationError });
      return;
    }

    setFile(selectedFile);
  }

  async function handleUpload() {
    if (!file) {
      setMessage({ type: "error", text: "Selecciona una imagen primero." });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const publicUrl = await onUpload(file);
      setFile(null);
      setPreviewUrl(publicUrl);
      setMessage({ type: "success", text: "Imagen subida y guardada." });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "No pudimos subir la imagen.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-background p-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs leading-5 text-muted">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[140px_1fr] sm:items-center">
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-cover bg-center bg-surface"
          style={
            previewUrl
              ? {
                  backgroundImage: `url("${previewUrl}")`,
                }
              : undefined
          }
        >
          {previewUrl ? (
            <span className="sr-only">{label}</span>
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              <ImageUp className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="grid gap-3">
          <input
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:text-sm file:font-medium file:text-brand-foreground"
            disabled={disabled || isUploading}
            onChange={handleFileChange}
            type="file"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              disabled={disabled || isUploading || !file}
              onClick={() => void handleUpload()}
              type="button"
            >
              <ImageUp className="h-4 w-4" />
              {isUploading ? "Subiendo..." : "Subir imagen"}
            </Button>
            <p className="text-xs text-muted">JPG, PNG o WebP. Maximo 2MB.</p>
          </div>
          {message ? (
            <p
              className={
                message.type === "error"
                  ? "text-sm text-red-600"
                  : "text-sm text-brand"
              }
            >
              {message.text}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
