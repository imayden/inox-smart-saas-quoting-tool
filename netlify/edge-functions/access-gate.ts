import {
  createSessionValue,
  hasValidSession,
  readCookie,
  SESSION_COOKIE_NAME,
  sessionCookie,
} from "../_shared/session.ts";

declare const Netlify: { env: { get(name: string): string | undefined } };

const SHAREPOINT_HOSTNAME = "unisonhardware.sharepoint.com";
// Netlify rewrites /access to its generated static entry point before the Edge
// handler runs, so both request forms must remain public to prevent a loop.
const UNPROTECTED_PATHS = new Set(["/access", "/access/", "/access/index.html"]);

function isHtmlRequest(request: Request, pathname: string) {
  return pathname.endsWith(".html") || (request.headers.get("accept") ?? "").includes("text/html");
}

function isSharePointReferer(request: Request) {
  const referer = request.headers.get("referer");
  if (!referer) return false;

  try {
    const source = new URL(referer);
    return source.protocol === "https:" && source.hostname === SHAREPOINT_HOSTNAME;
  } catch {
    return false;
  }
}

function isDevelopment() {
  return Netlify.env.get("CONTEXT") === "dev";
}

function applyHtmlSecurityHeaders(response: Response) {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

const accessGate = async (request: Request, context: { next(): Promise<Response> }) => {
  const url = new URL(request.url);
  const { pathname } = url;

  if (
    !isHtmlRequest(request, pathname) ||
    pathname.startsWith("/.netlify/") ||
    pathname.startsWith("/api/")
  ) {
    return context.next();
  }

  if (UNPROTECTED_PATHS.has(pathname)) {
    return applyHtmlSecurityHeaders(await context.next());
  }

  const sessionSecret = Netlify.env.get("QUOTING_SESSION_SECRET");
  const existingSession = readCookie(request, SESSION_COOKIE_NAME);
  if (await hasValidSession(existingSession, sessionSecret)) {
    return applyHtmlSecurityHeaders(await context.next());
  }

  if (sessionSecret && isSharePointReferer(request)) {
    const response = applyHtmlSecurityHeaders(await context.next());
    response.headers.append("Set-Cookie", sessionCookie(await createSessionValue(sessionSecret), !isDevelopment()));
    return response;
  }

  return Response.redirect(new URL("/access", request.url), 302);
};

export default accessGate;

export const config = { path: "/*" };
