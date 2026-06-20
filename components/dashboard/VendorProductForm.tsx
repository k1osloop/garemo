"use client";

import { useState } from "react";
import { Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  isSaving: boolean;
  onSave: (values: VendorProductFormValues, productId?: string) => Promise<void>;
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
  isSaving,
  onSave,
  product,
}: VendorProductFormProps) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const formData = new FormData(event.currentTarget);

    await onSave(
      {
        name: String(formData.get("name") ?? "").trim(),
        description: nullableText(formData.get("description")),
        price: nullableNumber(formData.get("price")),
        offer_price: nullableNumber(formData.get("offer_price")),
        image_url: nullableText(formData.get("image_url")),
        is_available: formData.get("is_available") === "on",
        stock_label: nullableText(formData.get("stock_label")),
      },
      product?.id,
    );

    setMessage(product ? "Producto actualizado." : "Producto creado.");

    if (!product) {
      event.currentTarget.reset();
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-brand" />
        <h3 className="text-base font-semibold">
          {product ? product.name : "Nuevo producto"}
        </h3>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          defaultValue={product?.name ?? ""}
          label="Nombre"
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
          name="stock_label"
          placeholder="Disponible hoy"
        />
        <Input
          defaultValue={product?.image_url ?? ""}
          label="URL de imagen"
          name="image_url"
          placeholder="https://..."
          type="url"
        />
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            className="h-4 w-4 accent-[var(--brand)]"
            defaultChecked={product?.is_available ?? true}
            name="is_available"
            type="checkbox"
          />
          Disponible
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button disabled={isSaving} type="submit">
            {isSaving ? "Guardando..." : product ? "Guardar producto" : "Crear producto"}
          </Button>
          {message ? <p className="text-sm text-brand">{message}</p> : null}
        </div>
      </form>
    </Card>
  );
}
