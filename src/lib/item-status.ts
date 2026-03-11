export function isReceivedItemStatus(status: string): boolean {
  return status === "received" || status === "archived";
}
