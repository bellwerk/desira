import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const BugReportSchema = z.object({
  category: z.enum(["bug", "ui", "payments", "other"]).default("bug"),
  summary: z.string().trim().min(10).max(160),
  details: z.string().trim().min(20).max(4000),
  page: z.string().trim().max(300).optional(),
});

async function forwardBugReport(payload: Record<string, unknown>): Promise<void> {
  const webhookUrl = process.env.BUG_REPORT_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        "[bug-report] webhook forward failed:",
        response.status,
        response.statusText
      );
    }
  } catch (err) {
    console.error("[bug-report] webhook forward exception:", err);
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Please sign in to report a bug." },
      },
      { status: 401 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = BugReportSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_PAYLOAD", message: "Invalid bug report payload." },
      },
      { status: 400 }
    );
  }

  const reportId = crypto.randomUUID();

  const payload = {
    report_id: reportId,
    user_id: user.id,
    category: parsed.data.category,
    summary: parsed.data.summary,
    details: parsed.data.details,
    page: parsed.data.page ?? null,
    created_at: new Date().toISOString(),
  };

  await forwardBugReport(payload);

  return NextResponse.json({
    ok: true,
    reportId,
  });
}
