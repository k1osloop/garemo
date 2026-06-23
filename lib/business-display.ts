import type { BusinessImage, Product, PublicBusiness } from "@/types/database";

export type BusinessAvailability = {
  label: string;
  tone: "open" | "closing" | "closed" | "unknown";
};

function minutesFromTime(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);

  return hours * 60 + minutes;
}

function currentCampusMinutes() {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "America/La_Paz",
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0,
  );

  return hour * 60 + minute;
}

export function getBusinessAvailability(
  business: PublicBusiness,
): BusinessAvailability {
  if (business.status_message) {
    return {
      label: business.status_message,
      tone: "open",
    };
  }

  if (!business.opens_at || !business.closes_at) {
    return {
      label: "Horario por confirmar",
      tone: "unknown",
    };
  }

  const now = currentCampusMinutes();
  const opens = minutesFromTime(business.opens_at);
  const closes = minutesFromTime(business.closes_at);

  if (now < opens || now > closes) {
    return {
      label: "Cerrado ahora",
      tone: "closed",
    };
  }

  if (closes - now <= 45) {
    return {
      label: "Cierra pronto",
      tone: "closing",
    };
  }

  return {
    label: "Abierto ahora",
    tone: "open",
  };
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
