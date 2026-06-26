"use client";

import { Camera, Image as ImageIcon, ImageUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { validateImageFile } from "@/lib/storage-images";
import { compressImage } from "@/lib/images/compress-image";

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
    type: "error" | "success" | "info";
    text: string;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    const timer = window.setTimeout(() => {
      if (file) {
        objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      } else {
        setPreviewUrl(currentUrl ?? null);
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [currentUrl, file]);

  async function processFile(selectedFile: File) {
    if (selectedFile.size === 0) {
      setMessage({ type: "error", text: "El archivo está vacío." });
      return;
    }
    if (selectedFile.type === "image/svg+xml") {
      setMessage({ type: "error", text: "SVG no está permitido." });
      return;
    }

    setIsProcessing(true);
    setMessage({ type: "info", text: "Preparando imagen..." });

    try {
      // Compress if it's large or just to ensure it's webp/jpg
      const compressed = await compressImage(selectedFile, {
        maxWidth: 1600,
        maxSizeMB: 1.5,
      });

      const validationError = validateImageFile(compressed);

      if (validationError) {
        setFile(null);
        if (selectedFile.size > 2 * 1024 * 1024) {
          setMessage({ type: "error", text: "La imagen sigue siendo muy pesada. Intenta tomarla con menor resolución o elegir otra foto." });
        } else {
          setMessage({ type: "error", text: validationError });
        }
        setIsProcessing(false);
        return;
      }

      setFile(compressed);
      setMessage(null);
    } catch {
      setMessage({ type: "error", text: "Error al optimizar la imagen." });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setMessage(null);
    event.target.value = ""; // Reset input so same file can be selected again if needed

    if (!selectedFile) {
      setFile(null);
      return;
    }

    await processFile(selectedFile);
  }

  async function handleUpload() {
    if (!file) {
      setMessage({ type: "error", text: "Selecciona una imagen primero." });
      return;
    }

    setIsProcessing(true);
    setMessage({ type: "info", text: "Subiendo imagen..." });

    try {
      const publicUrl = await onUpload(file);
      setFile(null);
      setPreviewUrl(publicUrl);
      setMessage({ type: "success", text: "Imagen actualizada." });
    } catch {
      setMessage({
        type: "error",
        text: "No pudimos subir la imagen. Intenta nuevamente.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-background p-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs leading-5 text-muted">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-[140px_1fr] sm:items-start">
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-cover bg-center bg-surface flex-shrink-0"
          style={
            previewUrl
              ? { backgroundImage: `url("${previewUrl}")` }
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
        <div className="grid gap-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={cameraInputRef}
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              disabled={disabled || isProcessing}
              onChange={handleFileChange}
              type="file"
            />
            <input
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={disabled || isProcessing}
              onChange={handleFileChange}
              type="file"
            />
            
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={disabled || isProcessing}
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Tomar foto
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={disabled || isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Subir desde galería
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center pt-2 border-t border-border/50">
            <Button
              disabled={disabled || isProcessing || !file}
              onClick={() => void handleUpload()}
              type="button"
              className="w-full sm:w-auto"
            >
              <ImageUp className="h-4 w-4 mr-2" />
              Guardar imagen
            </Button>
            <p className="text-xs text-muted">JPG, PNG o WebP. Max 2MB.</p>
          </div>
          
          {message ? (
            <p
              className={
                message.type === "error"
                  ? "text-sm text-red-600"
                  : message.type === "success" 
                  ? "text-sm text-brand"
                  : "text-sm text-blue-600"
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
