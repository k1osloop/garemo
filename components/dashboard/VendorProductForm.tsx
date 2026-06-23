"use client";

import { useState } from "react";
import { ImageIcon, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/dashboard/ImageUploadField";
import type { Product } from "@/types/database";

export type VendorProductFormValues = Pick<
  Product,
  | "name"
  | "description"
  | "price"
  | "offer_price"
  | "image_url"
  | "is_available"
  | "stock_label"
>;

type VendorProductFormProps = {
  businessId: string;
  isSaving: boolean;
  onImageUpload: (productId: string, file: File) => Promise<string>;
  onSave: (
    values: VendorProductFormValues,
    productId?: string,
  ) => Promise<boolean>;
  product?: Product;
};

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  return text.length > 0 ? text : null;
}

function nullableNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const parsed = Number(text);

  return Number.isFinite(parsed) ? parsed : null;
}

function numberValue(value: number | null) {
  return value === null ? "" : String(value);
}

export function VendorProductForm({
  businessId,
  isSaving,
  onImageUpload,
  onSave,
  product,
}: VendorProductFormProps) {
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const formData = new FormData(event.currentTarget);

    const values = {
      name: String(formData.get("name") ?? "").trim(),
      description: nullableText(formData.get("description")),
      price: nullableNumber(formData.get("price")),
      offer_price: nullableNumber(formData.get("offer_price")),
      image_url: nullableText(formData.get("image_url")),
      is_available: formData.get("is_available") === "on",
      stock_label: nullableText(formData.get("stock_label")),
    };

    const validationError = validateProductValues(values);

    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    const saved = await onSave(values, product?.id);

    if (saved) {
      setMessage({
        type: "success",
        text: product ? "Producto actualizado." : "Producto creado.",
      });
    }

    if (saved && !product) {
      event.currentTarget.reset();
      setImageUrl("");
    }
  }

  async function uploadProductImage(file: File) {
    if (!product) {
      throw new Error("Crea el producto antes de subir una imagen.");
    }

    const publicUrl = await onImageUpload(product.id, file);
    setImageUrl(publicUrl);

    return publicUrl;
  }

  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-brand" />
          <h3 className="text-base font-semibold">
            {product ? product.name : "Nuevo producto"}
          </h3>
        </div>
        <p className="text-xs leading-5 text-muted">
          Producto visible para compradores. No cambies datos de otro negocio:
          RLS lo bloquea y el formulario solo envia campos permitidos.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          defaultValue={product?.name ?? ""}
          label="Nombre"
          maxLength={90}
          minLength={2}
          name="name"
          required
        />
        <label className="grid gap-2 text-sm font-medium">
          Descripcion
          <textarea
            className="min-h-24 rounded-lg border border-border bg-surface px-3 py-2 text-base outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
            defaultValue={product?.description ?? ""}
            maxLength={300}
            name="description"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            defaultValue={numberValue(product?.price ?? null)}
            label="Precio"
            min="0"
            name="price"
            step="0.01"
            type="number"
          />
          <Input
            defaultValue={numberValue(product?.offer_price ?? null)}
            label="Precio oferta"
            min="0"
            name="offer_price"
            step="0.01"
            type="number"
          />
        </div>
        <Input
          defaultValue={product?.stock_label ?? ""}
          label="Estado de stock"
          maxLength={80}
          name="stock_label"
          placeholder="Disponible hoy"
        />
        {product ? (
          <ImageUploadField
            currentUrl={imageUrl}
            description={`Ruta segura: businesses/${businessId}/products/${product.id}/...`}
            disabled={isSaving}
            label="Imagen del producto"
            onUpload={uploadProductImage}
          />
        ) : (
          <p className="rounded-lg border border-border bg-background p-3 text-xs leading-5 text-muted">
            Crea el producto primero para habilitar subida segura a Supabase
            Storage con una ruta asociada a su `product_id`.
          </p>
        )}
        <Input
          label="URL de imagen"
          name="image_url"
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://..."
          type="url"
          value={imageUrl}
        />
        <p className="text-xs leading-5 text-muted">
          Puedes mantener una URL HTTPS publica o subir una imagen real con
          Supabase Storage. SVG no esta permitido.
        </p>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            className="h-4 w-4 accent-[var(--brand)]"
            defaultChecked={product?.is_available ?? true}
            name="is_available"
            type="checkbox"
          />
          Disponible
        </label>
        {product?.image_url ? (
          <p className="flex items-center gap-2 text-xs leading-5 text-muted">
            <ImageIcon className="h-3.5 w-3.5 text-brand" />
            La imagen se renderiza solo si la URL es HTTPS valida.
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button disabled={isSaving} type="submit">
            {isSaving ? "Guardando..." : product ? "Guardar producto" : "Crear producto"}
          </Button>
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
      </form>
    </Card>
  );
}

function validateProductValues(values: VendorProductFormValues) {
  if (values.name.length < 2) {
    return "El producto debe tener al menos 2 caracteres.";
  }

  if (values.price !== null && values.price < 0) {
    return "El precio no puede ser negativo.";
  }

  if (values.offer_price !== null && values.offer_price < 0) {
    return "El precio oferta no puede ser negativo.";
  }

  if (
    values.price !== null &&
    values.offer_price !== null &&
    values.offer_price > values.price
  ) {
    return "El precio oferta no debe ser mayor al precio normal.";
  }

  if (values.image_url) {
    try {
      const url = new URL(values.image_url);

      if (!["http:", "https:"].includes(url.protocol)) {
        return "La imagen debe usar una URL http o https.";
      }
    } catch {
      return "La URL de imagen no es valida.";
    }
  }

  return null;
}
