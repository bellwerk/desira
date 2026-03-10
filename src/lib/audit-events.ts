/**
 * Shared audit event constants that are safe to import
 * from both server and client modules.
 */
export const AuditEventType = {
  // List events
  LIST_CREATED: "list.created",
  LIST_UPDATED: "list.updated",
  LIST_DELETED: "list.deleted",

  // Item events
  ITEM_CREATED: "item.created",
  ITEM_UPDATED: "item.updated",
  ITEM_DELETED: "item.deleted",

  // Reservation events
  RESERVATION_CREATED: "reservation.created",
  RESERVATION_CANCELED: "reservation.canceled",

  // Contribution events
  CONTRIBUTION_CREATED: "contribution.created",
  CONTRIBUTION_SUCCEEDED: "contribution.succeeded",
  CONTRIBUTION_FAILED: "contribution.failed",

  // Invite events
  INVITE_CREATED: "invite.created",
  INVITE_ACCEPTED: "invite.accepted",

  // Auth events
  AUTH_LOGIN: "auth.login",
  AUTH_LOGOUT: "auth.logout",

  // Public shared page funnel events
  SHARED_LIST_VIEWED: "shared_list.viewed",
  SHARED_ITEM_CONTRIBUTE_CLICKED: "shared_item.contribute_clicked",
  SHARED_ITEM_RESERVE_CLICKED: "shared_item.reserve_clicked",
  SHARED_CREATE_LIST_CTA_CLICKED: "shared_list.create_cta_clicked",
  PRODUCT_LINK_CLICK: "product_link.click",

  // Smart Buy lifecycle events
  GUEST_BUY_TAP: "guest_buy_tap",
  GUEST_RESERVED_SUCCESS: "guest_reserved_success",
  GUEST_RESERVED_CONFLICT: "guest_reserved_conflict",
  GUEST_CANCEL_RESERVATION: "guest_cancel_reservation",
  GUEST_MARK_PURCHASED: "guest_mark_purchased",
  GUEST_BUY_ON_STORE_CLICK: "guest_buy_on_store_click",
  GUEST_BANNER_SHOWN: "guest_banner_shown",
  RESERVATION_EXPIRED: "reservation_expired",
  GUEST_CONTRIBUTE_TAP: "guest_contribute_tap",
  GUEST_CONTRIBUTE_SUCCESS: "guest_contribute_success",
  OWNER_BUY_ITEM_CLICK: "owner_buy_item_click",
  OWNER_MARK_RECEIVED: "owner_mark_received",
  OWNER_UNDO_RECEIVED: "owner_undo_received",
} as const;

export type AuditEventType = (typeof AuditEventType)[keyof typeof AuditEventType];
