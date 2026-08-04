import { createSessionValue, sessionCookie } from "../_shared/session";

declare const Netlify: { env: { get(name: string): string | undefined } };

const devSharePointEntry = async () => {
  const isDevelopment = Netlify.env.get("CONTEXT") === "dev" || process.env.CONTEXT === "dev";
  if (!isDevelopment) return new Response("Not found", { status: 404 });

  const sessionSecret = Netlify.env.get("QUOTING_SESSION_SECRET") ?? process.env.QUOTING_SESSION_SECRET;
  if (!sessionSecret) return new Response("Local access service is unavailable.", { status: 503 });

  return new Response(null, {
    headers: {
      "Cache-Control": "no-store",
      Location: "/quoting",
      "Set-Cookie": sessionCookie(await createSessionValue(sessionSecret), false),
    },
    status: 302,
  });
};

export default devSharePointEntry;

export const config = { path: "/__dev/sharepoint-entry" };
