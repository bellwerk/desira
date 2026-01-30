import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyListState } from "./EmptyListState";
import { ListDetailClient } from "./ListDetailClient";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

type ItemRow = {
  id: string;
  title: string;
  image_url: string | null;
  product_url: string | null;
  price_cents: number | null;
  target_amount_cents: number | null;
  note_public: string | null;
  note_private: string | null;
  status: string;
  sort_order: number | null;
  quantity: number | null;
  most_desired: boolean | null;
};

type ReservationFlag = {
  item_id: string;
  is_reserved: boolean;
};

type ContributionTotal = {
  item_id: string;
  funded_amount_cents: number;
};

export default async function ListDetailPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Load list (RLS allows members to view lists they belong to)
  const { data: list, error: listErr } = await supabase
    .from("lists")
    .select(
      `
      id,
      title,
      recipient_type,
      visibility,
      occasion,
      event_date,
      share_token,
      allow_reservations,
      allow_contributions,
      allow_anonymous,
      currency,
      created_at,
      owner_id
    `
    )
    .eq("id", id)
    .single();

  if (listErr || !list) {
    notFound();
  }

  // Load items
  const { data: items } = await supabase
    .from("items")
    .select(
      `
      id,
      title,
      image_url,
      product_url,
      price_cents,
      target_amount_cents,
      note_public,
      note_private,
      status,
      sort_order,
      quantity,
      most_desired
    `
    )
    .eq("list_id", id)
    .order("sort_order", { ascending: true });

  const typedItems = (items ?? []) as ItemRow[];
  const itemIds = typedItems.map((i) => i.id);

  // Load reservation flags and contribution totals
  let reservedFlags: ReservationFlag[] = [];
  let totals: ContributionTotal[] = [];

  if (itemIds.length > 0) {
    const [r1, r2] = await Promise.all([
      supabase
        .from("public_reservation_flags")
        .select("item_id,is_reserved")
        .in("item_id", itemIds),
      supabase
        .from("public_contribution_totals")
        .select("item_id,funded_amount_cents")
        .in("item_id", itemIds),
    ]);

    reservedFlags = (r1.data ?? []) as ReservationFlag[];
    totals = (r2.data ?? []) as ContributionTotal[];
  }

  // Convert to plain objects for client component serialization
  const reservedMap: Record<string, boolean> = {};
  for (const r of reservedFlags) {
    reservedMap[r.item_id] = r.is_reserved;
  }

  const fundedMap: Record<string, number> = {};
  for (const t of totals) {
    fundedMap[t.item_id] = t.funded_amount_cents;
  }

  const hasItems = typedItems.length > 0;

  const visibilityVariant =
    list.visibility === "private"
      ? "private"
      : list.visibility === "public"
      ? "public"
      : "unlisted";

  const visibilityLabel =
    list.visibility === "private"
      ? "Private"
      : list.visibility === "public"
      ? "Public"
      : "Unlisted";

  // Empty state: show a creative centered layout
  if (!hasItems) {
    return (
      <EmptyListState
        listId={list.id}
        listTitle={list.title}
        visibilityVariant={visibilityVariant}
        visibilityLabel={visibilityLabel}
      />
    );
  }

  return (
    <ListDetailClient
      listId={list.id}
      listTitle={list.title}
      shareToken={list.share_token}
      items={typedItems}
      reservedMap={reservedMap}
      fundedMap={fundedMap}
      currency={list.currency ?? "CAD"}
      listSettings={{
        id: list.id,
        title: list.title,
        recipient_type: list.recipient_type,
        visibility: list.visibility,
        occasion: list.occasion,
        event_date: list.event_date,
        allow_reservations: list.allow_reservations,
        allow_contributions: list.allow_contributions,
        allow_anonymous: list.allow_anonymous,
      }}
    />
  );
}
