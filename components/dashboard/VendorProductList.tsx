"use client";

import { Package, Plus, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import { useState } from "react";

import {
  VendorProductForm,
  type VendorProductFormValues,
} from "@/components/dashboard/VendorProductForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/database";

type VendorProductListProps = {
  businessId: string;
  businessStatus: string;
  isSaving: boolean;
  onImageUpload: (productId: string, file: File) => Promise<string>;
  onSave: (values: VendorProductFormValues, productId?: string) => Promise<boolean>;
  onDelete?: (productId: string) => Promise<void>;
  products: Product[];
};

export function VendorProductList({
  businessId,
  businessStatus,
  isSaving,
  onImageUpload,
  onSave,
  onDelete,
  products,
}: VendorProductListProps) {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const activeProduct = editingProductId ? products.find((p) => p.id === editingProductId) : null;

  async function handleSave(values: VendorProductFormValues, productId?: string) {
    const success = await onSave(values, productId);
    if (success) {
      setEditingProductId(null);
      setIsCreating(false);
    }
    return success;
  }

  async function handleDelete(productId: string) {
    if (onDelete && confirm("¿Eliminar este producto definitivamente?")) {
      setDeletingProductId(productId);
      await onDelete(productId);
      setDeletingProductId(null);
    }
  }

  async function handleToggleStatus(product: Product) {
    await onSave(
      {
        name: product.name,
        description: product.description,
        price: product.price,
        offer_price: product.offer_price,
        image_url: product.image_url,
        is_available: !product.is_available,
        stock_label: product.stock_label,
      },
      product.id
    );
  }

  return (
    <section className="space-y-4" id="productos">
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold">Productos</h2>
          </div>
          {!isCreating && !editingProductId && (
            <Button size="sm" onClick={() => setIsCreating(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Button>
          )}
        </div>
        <p className="text-sm leading-6 text-muted">
          Gestiona tu menú o catálogo de productos. Aquí puedes agregar, editar, pausar o eliminar artículos rápidamente.
        </p>
      </Card>

      {isCreating && (
        <div className="border border-brand/20 rounded-xl p-4 bg-brand/5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-brand">Crear nuevo producto</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>Cancelar</Button>
          </div>
          <VendorProductForm
            businessId={businessId}
            businessStatus={businessStatus}
            isSaving={isSaving}
            onImageUpload={onImageUpload}
            onSave={handleSave}
          />
        </div>
      )}

      {editingProductId && activeProduct && (
        <div className="border border-blue-500/20 rounded-xl p-4 bg-blue-50 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-blue-700">Editando: {activeProduct.name}</h3>
            <Button variant="ghost" size="sm" onClick={() => setEditingProductId(null)}>Cancelar</Button>
          </div>
          <VendorProductForm
            businessId={businessId}
            businessStatus={businessStatus}
            isSaving={isSaving}
            onImageUpload={onImageUpload}
            onSave={handleSave}
            product={activeProduct}
          />
        </div>
      )}

      {!isCreating && !editingProductId && (
        <div className="grid gap-3 lg:grid-cols-2">
          {products.map((product) => (
            <div key={product.id} className={`flex items-start gap-4 p-3 rounded-xl border bg-surface transition-opacity ${!product.is_available ? 'opacity-60 border-dashed' : 'border-border'}`}>
              <div 
                className="w-20 h-20 bg-slate-100 rounded-lg shrink-0 bg-cover bg-center" 
                style={product.image_url ? { backgroundImage: `url(${product.image_url})` } : {}}
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-800 truncate">{product.name}</h4>
                <p className="text-sm font-medium text-brand mt-1">
                  {product.price ? `Bs. ${product.price.toFixed(2)}` : 'Consultar precio'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button variant="secondary" size="sm" className="h-8 px-2 text-xs" onClick={() => setEditingProductId(product.id)}>
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button variant="secondary" size="sm" className="h-8 px-2 text-xs" onClick={() => handleToggleStatus(product)} title={product.is_available ? "Pausar" : "Activar"}>
                    {product.is_available ? <PowerOff className="h-3 w-3 text-amber-600" /> : <Power className="h-3 w-3 text-emerald-600" />}
                  </Button>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      disabled={deletingProductId === product.id}
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      {deletingProductId === product.id ? "Eliminando..." : ""}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {products.length === 0 && !isCreating && (
            <div className="col-span-full py-8 text-center text-muted border-2 border-dashed rounded-xl">
              Aún no tienes productos. Agrega el primero para empezar.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
