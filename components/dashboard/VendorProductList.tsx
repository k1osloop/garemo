"use client";

import { Package, ShieldCheck } from "lucide-react";

import {
  VendorProductForm,
  type VendorProductFormValues,
} from "@/components/dashboard/VendorProductForm";
import { Card } from "@/components/ui/card";
import type { Product } from "@/types/database";

type VendorProductListProps = {
  businessId: string;
  isSaving: boolean;
  onImageUpload: (productId: string, file: File) => Promise<string>;
  onSave: (
    values: VendorProductFormValues,
    productId?: string,
  ) => Promise<boolean>;
  products: Product[];
};

export function VendorProductList({
  businessId,
  isSaving,
  onImageUpload,
  onSave,
  products,
}: VendorProductListProps) {
  return (
    <section className="space-y-4" id="productos">
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold">Productos</h2>
        </div>
        <p className="text-sm leading-6 text-muted">
          Crea y edita productos propios con precio, oferta, stock simple,
          disponibilidad e imagen por URL segura. No hay carrito, pagos ni
          ventas dentro de Garemo.
        </p>
        <p className="flex items-center gap-2 text-xs leading-5 text-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-brand" />
          El formulario nunca envia `business_id` ajeno: al crear productos,
          Garemo usa el negocio propio cargado por RLS.
        </p>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {products.map((product) => (
          <VendorProductForm
            businessId={businessId}
            isSaving={isSaving}
            key={product.id}
            onImageUpload={onImageUpload}
            onSave={onSave}
            product={product}
          />
        ))}
        <VendorProductForm
          businessId={businessId}
          isSaving={isSaving}
          onImageUpload={onImageUpload}
          onSave={onSave}
        />
      </div>
    </section>
  );
}
