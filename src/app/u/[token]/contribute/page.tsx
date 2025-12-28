import { supabaseAdmin } from "@/lib/supabase/admin";
import { ContributeForm } from "@/components/ContributeForm";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ item?: string }>;
};

export default async function ContributePage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { item } = await searchParams;

  if (!item) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Missing item</h1>
        <p>Go back and tap Contribute from the list.</p>
      </main>
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
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>List not found</h1>
      </main>
    );
  }

  if (!list.allow_contributions) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Contributions disabled</h1>
        <p>This list doesn’t accept contributions.</p>
      </main>
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
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Item not found</h1>
      </main>
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
