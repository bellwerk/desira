"use client";

import { useEffect } from "react";
import { AuditEventType } from "@/lib/audit-events";
import type { ExperimentVariant } from "@/lib/experiments";

type SharedPageTrackerProps = {
  listId: string;
  heroVariant: ExperimentVariant;
  actionLabelVariant: ExperimentVariant;
};

export function SharedPageTracker({
  listId,
  heroVariant,
  actionLabelVariant,
}: SharedPageTrackerProps): React.ReactElement | null {
  useEffect(() => {
    void fetch("/api/public-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_type: AuditEventType.SHARED_LIST_VIEWED,
        list_id: listId,
        hero_variant: heroVariant,
        action_label_variant: actionLabelVariant,
      }),
      keepalive: true,
    }).catch(() => {
      // Ignore analytics failures.
    });
  }, [actionLabelVariant, heroVariant, listId]);

  return null;
}
