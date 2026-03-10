const DEFAULT_RESERVATION_HOURS = 24;

type TokenReservations = Map<string, number>;

const localReservationOwnership = new Map<string, TokenReservations>();

function pruneExpired(nowMs: number): void {
  for (const [tokenHash, reservations] of localReservationOwnership) {
    for (const [itemId, expiresAtMs] of reservations) {
      if (expiresAtMs <= nowMs) {
        reservations.delete(itemId);
      }
    }

    if (reservations.size === 0) {
      localReservationOwnership.delete(tokenHash);
    }
  }
}

function parseExpiry(reservedUntilIso: string | null | undefined, holdHours: number): number {
  if (reservedUntilIso) {
    const parsed = new Date(reservedUntilIso).getTime();
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return Date.now() + holdHours * 60 * 60 * 1000;
}

export function getFallbackReservationCount(tokenHash: string): number {
  const nowMs = Date.now();
  pruneExpired(nowMs);
  return localReservationOwnership.get(tokenHash)?.size ?? 0;
}

export function hasFallbackReservation(tokenHash: string, itemId: string): boolean {
  const nowMs = Date.now();
  pruneExpired(nowMs);
  const reservations = localReservationOwnership.get(tokenHash);
  if (!reservations) {
    return false;
  }

  const expiresAtMs = reservations.get(itemId);
  if (typeof expiresAtMs !== "number") {
    return false;
  }

  return expiresAtMs > nowMs;
}

export function trackFallbackReservation(
  tokenHash: string,
  itemId: string,
  reservedUntilIso?: string | null,
  holdHours = DEFAULT_RESERVATION_HOURS
): void {
  const nowMs = Date.now();
  pruneExpired(nowMs);

  const reservations = localReservationOwnership.get(tokenHash) ?? new Map<string, number>();
  reservations.set(itemId, parseExpiry(reservedUntilIso, holdHours));
  localReservationOwnership.set(tokenHash, reservations);
}

export function clearFallbackReservation(tokenHash: string, itemId: string): void {
  const nowMs = Date.now();
  pruneExpired(nowMs);

  const reservations = localReservationOwnership.get(tokenHash);
  if (!reservations) {
    return;
  }

  reservations.delete(itemId);
  if (reservations.size === 0) {
    localReservationOwnership.delete(tokenHash);
  }
}
