import type { BusinessImage, Product, PublicBusiness } from "@/types/database";
import { getBusinessHoursStatus } from "@/lib/business-hours";

export type BusinessAvailability = {
  label: string;
  tone: "open" | "closing" | "closed" | "unknown";
};

export function getBusinessAvailability(
  business: PublicBusiness,
): BusinessAvailability {
  const status = getBusinessHoursStatus(business);

  return {
    label: status.nextStatusLabel,
    tone: status.tone,
  };
}

function productEffectivePrice(product: Product) {
  return product.offer_price ?? product.price;
}

export function getFeaturedProduct(products: Product[]) {
  const availableProducts = products.filter((product) => product.is_available);
  const offerProduct = availableProducts
    .filter((product) => product.offer_price !== null)
    .sort(
      (first, second) =>
        (first.offer_price ?? Number.MAX_SAFE_INTEGER) -
        (second.offer_price ?? Number.MAX_SAFE_INTEGER),
    )[0];

  if (offerProduct) {
    return offerProduct;
  }

  const lowestPriced = availableProducts
    .filter((product) => productEffectivePrice(product) !== null)
    .sort(
      (first, second) =>
        (productEffectivePrice(first) ?? Number.MAX_SAFE_INTEGER) -
        (productEffectivePrice(second) ?? Number.MAX_SAFE_INTEGER),
    )[0];

  return lowestPriced ?? availableProducts[0] ?? products[0] ?? null;
}

export function getFeaturedProductBadge(product: Product | null) {
  if (!product) {
    return "Catalogo en preparacion";
  }

  if (product.offer_price !== null) {
    return "Oferta";
  }

  return product.is_available ? "Disponible" : "Agotado";
}

export function formatPrice(value: number | null) {
  if (value === null) {
    return null;
  }

  return `Bs ${new Intl.NumberFormat("es-BO", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(value)}`;
}

export function getProductImage(product: Product | null) {
  if (!product?.image_url) {
    return null;
  }

  return safeHttpsUrl(product.image_url);
}

export function getBusinessCoverImage(business: PublicBusiness) {
  const sortedImages = [...business.images].sort(compareBusinessImages);
  const cover = sortedImages.find((image) => safeHttpsUrl(image.public_url));

  return cover ? safeHttpsUrl(cover.public_url) : null;
}

export function getBusinessDisplayImage(
  business: PublicBusiness,
  product: Product | null,
) {
  return getBusinessCoverImage(business) ?? getProductImage(product);
}

function safeHttpsUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

function compareBusinessImages(first: BusinessImage, second: BusinessImage) {
  if (first.sort_order !== second.sort_order) {
    return first.sort_order - second.sort_order;
  }

  return second.created_at.localeCompare(first.created_at);
}

export function availabilityClassName(tone: BusinessAvailability["tone"]) {
  if (tone === "open") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (tone === "closing") {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  if (tone === "closed") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-border bg-background text-muted";
}

export function formatRating(value: number | null) {
  if (value === null) {
    return null;
  }

  return new Intl.NumberFormat("es-BO", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value);
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("es-BO", {
    maximumFractionDigits: 0,
  }).format(value);
}
