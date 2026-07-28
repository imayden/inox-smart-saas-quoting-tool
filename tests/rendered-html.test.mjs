import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
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

test("server-renders the protected root access notice", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Contact Admin - INOX Smart SaaS Quoting Workspace<\/title>/i);
  assert.match(html, /Workspace access required/);
  assert.match(html, /inoxsmartadmin@unisonhardware\.com/);
  assert.doesNotMatch(html, /Capacity needed/);
  assert.doesNotMatch(html, /Download Quote/);
});

test("server-renders pricing workspaces with their fixed visibility", async () => {
  const net = await render("/16E5/NET-pricing");
  const netHtml = await net.text();
  assert.equal(net.status, 200);
  assert.match(netHtml, /<title>NET - INOX Smart SaaS Quoting Workspace<\/title>/i);
  assert.match(netHtml, /SaaS Quoting Workspace/);
  assert.match(netHtml, /Download NET PDF Quote/);
  assert.doesNotMatch(netHtml, /Monthly MSRP/);

  const msrp = await render("/22625/MSRP-pricing");
  const msrpHtml = await msrp.text();
  assert.equal(msrp.status, 200);
  assert.match(msrpHtml, /<title>MSRP - INOX Smart SaaS Quoting Workspace<\/title>/i);
  assert.match(msrpHtml, /Download MSRP PDF Quote/);
  assert.match(msrpHtml, /Monthly MSRP/);
  assert.doesNotMatch(msrpHtml, /Monthly NET/);

  const both = await render("/16E522625/MSRP_w_NET");
  const bothHtml = await both.text();
  assert.equal(both.status, 200);
  assert.match(bothHtml, /<title>MSRP &amp; NET - INOX Smart SaaS Quoting Workspace<\/title>/i);
  assert.match(bothHtml, /Download NET \+ MSRP PDF Quote/);
  assert.match(bothHtml, /Monthly NET/);
  assert.match(bothHtml, /Monthly MSRP/);
  assert.match(bothHtml, /Pricing Version: 20260629/);
  assert.match(bothHtml, /3\.0 by Ayden/);
  assert.match(bothHtml, /src="\/brand\/inox-smart-logo-dark\.png"/);
  assert.doesNotMatch(bothHtml, /_next\/image[^>]*inox-smart-logo-dark/);
  assert.match(bothHtml, /Capacity needed/);
  assert.match(bothHtml, /Compare plans/);
  assert.match(bothHtml, /Plan details/);
  assert.doesNotMatch(bothHtml, /codex-preview|Your site is taking shape|SkeletonPreview/);
});
