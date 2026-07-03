import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getBusinessHoursStatus } from "@/lib/business-hours";
import type {
  BusinessImage,
  BusinessTrustSummary,
  Category,
  ContactInfo,
  Location,
  Product,
  PublicBusiness,
  Schedule,
} from "@/types/database";

type QueryResult<T> = {
  data: T;
  error: string | null;
};

type PublicBusinessQueryOptions = {
  limit?: number;
};

type RelatedBusinessRow = Omit<
  PublicBusiness,
  "category" | "location" | "schedules" | "images" | "contact_info"
> & {
  category?: Category | Category[] | null;
  location?: Location | Location[] | null;
  schedules?: Schedule[] | null;
  images?: BusinessImage[] | null;
  contact_info?: ContactInfo | ContactInfo[] | null;
  products?: Product[] | null;
};

const publicBusinessSelect = `
  id,
  owner_id,
  category_id,
  name,
  slug,
  description,
  status,
  price_range,
  is_verified,
  status_message,
  opens_at,
  closes_at,
  delivery_available,
  pickup_available,
  delivery_notes,
  created_at,
  updated_at,
  category:categories (
    id,
    name,
    slug,
    description,
    is_active,
    sort_order,
    created_at,
    updated_at
  ),
  location:locations (
    id,
    business_id,
    address_text,
    campus_zone,
    latitude,
    longitude,
    created_at,
    updated_at
  ),
  schedules (
    id,
    business_id,
    day_of_week,
    opens_at,
    closes_at,
    is_closed,
    created_at,
    updated_at
  ),
  images:business_images (
    id,
    business_id,
    storage_path,
    public_url,
    alt_text,
    sort_order,
    created_at
  ),
  contact_info (
    id,
    business_id,
    whatsapp_number,
    instagram_url,
    facebook_url,
    website_url,
    created_at,
    updated_at
  ),
  products (
    id,
    business_id,
    name,
    description,
    price,
    offer_price,
    image_url,
    image_path,
    is_available,
    stock_label,
    created_at,
    updated_at
  )
`;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const publicBusinessStatuses = ["active", "approved"] as const;

function safeError<T>(fallback: T): QueryResult<T> {
  return {
    data: fallback,
    error: "No pudimos cargar la informacion publica. Intenta nuevamente.",
  };
}

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeBusiness(row: RelatedBusinessRow): PublicBusiness {
  return {
    ...row,
    category: firstOrNull(row.category),
    location: firstOrNull(row.location),
    schedules: row.schedules ?? [],
    images: row.images ?? [],
    contact_info: firstOrNull(row.contact_info),
    products: row.products ?? [],
    trust_summary: null,
  };
}

function normalizeBusinesses(rows: RelatedBusinessRow[] | null): PublicBusiness[] {
  return (rows ?? []).map(normalizeBusiness);
}

function normalizeTrustSummary(summary: {
  business_id: string;
  average_rating: number | string | null;
  review_count: number;
  whatsapp_click_count: number;
}): BusinessTrustSummary {
  const average =
    summary.average_rating === null ? null : Number(summary.average_rating);

  return {
    business_id: summary.business_id,
    average_rating: Number.isFinite(average) ? average : null,
    review_count: summary.review_count ?? 0,
    whatsapp_click_count: summary.whatsapp_click_count ?? 0,
  };
}

async function withTrustSummaries(
  businesses: PublicBusiness[],
): Promise<PublicBusiness[]> {
  if (businesses.length === 0) {
    return businesses;
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc(
    "get_public_business_trust_summaries",
  );

  if (error) {
    return businesses;
  }

  const summaries = new Map(
    (data ?? []).map((summary) => {
      const normalized = normalizeTrustSummary(summary);

      return [normalized.business_id, normalized];
    }),
  );

  return businesses.map((business) => ({
    ...business,
    trust_summary: summaries.get(business.id) ?? null,
  }));
}

export async function getCategories(): Promise<QueryResult<Category[]>> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,is_active,sort_order,created_at,updated_at")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return safeError([]);
  }

  return { data: data ?? [], error: null };
}

function applyOptionalLimit<T>(
  query: T,
  limit?: number,
): T {
  if (!limit || limit < 1) {
    return query;
  }

  return (query as { limit: (count: number) => T }).limit(
    Math.min(Math.floor(limit), 50),
  );
}

export async function getActiveBusinesses(
  options: PublicBusinessQueryOptions = {},
): Promise<
  QueryResult<PublicBusiness[]>
