import {
  createSessionValue,
  sessionCookie,
} from "../_shared/session";

declare const Netlify: { env: { get(name: string): string | undefined } };

const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const FAILURE_DELAY_MS = 650;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function json(body: Record<string, string>, status: number, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
    status,
  });
}

function clientKey(request: Request) {
  return (request.headers.get("x-nf-client-connection-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown")
    .split(",")[0]
    .trim();
}

function isDevelopment() {
  return Netlify.env.get("CONTEXT") === "dev" || process.env.CONTEXT === "dev";
}

async function hasMatchingPassword(input: string, expected: string) {
  const [inputHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(expected)),
  ]);
  const left = new Uint8Array(inputHash);
  const right = new Uint8Array(expectedHash);
  let difference = left.length ^ right.length;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

function registerFailure(key: string) {
  const now = Date.now();
  const current = failedAttempts.get(key);
  const next = current && current.resetAt > now
    ? { count: current.count + 1, resetAt: current.resetAt }
    : { count: 1, resetAt: now + ATTEMPT_WINDOW_MS };
  failedAttempts.set(key, next);
  return next;
}

const quotingLogin = async (request: Request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, { Allow: "POST" });

  const key = clientKey(request);
  const existing = failedAttempts.get(key);
  if (existing && existing.resetAt > Date.now() && existing.count >= MAX_FAILED_ATTEMPTS) {
    return json({ error: "Too many attempts. Please wait and try again." }, 429, { "Retry-After": "600" });
  }

  let password = "";
  try {
    const body = await request.json() as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return json({ error: "Please enter the access code and try again." }, 400);
  }

  const accessPassword = Netlify.env.get("QUOTING_ACCESS_PASSWORD") ?? process.env.QUOTING_ACCESS_PASSWORD;
  const sessionSecret = Netlify.env.get("QUOTING_SESSION_SECRET") ?? process.env.QUOTING_SESSION_SECRET;
  if (!accessPassword || !sessionSecret) return json({ error: "Access service is unavailable. Please contact the administrator." }, 503);

  if (password.length > 200 || !(await hasMatchingPassword(password, accessPassword))) {
    const failure = registerFailure(key);
    await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
    if (failure.count >= MAX_FAILED_ATTEMPTS) {
      return json({ error: "Too many attempts. Please wait and try again." }, 429, { "Retry-After": "600" });
    }
    return json({ error: "The access code is incorrect. Please try again." }, 401);
  }

  failedAttempts.delete(key);
  const session = await createSessionValue(sessionSecret);
  return json(
    { ok: "Access granted." },
    200,
    { "Set-Cookie": sessionCookie(session, !isDevelopment()) },
  );
};

export default quotingLogin;

export const config = { path: "/api/quoting-login" };
