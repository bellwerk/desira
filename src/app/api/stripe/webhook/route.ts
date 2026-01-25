import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAuditEvent, AuditEventType } from "@/lib/audit";
import {
  createNotification,
  getListOwnerId,
  NotificationType,
} from "@/lib/notifications";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function rawBody(req: Request) {
  const ab = await req.arrayBuffer();
  return Buffer.from(ab);
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });

  let event: Stripe.Event;
  try {
    const body = await rawBody(req);
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: unknown) {
    return new Response(`Signature verification failed: ${errorMessage(err)}`, {
      status: 400,
    });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response("ok", { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const currency = session.currency?.toUpperCase() ?? null;
  const itemId = session.metadata?.item_id ?? null;

  const contributionCents = Number(session.metadata?.contribution_cents ?? "NaN");
  let feeCents = Number(session.metadata?.fee_cents ?? "NaN");
  let totalCents = Number(session.metadata?.total_cents ?? "NaN");

  const amountTotal = session.amount_total ?? null;

  if (!paymentIntentId || !currency || !itemId) {
    return new Response("Missing required metadata", { status: 400 });
  }

  if (!Number.isFinite(contributionCents) || contributionCents <= 0) {
    return new Response("Invalid contribution amount", { status: 400 });
  }

  // fallbacks
  if (!Number.isFinite(totalCents) || totalCents <= 0) {
    if (amountTotal != null) totalCents = amountTotal;
  }
  if (!Number.isFinite(feeCents) || feeCents < 0) {
    if (Number.isFinite(totalCents) && totalCents > 0) {
      feeCents = Math.max(totalCents - contributionCents, 0);
    } else {
      feeCents = 0;
    }
  }

  const { data: insertedContribution, error: insErr } = await supabaseAdmin
    .from("contributions")
    .insert({
      item_id: itemId,
      amount_cents: Math.round(contributionCents),
      fee_cents: Math.round(feeCents),
      total_cents: Math.round(totalCents),
      currency,
      contributor_name: session.metadata?.contributor_name || null,
      message: session.metadata?.message || null,
      is_anonymous: session.metadata?.is_anonymous === "1",
      payment_status: "succeeded",
      provider: "stripe",
      provider_payment_intent_id: paymentIntentId,
    })
    .select("id")
    .single();

  if (insErr) {
    if (insErr.code === "23505") return new Response("ok", { status: 200 });
    return new Response(`DB insert failed: ${insErr.message}`, { status: 500 });
  }

  // Log audit event for successful contribution (fire-and-forget)
  void logAuditEvent({
    eventType: AuditEventType.CONTRIBUTION_SUCCEEDED,
    actorType: "webhook",
    resourceType: "contribution",
    resourceId: insertedContribution.id,
    metadata: {
      item_id: itemId,
      payment_intent_id: paymentIntentId,
      amount_cents: contributionCents,
      fee_cents: feeCents,
      currency,
    },
  });

  // Notify list owner about the contribution (fire-and-forget)
  void (async () => {
    // Get item to find list_id and title
    const { data: itemData } = await supabaseAdmin
      .from("items")
      .select("list_id, title")
      .eq("id", itemId)
      .single();

    if (itemData) {
      const ownerId = await getListOwnerId(itemData.list_id);
      if (ownerId) {
        const amountFormatted = (contributionCents / 100).toFixed(2);
        // Respect anonymity: hide contributor name when is_anonymous is set
        const isAnonymous = session.metadata?.is_anonymous === "1";
        const contributorName = isAnonymous
          ? "Someone"
          : session.metadata?.contributor_name || "Someone";

        await createNotification({
          userId: ownerId,
          type: NotificationType.CONTRIBUTION_RECEIVED,
          title: "Contribution received",
          body: `${contributorName} contributed $${amountFormatted} ${currency} to "${itemData.title}"`,
          link: `/app/lists/${itemData.list_id}`,
          metadata: {
            list_id: itemData.list_id,
            item_id: itemId,
            contribution_id: insertedContribution.id,
            amount_cents: contributionCents,
            currency,
          },
        });
      }
    }
  })();

  return new Response("ok", { status: 200 });
}
