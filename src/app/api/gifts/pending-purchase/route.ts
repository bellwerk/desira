import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const PendingPurchaseSchema = z.object({
  deviceToken: z.string().uuid(),
  cancelToken: z.string().min(10).max(200).optional(),
  share_token: z.string().trim().min(1).max(200),
});

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function isMissingColumnError(errorMessage: string | undefined): boolean {
  const message = (errorMessage ?? "").toLowerCase();
  return message.includes("does not exist") || message.includes("could not find");
}

type ReservationCandidate = {
  id: string;
  item_id: string;
  created_at?: string | null;
  reserved_until?: string | null;
  affiliate_click_at?: string | null;
  reserved_by_token_hash?: string | null;
  device_token_hash?: string | null;
  cancel_token_hash?: string | null;
};

type ItemSummary = {
  id: string;
  title: string;
  list_id: string;
};

type ReservationQueryAttempt = {
  select: string;
  hasAffiliateClickColumn: boolean;
  hasReservedUntilColumn: boolean;
  hasReservedByTokenColumn: boolean;
};

const RESERVATION_QUERY_ATTEMPTS: ReservationQueryAttempt[] = [
  {
    select:
      "id,item_id,created_at,reserved_until,affiliate_click_at,reserved_by_token_hash,device_token_hash,cancel_token_hash",
    hasAffiliateClickColumn: true,
    hasReservedUntilColumn: true,
    hasReservedByTokenColumn: true,
  },
  {
    select:
      "id,item_id,created_at,reserved_until,reserved_by_token_hash,device_token_hash,cancel_token_hash",
    hasAffiliateClickColumn: false,
    hasReservedUntilColumn: true,
    hasReservedByTokenColumn: true,
  },
  {
    select: "id,item_id,created_at,device_token_hash,cancel_token_hash",
    hasAffiliateClickColumn: false,
    hasReservedUntilColumn: false,
    hasReservedByTokenColumn: false,
  },
  {
    select: "id,item_id,created_at,cancel_token_hash",
    hasAffiliateClickColumn: false,
    hasReservedUntilColumn: false,
    hasReservedByTokenColumn: false,
  },
];

export async function POST(req: Request): Promise<NextResponse> {
  const json = await req.json().catch(() => null);
  const parsed = PendingPurchaseSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { deviceToken, cancelToken, share_token } = parsed.data;
  const tokenHash = sha256(deviceToken);
  const cancelTokenHash = cancelToken ? sha256(cancelToken) : null;
  const nowIso = new Date().toISOString();

  const { data: list, error: listErr } = await supabaseAdmin
    .from("lists")
    .select("id,visibility")
    .eq("share_token", share_token)
    .maybeSingle();

  if (listErr || !list || list.visibility === "private") {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const { data: itemsRaw, error: itemsErr } = await supabaseAdmin
    .from("items")
    .select("id,title,list_id")
    .eq("list_id", list.id);

  if (itemsErr) {
    return NextResponse.json(
      { error: "Failed to load reservation status" },
      { status: 500 }
    );
  }

  const items = (itemsRaw ?? []) as ItemSummary[];
  if (items.length === 0) {
    return NextResponse.json({ ok: true, item: null });
  }

  const itemMap = new Map(items.map((item) => [item.id, item]));
  const candidateItemIds = items.map((item) => item.id);
  let candidates: ReservationCandidate[] = [];
  let hasAffiliateClickColumn = true;
  let hasReservedUntilColumn = true;
  let hasReservedByTokenColumn = true;
  let hasCompatibleReservationSchema = false;

  for (const attempt of RESERVATION_QUERY_ATTEMPTS) {
    const result = await supabaseAdmin
      .from("reservations")
      .select(attempt.select)
      .eq("status", "reserved")
      .in("item_id", candidateItemIds)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!result.error) {
      hasCompatibleReservationSchema = true;
      candidates = (result.data ?? []) as unknown as ReservationCandidate[];
      hasAffiliateClickColumn = attempt.hasAffiliateClickColumn;
      hasReservedUntilColumn = attempt.hasReservedUntilColumn;
      hasReservedByTokenColumn = attempt.hasReservedByTokenColumn;
      break;
    }

    if (!isMissingColumnError(result.error.message)) {
      return NextResponse.json(
        { error: "Failed to load reservation status" },
        { status: 500 }
      );
    }
  }

  if (!hasCompatibleReservationSchema) {
    return NextResponse.json({ ok: true, item: null });
  }

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, item: null });
  }

  let newestActiveOwnedReservation: {
    item_id: string;
    title: string;
    reserved_until: string | null;
    affiliate_click_at: string | null;
  } | null = null;

  for (const candidate of candidates) {
    const ownerHash = hasReservedByTokenColumn
      ? candidate.reserved_by_token_hash ?? candidate.device_token_hash ?? null
      : candidate.device_token_hash ?? null;
    const ownedByDeviceHash = Boolean(ownerHash) && ownerHash === tokenHash;
    const ownedByCancelToken =
      Boolean(cancelTokenHash) &&
      Boolean(candidate.cancel_token_hash) &&
      candidate.cancel_token_hash === cancelTokenHash;

    if (!ownedByDeviceHash && !ownedByCancelToken) {
      continue;
    }

    if (!hasAffiliateClickColumn && !cancelTokenHash) {
      // Legacy schema has no affiliate click column. Require cancel token fallback
      // so this endpoint does not surface reserve-only locks as "pending purchase".
      continue;
    }

    const item = itemMap.get(candidate.item_id);
    if (!item) {
      continue;
    }

    const expiryIso = hasReservedUntilColumn && candidate.reserved_until
      ? candidate.reserved_until
      : candidate.created_at
        ? new Date(
          new Date(candidate.created_at).getTime() + 24 * 60 * 60 * 1000
        ).toISOString()
        : null;
    const isExpired = expiryIso ? new Date(expiryIso).getTime() <= Date.now() : false;

    if (isExpired) {
      await supabaseAdmin
        .from("reservations")
        .update({
          status: "canceled",
          canceled_at: nowIso,
        })
        .eq("id", candidate.id)
        .eq("status", "reserved");
      continue;
    }

    const resultItem = {
      item_id: item.id,
      title: item.title,
      reserved_until: expiryIso,
      affiliate_click_at: hasAffiliateClickColumn ? candidate.affiliate_click_at ?? null : nowIso,
    };

    // Prefer reservations where the guest already clicked out to a merchant.
    if (resultItem.affiliate_click_at) {
      return NextResponse.json({
        ok: true,
        item: resultItem,
      });
    }

    if (!newestActiveOwnedReservation) {
      newestActiveOwnedReservation = resultItem;
    }
  }

  if (newestActiveOwnedReservation) {
    return NextResponse.json({
      ok: true,
      item: newestActiveOwnedReservation,
    });
  }

  return NextResponse.json({ ok: true, item: null });
}
