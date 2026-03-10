import { supabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";
import { ErrorStateCard, GlassCard } from "@/components/ui";
import { PublicListClient } from "./PublicListClient";
import { CreateWishlistButton } from "./CreateWishlistButton";
import { SharedPageTracker } from "./SharedPageTracker";
import { getExperimentVariant } from "@/lib/experiments";
import type { Metadata } from "next";
import { toPublicUrl } from "@/lib/public-site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

function buildPublicListDescription(list: {
  title: string;
  occasion: string | null;
  recipient_type: string | null;
}): string {
  const recipientLabel =
    list.recipient_type === "person"
      ? "wishlist"
      : list.recipient_type === "group"
      ? "registry"
      : list.recipient_type === "shopping"
      ? "shopping list"
      : "gift list";

  if (list.occasion) {
    return `${list.title} (${list.occasion}) on Desira. Browse items, buy gifts, or contribute to shared goals.`;
  }

  return `${list.title} on Desira. Browse this ${recipientLabel}, buy gifts, or contribute to shared goals.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;

  const { data: list } = await supabaseAdmin
    .from("lists")
    .select("title, occasion, recipient_type, visibility")
    .eq("share_token", token)
    .maybeSingle();

  if (!list || list.visibility === "private") {
    return {
      title: "List not found | Desira",
      description: "This shared list is unavailable.",
    };
  }

  const description = buildPublicListDescription({
    title: list.title,
    occasion: list.occasion,
    recipient_type: list.recipient_type,
  });
  const title = `${list.title} | Desira`;
  const canonicalPath = `/u/${token}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Desira",
      url: toPublicUrl(canonicalPath),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

type ReservationFlag = {
  item_id: string;
  is_reserved: boolean;
};

type ContributionTotal = {
  item_id: string;
  funded_amount_cents: number;
};

type ReservationRow = {
  id: string;
  item_id: string;
  status: string;
  created_at: string | null;
  reserved_until?: string | null;
};

type RawItemRow = {
  id: string;
  title: string;
  image_url: string | null;
  product_url: string | null;
  price_cents: number | null;
  target_amount_cents: number | null;
  note_public: string | null;
  status: "active" | "funded" | "received" | "archived";
  sort_order: number | null;
  most_desired: boolean | null;
};

type ItemRow = Omit<RawItemRow, "product_url"> & {
  has_product_link: boolean;
  store_label: string;
};

function formatEventDate(rawDate: string): string {
  const [y, m, d] = rawDate.split("-").map(Number);
  const eventDate = new Date(y, m - 1, d);
  return eventDate.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
}

function getStoreLabel(productUrl: string | null): string {
  if (!productUrl) {
    return "Store";
  }

  try {
    const host = new URL(productUrl).hostname.replace(/^www\./i, "");
    const root = host.split(".")[0] ?? "store";
    return root.charAt(0).toUpperCase() + root.slice(1);
  } catch {
    return "Store";
  }
}

const RESERVATION_DURATION_HOURS = 24;

function getReservationExpiryIso(reservation: ReservationRow): string | null {
  if (reservation.reserved_until) {
    return reservation.reserved_until;
  }
  if (!reservation.created_at) {
    return null;
  }
  const createdAtMs = new Date(reservation.created_at).getTime();
  if (Number.isNaN(createdAtMs)) {
    return null;
  }
  return new Date(createdAtMs + RESERVATION_DURATION_HOURS * 60 * 60 * 1000).toISOString();
}

export default async function PublicListPage({ params }: PageProps): Promise<React.ReactElement> {
  const { token } = await params;
  const heroVariant = getExperimentVariant(token, "shared-hero-subtitle");
  const actionLabelVariant = getExperimentVariant(token, "shared-action-labels");

  const { data: list, error: listErr } = await supabaseAdmin
    .from("lists")
    .select(
      `
      id,
      title,
      occasion,
      event_date,
      recipient_type,
      allow_reservations,
      allow_contributions,
      allow_anonymous,
      currency,
      visibility,
      owner_id
    `
    )
    .eq("share_token", token)
    .single();

  // Block access if list not found OR if visibility is private
  // Private lists should only be accessible to authenticated members, not via share link
  if (listErr || !list || list.visibility === "private") {
    return (
      <ErrorStateCard
        title="List not found"
        message="That link may be invalid or expired."
        className="py-12"
      />
    );
  }

  // Fetch owner's display name and avatar
  const { data: owner, error: ownerErr } = await supabaseAdmin
    .from("profiles")
    .select("display_name,avatar_url")
    .eq("id", list.owner_id)
    .single();

  const ownerName = ownerErr || !owner ? "User" : owner.display_name || "User";
  const ownerAvatar = ownerErr || !owner ? null : owner.avatar_url;

  const { data: items, error: itemsErr } = await supabaseAdmin
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
      status,
      sort_order,
      most_desired
    `
    )
    .eq("list_id", list.id)
    .order("sort_order", { ascending: true });

  if (itemsErr) {
    return (
      <ErrorStateCard
        title="Failed to load items"
        message="Please try again later."
        className="py-12"
      />
    );
  }

  const rawItems = (items ?? []) as RawItemRow[];
  const typedItems: ItemRow[] = rawItems.map(({ product_url, ...item }) => ({
    ...item,
    has_product_link: typeof product_url === "string" && product_url.trim().length > 0,
    store_label: getStoreLabel(product_url),
  }));
  const listUrl = toPublicUrl(`/u/${token}`);
  const listStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: list.title,
    url: listUrl,
    description: buildPublicListDescription({
      title: list.title,
      occasion: list.occasion,
      recipient_type: list.recipient_type,
    }),
    mainEntity: {
      "@type": "ItemList",
      name: list.title,
      numberOfItems: typedItems.length,
      itemListElement: typedItems.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: item.title,
          url: toPublicUrl(`/api/go/${item.id}?token=${token}`),
        },
      })),
    },
  };
  const itemIds = typedItems.map((i) => i.id);

  let reservedFlags: ReservationFlag[] = [];
  let totals: ContributionTotal[] = [];
  const reservedUntilMap = new Map<string, string | null>();

  if (itemIds.length > 0) {
    const [r1, r2, r3] = await Promise.all([
      supabaseAdmin
        .from("public_reservation_flags")
        .select("item_id,is_reserved")
        .in("item_id", itemIds),
      supabaseAdmin
        .from("public_contribution_totals")
        .select("item_id,funded_amount_cents")
        .in("item_id", itemIds),
      supabaseAdmin
        .from("reservations")
        .select("*")
        .in("item_id", itemIds)
        .eq("status", "reserved")
        .order("created_at", { ascending: false }),
    ]);

    reservedFlags = (r1.data ?? []) as ReservationFlag[];
    totals = (r2.data ?? []) as ContributionTotal[];
    for (const row of (r3.data ?? []) as ReservationRow[]) {
      if (reservedUntilMap.has(row.item_id)) {
        continue;
      }
      const expiryIso = getReservationExpiryIso(row);
      if (!expiryIso) {
        continue;
      }
      reservedUntilMap.set(row.item_id, expiryIso);
    }
  }

  const reservedMap = new Map(reservedFlags.map((r) => [r.item_id, r.is_reserved]));
  const fundedMap = new Map(totals.map((t) => [t.item_id, t.funded_amount_cents]));
  const recipientTypeLabel =
    list.recipient_type === "person"
      ? "Wishlist"
      : list.recipient_type === "group"
      ? "Registry"
      : list.recipient_type === "shopping"
      ? "Collaborative"
      : "Personal";
  const eventDateLabel = list.event_date ? formatEventDate(String(list.event_date)) : null;

  return (
    <div className="flex flex-col pb-8 pt-0 sm:pb-10 sm:pt-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(listStructuredData),
        }}
      />
      <SharedPageTracker
        listId={list.id}
        heroVariant={heroVariant}
        actionLabelVariant={actionLabelVariant}
      />

      <div className="mb-0 flex justify-center sm:mb-0 sm:justify-end">
        <span className="shared-tip-pill inline-flex h-11 w-full max-w-[500px] items-center justify-center gap-1 rounded-full px-3 text-sm font-normal font-[family-name:var(--font-urbanist)] sm:text-[15px]">
          <span aria-hidden>&#10024;</span> Tip: Buy a gift now or contribute toward a big-ticket one.
        </span>
      </div>

      <header className="mb-8 flex flex-col items-center text-center sm:mb-10">
        {ownerAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ownerAvatar}
            alt={ownerName}
            className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20"
          />
        ) : (
          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-white">
            <svg width="57" height="70" viewBox="0 0 57 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 sm:h-11 sm:w-11">
              <path d="M46 37L56.5 46.5L56.5 63L47.5 63L47.3577 51.0001L41.5 45.5L40 42.5L46 37Z" fill="#2B2B2B" stroke="#2B2B2B"/>
              <path d="M11.5 36.5L0.499999 47.5L0.5 63L10 63L10 50.5L15.4545 45.327L18.5 42.5L11.5 36.5Z" fill="#2B2B2B" stroke="#2B2B2B"/>
              <path d="M10.5 51.0017L47 51.0017L52.4998 42.9998L45.9978 36.6255L39.9978 42.3125L18.4981 42.3125L11.4975 36.6255L6 43L10.5 51.0017Z" fill="#2B2B2B" stroke="#2B2B2B"/>
              <path d="M48.6475 11.3386L37.1475 0.500001L24.6475 0.5L24.6475 9.248L33.3091 9.248L39.2465 15.4133L39.2465 20L48.6475 20L48.6475 11.3386Z" fill="#2B2B2B" stroke="#2B2B2B"/>
              <path d="M8.64746 27.1614L20.1475 38L32.6475 38L32.6475 29.252L23.9858 29.252L18.0484 23.0867L18.0484 18.5L8.64746 18.5L8.64746 27.1614Z" fill="#2B2B2B" stroke="#2B2B2B"/>
              <path d="M8.64746 11.0886L20.1475 0.500001L32.6475 0.5L32.6475 9.5L24.1475 9.5L18.0484 15.1633L18.0484 19.75L8.64746 19.75L8.64746 11.0886Z" fill="#2B2B2B" stroke="#2B2B2B"/>
              <path d="M48.6475 27.4114L37.1475 38L24.6475 38L24.6475 29L33.1475 29L39.2465 23.3367L39.2465 18.75L48.6475 18.75L48.6475 27.4114Z" fill="#2B2B2B" stroke="#2B2B2B"/>
            </svg>
          </div>
        )}

        <h1 className="mt-3 font-asul text-[30px] leading-[1.05] tracking-tight text-[#2b2b2b] sm:mt-4 sm:text-[42px] lg:text-[52px]">
          {list.title}
        </h1>
        <p className="mt-2 text-sm font-medium text-[#6b6b6b] font-[family-name:var(--font-urbanist)] sm:text-base">
          Bought gifts stay anonymous, and contributions go to the recipient directly.
        </p>
      </header>

      {typedItems.length === 0 ? (
        <GlassCard className="rounded-[28px] border border-white/50 bg-white/55 py-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100/70">
            <svg
              className="h-8 w-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-medium text-[#2B2B2B]">
            {ownerName} hasn&apos;t added any items yet
          </h2>
          <p className="mt-2 text-sm text-[#4f5f74]">
            Check back soon, or start your own wishlist in under 2 minutes.
          </p>
          <div className="mt-4">
            <Link
              href="/login?next=/app/lists/new"
              className="rounded-full border border-[#2B2B2B]/20 px-4 py-2 text-sm font-medium text-[#2B2B2B] transition-all hover:bg-white/70"
            >
              Create your own wishlist
            </Link>
          </div>
        </GlassCard>
      ) : (
        <PublicListClient
          token={token}
          listId={list.id}
          items={typedItems}
          reservedMap={reservedMap}
          reservedUntilMap={reservedUntilMap}
          fundedMap={fundedMap}
          listAllowReservations={list.allow_reservations ?? true}
          listAllowContributions={list.allow_contributions ?? true}
          currency={list.currency ?? "CAD"}
          actionLabelVariant={actionLabelVariant}
          occasion={list.occasion}
          recipientTypeLabel={recipientTypeLabel}
          eventDateLabel={eventDateLabel}
        />
      )}

      <div className="shared-footer-cta mt-8 rounded-full p-1.5 sm:mt-10 sm:p-2">
        <div className="flex flex-col items-center justify-between gap-3 px-4 py-2 sm:flex-row sm:gap-4 sm:px-6">
          <p className="text-center text-xl font-medium text-white font-asul sm:text-left sm:text-2xl">
            Get the gifts you really want
          </p>
          <CreateWishlistButton
            href="/login?next=/app/lists/new"
            listId={list.id}
            heroVariant={heroVariant}
            actionLabelVariant={actionLabelVariant}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-white px-4 text-base font-semibold text-[#2b2b2b] transition-colors hover:bg-[#f2f2f2] sm:w-auto sm:px-6 font-[family-name:var(--font-urbanist)]"
          >
            Create your list
          </CreateWishlistButton>
        </div>
      </div>
    </div>
  );
}

