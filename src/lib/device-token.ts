const DEVICE_TOKEN_STORAGE_KEY = "desira_device_token";
const DEVICE_TOKEN_COOKIE_KEY = "desira_device_token";
const DEVICE_TOKEN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2;

function isValidDeviceToken(value: string | null | undefined): value is string {
  return typeof value === "string" && value.length >= 20 && value.length <= 120;
}

function readCookieToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookiePrefix = `${DEVICE_TOKEN_COOKIE_KEY}=`;
  const parts = document.cookie.split(";").map((part) => part.trim());
  const entry = parts.find((part) => part.startsWith(cookiePrefix));
  if (!entry) {
    return null;
  }

  const rawValue = entry.slice(cookiePrefix.length);
  try {
    const decoded = decodeURIComponent(rawValue);
    return isValidDeviceToken(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function writeCookieToken(token: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie =
    `${DEVICE_TOKEN_COOKIE_KEY}=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=${DEVICE_TOKEN_COOKIE_MAX_AGE_SECONDS}` +
    (secure ? "; Secure" : "");
}

function readStorageToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const token = window.localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
    return isValidDeviceToken(token) ? token : null;
  } catch {
    return null;
  }
}

function writeStorageToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore storage failures and rely on cookie fallback.
  }
}

function createDeviceToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Last-resort fallback that still matches UUID shape.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getOrCreateDeviceToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const fromStorage = readStorageToken();
  if (fromStorage) {
    writeCookieToken(fromStorage);
    return fromStorage;
  }

  const fromCookie = readCookieToken();
  if (fromCookie) {
    writeStorageToken(fromCookie);
    return fromCookie;
  }

  const created = createDeviceToken();
  writeStorageToken(created);
  writeCookieToken(created);
  return created;
}
