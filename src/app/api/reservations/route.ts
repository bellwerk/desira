import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";
import { POST as reserveGift } from "@/app/api/gifts/[id]/reserve/route";

export const runtime = "nodejs";

const CreateSchema = z.object({
  item_id: z.string().uuid(),
  reserved_by_name: z.string().trim().max(80).optional(),
  reserved_by_email: z.string().trim().email().max(120).optional(),
  device_token: z.string().uuid().optional(),
  share_token: z.string().min(1).max(200).optional(),
});

const CancelSchema = z.object({
  reservation_id: z.string().uuid(),
  cancel_token: z.string().min(10).max(200),
  device_token: z.string().uuid().optional(),
});

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

// POST /api/reservations -> create reservation
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { item_id, device_token, share_token } = parsed.data;

  if (!device_token || !share_token) {
    return NextResponse.json(
      {
        error:
          "This endpoint now requires both device_token and share_token. Use /api/gifts/[id]/reserve.",
      },
      { status: 400 }
    );
  }

  const proxiedReq = new Request(req.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: req.headers.get("cookie") ?? "",
      "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "",
      "x-real-ip": req.headers.get("x-real-ip") ?? "",
    },
    body: JSON.stringify({
      deviceToken: device_token,
      share_token,
    }),
  });

  const reserveRes = await reserveGift(proxiedReq, {
    params: Promise.resolve({ id: item_id }),
  });
  const reserveJson = await reserveRes.json().catch(() => null);

  if (!reserveRes.ok) {
    return NextResponse.json(
      reserveJson ?? { error: "Failed to create reservation" },
      { status: reserveRes.status }
    );
  }

  return NextResponse.json({
    ok: true,
    reservation_id: reserveJson?.reservation_id ?? null,
    reservation: reserveJson?.reservation_id
      ? {
          id: reserveJson.reservation_id,
          item_id,
          status: reserveJson.status ?? "reserved",
          created_at: null,
        }
      : null,
    cancel_token: reserveJson?.cancel_token ?? null,
    reserved_until: reserveJson?.reserved_until ?? null,
    already_reserved: Boolean(reserveJson?.already_reserved),
  });
}

// PATCH /api/reservations -> cancel reservation (requires cancel token)
export async function PATCH(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = CancelSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { reservation_id, cancel_token, device_token } = parsed.data;
  const hash = sha256(cancel_token);

  const { data: r, error: rErr } = await supabaseAdmin
    .from("reservations")
    .select("id,status,cancel_token_hash,device_token_hash")
    .eq("id", reservation_id)
    .single();

  if (rErr || !r) {
    return NextResponse.json({ error: "Buy mark not found" }, { status: 404 });
  }

  if (r.status !== "reserved") {
    return NextResponse.json({ error: "Buy mark is not cancelable" }, { status: 409 });
  }

  if (!r.cancel_token_hash || r.cancel_token_hash !== hash) {
    return NextResponse.json({ error: "Invalid cancel token" }, { status: 403 });
  }

  if (r.device_token_hash) {
    if (!device_token || sha256(device_token) !== r.device_token_hash) {
      return NextResponse.json(
        { error: "This buy mark can only be changed from the same browser/device" },
        { status: 403 }
      );
    }
  }

  const { data: updated, error: upErr } = await supabaseAdmin
    .from("reservations")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("id", reservation_id)
    .select("id,status")
    .single();

  if (upErr || !updated) {
    return NextResponse.json({ error: "Failed to remove buy mark" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reservation: updated });
}
