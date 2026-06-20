"use client";

import { VendorProductForm, type VendorProductFormValues } from "@/components/dashboard/VendorProductForm";
import type { Product } from "@/types/database";

type VendorProductListProps = {
  isSaving: boolean;
  onSave: (values: VendorProductFormValues, productId?: string) => Promise<void>;
  products: Product[];
};

export function VendorProductList({
  isSaving,
  onSave,
  products,
}: VendorProductListProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Productos</h2>
        <p className="text-sm leading-6 text-muted">
          Edita productos visibles y crea nuevos productos manuales. No hay stock avanzado ni ventas dentro de Garemo.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {products.map((product) => (
          <VendorProductForm
            isSaving={isSaving}
            key={product.id}
            onSave={onSave}
            product={product}
          />
        ))}
        <VendorProductForm isSaving={isSaving} onSave={onSave} />
      </div>
    </section>
  );
}
