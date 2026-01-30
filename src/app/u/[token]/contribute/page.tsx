import { supabaseAdmin } from "@/lib/supabase/admin";
import { ContributeForm } from "@/components/ContributeForm";
import { GlassCard } from "@/components/ui";

// Force dynamic rendering and nodejs runtime for server-side operations
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ item?: string }>;
};

export default async function ContributePage({ params, searchParams }: PageProps): Promise<React.ReactElement> {
  const { token } = await params;
  const { item } = await searchParams;

  if (!item) {
    return (
      <GlassCard className="mx-auto max-w-md text-center py-8">
        <h1 className="text-lg font-semibold text-[#2B2B2B]">Missing item</h1>
        <p className="mt-2 text-sm text-[#62748e]">
          Go back and tap Contribute from the list.
        </p>
      </GlassCard>
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
      <GlassCard className="mx-auto max-w-md text-center py-8">
        <h1 className="text-lg font-semibold text-[#2B2B2B]">List not found</h1>
        <p className="mt-2 text-sm text-[#62748e]">
          That link may be invalid or expired.
        </p>
      </GlassCard>
    );
  }

  if (!list.allow_contributions) {
    return (
      <GlassCard className="mx-auto max-w-md text-center py-8">
        <h1 className="text-lg font-semibold text-[#2B2B2B]">Contributions disabled</h1>
        <p className="mt-2 text-sm text-[#62748e]">
          This list doesn&apos;t accept contributions.
        </p>
      </GlassCard>
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
      <GlassCard className="mx-auto max-w-md text-center py-8">
        <h1 className="text-lg font-semibold text-[#2B2B2B]">Item not found</h1>
        <p className="mt-2 text-sm text-[#62748e]">
          This item may have been removed.
        </p>
      </GlassCard>
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
