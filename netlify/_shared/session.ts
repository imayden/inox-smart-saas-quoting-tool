const encoder = new TextEncoder();

export const SESSION_COOKIE_NAME = "inox_quoting_session";

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signingKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign", "verify"],
  );
}

function randomNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return toBase64Url(bytes);
}

export async function createSessionValue(secret: string) {
  const payload = `v1.${Date.now().toString(36)}.${randomNonce()}`;
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", await signingKey(secret), encoder.encode(payload)),
  );
  return `${payload}.${toBase64Url(signature)}`;
}

export async function hasValidSession(value: string | undefined, secret: string | undefined) {
  if (!value || !secret) return false;

  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;

  const payload = parts.slice(0, 3).join(".");
  try {
    return crypto.subtle.verify(
      "HMAC",
      await signingKey(secret),
      fromBase64Url(parts[3]),
      encoder.encode(payload),
    );
  } catch {
    return false;
  }
}

export function readCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return undefined;
}

export function sessionCookie(value: string, secure: boolean) {
  return [
    `${SESSION_COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}
