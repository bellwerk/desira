import { supabaseAdmin } from "@/lib/supabase/admin";
import { ContributeForm } from "@/components/ContributeForm";
import { ErrorStateCard } from "@/components/ui";

// Force dynamic rendering and nodejs runtime for server-side operations
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const RESERVATION_DURATION_HOURS = 24;

type ReservationRow = {
  id: string;
  status: string;
  created_at?: string | null;
  reserved_until?: string | null;
  reserved_by_token_hash?: string | null;
  device_token_hash?: string | null;
  cancel_token_hash?: string | null;
};

function getReservationOwnerHash(
  reservation: Pick<ReservationRow, "reserved_by_token_hash" | "device_token_hash">
): string | null {
  return reservation.reserved_by_token_hash ?? reservation.device_token_hash ?? null;
}

function isLegacyPurchasedLock(reservation: ReservationRow): boolean {
  if (reservation.status !== "reserved") {
    return false;
  }
  const ownerHash = getReservationOwnerHash(reservation);
  return !reservation.reserved_until && !ownerHash && !reservation.cancel_token_hash;
}

function isReservationExpired(reservation: ReservationRow): boolean {
  const expiryIso = reservation.reserved_until
    ? reservation.reserved_until
    : reservation.created_at
      ? new Date(
        new Date(reservation.created_at).getTime() + RESERVATION_DURATION_HOURS * 60 * 60 * 1000
      ).toISOString()
      : null;
  if (!expiryIso) {
    return false;
  }
  return new Date(expiryIso).getTime() <= Date.now();
}

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ item?: string }>;
};

export default async function ContributePage({ params, searchParams }: PageProps): Promise<React.ReactElement> {
  const { token } = await params;
  const { item } = await searchParams;

  if (!item) {
    return (
      <ErrorStateCard
        title="Missing item"
        message="Go back and tap Contribute from the list."
        className="mx-auto max-w-md"
      />
    );
  }

  // Load list by token (we need currency + allow flags)
  const { data: list, error: listErr } = await supabaseAdmin
    .from("lists")
    .select("id,currency,allow_anonymous,allow_contributions")
    .eq("share_token", token)
    .single();

  if (listErr || !list) {
    return (
      <ErrorStateCard
        title="List not found"
        message="That link may be invalid or expired."
        className="mx-auto max-w-md"
      />
    );
  }

  if (!list.allow_contributions) {
    return (
      <ErrorStateCard
        title="Contributions disabled"
        message="This list doesn't accept contributions."
        className="mx-auto max-w-md"
      />
    );
  }

  // Load item
  const { data: itemRow, error: itemErr } = await supabaseAdmin
    .from("items")
    .select("id,title,image_url,price_cents,target_amount_cents,status,list_id")
    .eq("id", item)
    .single();

  if (itemErr || !itemRow || itemRow.list_id !== list.id) {
    return (
      <ErrorStateCard
        title="Item not found"
        message="This item may have been removed."
        className="mx-auto max-w-md"
      />
    );
  }

  if (itemRow.status !== "active") {
    return (
      <ErrorStateCard
        title="Item unavailable"
        message="This gift is no longer open for contributions."
        className="mx-auto max-w-md"
      />
    );
  }

  const { data: reservationLockRaw, error: reservationLockErr } = await supabaseAdmin
    .from("reservations")
    .select("*")
    .eq("item_id", itemRow.id)
    .neq("status", "canceled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reservationLockErr) {
    return (
      <ErrorStateCard
        title="Item unavailable"
        message="We could not verify current reservation state."
        className="mx-auto max-w-md"
      />
    );
  }

  const reservationLock = (reservationLockRaw ?? null) as ReservationRow | null;

  if (reservationLock && (reservationLock.status === "purchased" || isLegacyPurchasedLock(reservationLock))) {
    return (
      <ErrorStateCard
        title="Item unavailable"
        message="This gift has already been purchased."
        className="mx-auto max-w-md"
      />
    );
  }

  if (reservationLock?.status === "reserved" && !isReservationExpired(reservationLock)) {
    return (
      <ErrorStateCard
        title="Item unavailable"
        message="This gift is currently reserved."
        className="mx-auto max-w-md"
      />
    );
  }

  // Load funded totals
  const { data: total } = await supabaseAdmin
    .from("public_contribution_totals")
    .select("funded_amount_cents")
    .eq("item_id", itemRow.id)
    .maybeSingle();

  const fundedCents = total?.funded_amount_cents ?? 0;
  const targetCents = itemRow.target_amount_cents ?? itemRow.price_cents ?? null;

  return (
    <ContributeForm
      token={token}
      itemId={itemRow.id}
      title={itemRow.title}
      imageUrl={itemRow.image_url}
      currency={list.currency}
      targetCents={targetCents}
      fundedCents={fundedCents}
      allowAnonymous={list.allow_anonymous}
      closeWhenFunded={true}
    />
  );
}
