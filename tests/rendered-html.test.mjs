import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
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
}

test("server-renders the v3 pricing configurator", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>INOX Smart SaaS Quoting Tool<\/title>/i);
  assert.match(html, /SaaS Quoting Tool/);
  assert.match(html, /INTERNAL USE ONLY/);
  assert.match(html, /3\.0 preview/);
  assert.match(html, /src="\/brand\/inox-smart-logo-light\.png"/);
  assert.doesNotMatch(html, /_next\/image[^>]*inox-smart-logo-light/);
  assert.match(html, /Capacity needed/);
  assert.match(html, /Select plans/);
  assert.match(html, /Included features/);
  assert.match(html, /Download Quote/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|SkeletonPreview/);
});
