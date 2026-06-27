# Auditoría de Estructura de Código - Sprint 7A

## 1. Carpetas que están bien estructuradas
- pp/: La estructura de rutas de Next.js App Router es clara y predecible.
- lib/supabase/: Bien aislado el cliente y las queries en queries.ts.
- supabase/: Migraciones y políticas de seguridad bien documentadas en archivos .sql.

## 2. Carpetas que están desordenadas o abultadas
- components/business/: Contiene demasiados componentes de distintos propósitos.
- components/dashboard/: Mezcla componentes visuales con lógica pesada.

## 3. Componentes demasiado grandes
- VendorDashboardClient.tsx (900+ líneas): Agrupa lógica de pestañas y formularios masivos.
- VendorBusinessForm.tsx: Demasiado largo, mezcla UI con lógica de validación Zod extensa.
- pp/businesses/[id]/page.tsx (480+ líneas): Renderiza toda la página de detalle sin abstracción.

## 4. Lógica repetida
- Mapeo de estados "Verificado/Sin verificar" en BusinessCard.tsx y en el detalle.
- Renderizado de estrellas (Rating).

## 5. Archivos que deberían moverse o separarse
- VendorDashboardClient.tsx debería fragmentarse en un directorio propio dashboard/tabs/.
- Estandarización de components/ui/ (mezcla de PascalCase y kebab-case).

## 6. Qué partes necesitan documentación
- Flujos complejos de ImageUploadField.tsx.
- Queries en queries.ts.

## 7. Qué cosas NO conviene tocar antes de presentación (Deuda Técnica Consciente)
- **No reescribir VendorDashboardClient.tsx masivamente.** Se ordenará visualmente con Tabs, pero la lógica de estados de React no se debe romper.
- **No separar pp/businesses/[id]/page.tsx** en múltiples server components pequeños ahora para evitar pérdida de context. Se mejorará la UI *in-situ*.
