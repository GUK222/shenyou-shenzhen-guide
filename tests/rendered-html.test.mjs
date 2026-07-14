import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Shenzhen tour guide mobile app", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /SHENYOU · 深圳解说/);
  assert.match(html, /把深圳景点，装进口袋里/);
  assert.match(html, /搜索景点、讲解或区域/);
  assert.match(html, /南头古城/);
  assert.match(html, /深圳湾北湾鹭港/);
  assert.match(html, /华强北/);
  assert.match(html, /欢乐港湾/);
  assert.match(html, /深圳湾文化广场/);
  assert.match(html, /卓悦中心/);
  assert.match(html, /18 个景点/);
  assert.doesNotMatch(html, /上海|徐汇|华侨城创意园咖啡|福田 CBD 屋顶放映/);
  assert.doesNotMatch(html, /SkeletonPreview|react-loading-skeleton|codex-preview/);
});