> {
  const supabase = createSupabaseBrowserClient();
  const query = supabase
    .from("businesses")
    .select(publicBusinessSelect)
    .in("status", [...publicBusinessStatuses])
    .order("name", { ascending: true });

  const { data, error } = await applyOptionalLimit(query, options.limit);

  if (error) {
    return safeError([]);
  }

  return {
    data: await withTrustSummaries(
      normalizeBusinesses(data as unknown as RelatedBusinessRow[] | null),
    ),
    error: null,
  };
}

export async function getBusinessesByCategory(
  categorySlug: string,
  options: PublicBusinessQueryOptions = {},
): Promise<QueryResult<PublicBusiness[]>> {
  const supabase = createSupabaseBrowserClient();

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .eq("is_active", true)
    .maybeSingle();

  if (categoryError) {
    return safeError([]);
  }

  const categoryRow = category as { id: string } | null;

  if (!categoryRow) {
    return { data: [], error: null };
  }

  const query = supabase
    .from("businesses")
    .select(publicBusinessSelect)
    .in("status", [...publicBusinessStatuses])
    .eq("category_id", categoryRow.id)
    .order("name", { ascending: true });

  const { data, error } = await applyOptionalLimit(query, options.limit);

  if (error) {
    return safeError([]);
  }

  return {
    data: await withTrustSummaries(
      normalizeBusinesses(data as unknown as RelatedBusinessRow[] | null),
    ),
    error: null,
  };
}

function normalizeTerm(value: string) {
  return value.trim().toLowerCase();
}

function businessMatchesQuery(business: PublicBusiness, query: string) {
  const term = normalizeTerm(query);

  if (!term) {
    return true;
  }

  const haystack = [
    business.name,
    business.description,
    business.price_range ?? "",
    business.category?.name ?? "",
    business.category?.slug ?? "",
    business.location?.address_text ?? "",
    business.location?.campus_zone ?? "",
    ...business.products.flatMap((product) => [
      product.name,
      product.description ?? "",
      product.stock_label ?? "",
    ]),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(term);
}

export async function searchVisibleBusinesses({
  categorySlug,
  query,
  delivery,
  pickup,
  hasOffers,
  isOpen,
  limit,
}: {
  categorySlug?: string;
  query?: string;
  delivery?: boolean;
  pickup?: boolean;
  hasOffers?: boolean;
  isOpen?: boolean;
  limit?: number;
}): Promise<QueryResult<PublicBusiness[]>> {
  const result = categorySlug
    ? await getBusinessesByCategory(categorySlug, { limit })
    : await getActiveBusinesses({ limit });

  if (result.error) {
    return result;
  }

  let filtered = result.data;

  if (query) {
    filtered = filtered.filter((business) => businessMatchesQuery(business, query));
  }

  if (delivery) {
    filtered = filtered.filter((business) => business.delivery_available);
  }

  if (pickup) {
    filtered = filtered.filter((business) => business.pickup_available);
  }

  if (hasOffers) {
    filtered = filtered.filter((business) =>
      business.products.some((product) => product.offer_price !== null && product.offer_price >= 0)
    );
  }

  if (isOpen) {
    filtered = filtered.filter(
      (business) => getBusinessHoursStatus(business).isOpenNow,
    );
  }

  return {
    data: filtered,
    error: null,
  };
}

export async function getBusinessById(
  id: string,
): Promise<QueryResult<PublicBusiness | null>> {
  if (!uuidPattern.test(id)) {
    return { data: null, error: null };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(publicBusinessSelect)
    .in("status", [...publicBusinessStatuses])
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return safeError(null);
  }

  const businesses = data
    ? await withTrustSummaries([
        normalizeBusiness(data as unknown as RelatedBusinessRow),
      ])
    : [];

  return { data: businesses[0] ?? null, error: null };
}

export async function getBusinessBySlug(
  slug: string,
): Promise<QueryResult<PublicBusiness | null>> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(publicBusinessSelect)
    .in("status", [...publicBusinessStatuses])
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return safeError(null);
  }

  const businesses = data
    ? await withTrustSummaries([
        normalizeBusiness(data as unknown as RelatedBusinessRow),
      ])
    : [];

  return { data: businesses[0] ?? null, error: null };
}

export type BusinessReviewPreview = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export async function getBusinessReviews(
  businessId: string,
): Promise<QueryResult<BusinessReviewPreview[]>> {
  if (!uuidPattern.test(businessId)) {
    return { data: [], error: null };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("business_reviews")
    .select("id, rating, comment, created_at")
    .eq("business_id", businessId)
    .eq("status", "visible")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching business reviews:", error);
    return { data: [], error: null };
  }

  return { data: (data as unknown as BusinessReviewPreview[]) ?? [], error: null };
}
