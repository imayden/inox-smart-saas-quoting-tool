import { mkdir, writeFile } from "node:fs/promises";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("static-export", Date.now().toString());
const { default: worker } = await import(workerUrl.href);

const pages = [
  { pathname: "/", output: "index.html", expectedText: "Choose a pricing workspace" },
  {
    pathname: "/16E5/NET-pricing",
    output: "16E5/NET-pricing/index.html",
    expectedText: "Download NET PDF Quote",
  },
  {
    pathname: "/22625/MSRP-pricing",
    output: "22625/MSRP-pricing/index.html",
    expectedText: "Download MSRP PDF Quote",
  },
  {
    pathname: "/16E522625/MSRP_w_NET",
    output: "16E522625/MSRP_w_NET/index.html",
    expectedText: "Download NET + MSRP PDF Quote",
  },
];

for (const page of pages) {
  const response = await worker.fetch(
    new Request(`http://localhost${page.pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  if (!response.ok) {
    throw new Error(`Static export failed for ${page.pathname} with HTTP ${response.status}.`);
  }

  const html = await response.text();
  if (!html.includes("INOX Smart SaaS Quoting Tool") || !html.includes(page.expectedText)) {
    throw new Error(`Static export did not contain the expected ${page.pathname} page.`);
  }

  const destination = new URL(`../dist/client/${page.output}`, import.meta.url);
  await mkdir(new URL("./", destination), { recursive: true });
  await writeFile(destination, html, "utf8");
}

console.log("Static Netlify pages created for the root and all pricing workspaces.");
