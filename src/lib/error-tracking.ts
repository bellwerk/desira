type ErrorTrackingSource = "client" | "server";

export interface ErrorTrackingPayload {
  source: ErrorTrackingSource;
  scope: string;
  message: string;
  name?: string;
  stack?: string;
  digest?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

function serializeError(error: unknown): {
  message: string;
  name?: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return {
    message: typeof error === "string" ? error : "Unknown error",
  };
}

async function forwardToWebhook(payload: ErrorTrackingPayload): Promise<void> {
  const webhookUrl = process.env.ERROR_TRACKING_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        "[error-tracking] webhook forward failed:",
        response.status,
        response.statusText
      );
    }
  } catch (err) {
    console.error("[error-tracking] webhook forward exception:", err);
  }
}

async function sendOpsAlert(payload: ErrorTrackingPayload): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const alertWebhookUrl = process.env.OPS_ALERT_WEBHOOK_URL?.trim();
  if (!alertWebhookUrl) {
    return;
  }

  const title = `[Desira][${payload.scope}] ${payload.message}`.slice(0, 280);
  const alertBody = {
    title,
    scope: payload.scope,
    source: payload.source,
    digest: payload.digest ?? null,
    timestamp: payload.timestamp,
    metadata: payload.metadata ?? {},
  };

  try {
    const response = await fetch(alertWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alertBody),
    });

    if (!response.ok) {
      console.error(
        "[error-tracking] ops alert failed:",
        response.status,
        response.statusText
      );
    }
  } catch (err) {
    console.error("[error-tracking] ops alert exception:", err);
  }
}

export async function trackServerError(
  error: unknown,
  context: {
    scope: string;
    digest?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const serialized = serializeError(error);
  const payload: ErrorTrackingPayload = {
    source: "server",
    scope: context.scope,
    message: serialized.message,
    name: serialized.name,
    stack: serialized.stack,
    digest: context.digest,
    metadata: context.metadata,
    timestamp: new Date().toISOString(),
  };

  console.error("[error-tracking]", JSON.stringify(payload));
  await forwardToWebhook(payload);
  await sendOpsAlert(payload);
}

export function trackClientError(
  error: unknown,
  context: {
    scope: string;
    digest?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const serialized = serializeError(error);
  const payload: ErrorTrackingPayload = {
    source: "client",
    scope: context.scope,
    message: serialized.message,
    name: serialized.name,
    stack: serialized.stack,
    digest: context.digest,
    metadata: context.metadata,
    timestamp: new Date().toISOString(),
  };

  console.error("[error-tracking]", payload);

  void fetch("/api/errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((err: unknown) => {
    console.error("[error-tracking] failed to send client error payload:", err);
  });
}
