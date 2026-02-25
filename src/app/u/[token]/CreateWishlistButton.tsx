"use client";

import Link from "next/link";
import { AuditEventType } from "@/lib/audit-events";
import type { ExperimentVariant } from "@/lib/experiments";

type CreateWishlistButtonProps = {
  href: string;
  listId: string;
  heroVariant: ExperimentVariant;
  actionLabelVariant: ExperimentVariant;
  className?: string;
  children: React.ReactNode;
};

export function CreateWishlistButton({
  href,
  listId,
  heroVariant,
  actionLabelVariant,
  className,
  children,
}: CreateWishlistButtonProps): React.ReactElement {
  function handleClick(): void {
    void fetch("/api/public-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_type: AuditEventType.SHARED_CREATE_LIST_CTA_CLICKED,
        list_id: listId,
        placement: "footer",
        hero_variant: heroVariant,
        action_label_variant: actionLabelVariant,
      }),
      keepalive: true,
    }).catch(() => {
      // Ignore analytics failures.
    });
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
