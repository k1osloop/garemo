import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  BusinessImage,
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
    is_available,
    stock_label,
    created_at,
    updated_at
  )
`;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  };
}

function normalizeBusinesses(rows: RelatedBusinessRow[] | null): PublicBusiness[] {
  return (rows ?? []).map(normalizeBusiness);
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

export async function getActiveBusinesses(): Promise<
  QueryResult<PublicBusiness[]>
> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(publicBusinessSelect)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    return safeError([]);
  }

  return {
    data: normalizeBusinesses(data as unknown as RelatedBusinessRow[] | null),
    error: null,
  };
}

export async function getBusinessesByCategory(
  categorySlug: string,
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

  const { data, error } = await supabase
    .from("businesses")
    .select(publicBusinessSelect)
    .eq("status", "active")
    .eq("category_id", categoryRow.id)
    .order("name", { ascending: true });

  if (error) {
    return safeError([]);
  }

  return {
    data: normalizeBusinesses(data as unknown as RelatedBusinessRow[] | null),
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
}: {
  categorySlug?: string;
  query?: string;
}): Promise<QueryResult<PublicBusiness[]>> {
  const result = categorySlug
    ? await getBusinessesByCategory(categorySlug)
    : await getActiveBusinesses();

  if (result.error) {
    return result;
  }

  return {
    data: result.data.filter((business) =>
      query ? businessMatchesQuery(business, query) : true,
    ),
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
    .eq("status", "active")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return safeError(null);
  }

  return {
    data: data ? normalizeBusiness(data as unknown as RelatedBusinessRow) : null,
    error: null,
  };
}

export async function getBusinessBySlug(
  slug: string,
): Promise<QueryResult<PublicBusiness | null>> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(publicBusinessSelect)
    .eq("status", "active")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return safeError(null);
  }

  return {
    data: data ? normalizeBusiness(data as unknown as RelatedBusinessRow) : null,
    error: null,
  };
}
