import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const request = new Request("http://localhost/", { headers: { accept: "text/html" } });
  return typeof worker.fetch === "function"
    ? worker.fetch(request, { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} })
    : worker(request);
}

test("server-renders the Shenzhen tour guide mobile app", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /SHENYOU \/ 深圳解说/);
  assert.match(html, /今天，从哪一段深圳开始/);
  assert.match(html, /从海风里，读懂深圳/);
  assert.match(html, /今天怎么逛/);
  assert.match(html, /18 个中韩双语景点/);
  assert.match(html, /4 条建议路线/);
  assert.match(html, /福田城市中轴/);
  assert.match(html, /深圳湾滨海线/);
  assert.match(html, /甘坑客家人文/);
  assert.match(html, /大鹏山海线/);
  assert.match(html, /南头古城/);
  assert.match(html, /深圳湾北湾鹭港/);
  assert.match(html, /华强北/);
  assert.match(html, /海上世界/);
  assert.doesNotMatch(html, /上海|徐汇|华侨城创意园咖啡|福田 CBD 屋顶放映/);
  assert.doesNotMatch(html, /SkeletonPreview|react-loading-skeleton|codex-preview/);
});

test("contains the complete Shenzhen dataset and mobile app shell", async () => {
  const data = await readFile(new URL("../app/data.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const bilingualModule = await readFile(new URL("../app/bilingual.ts", import.meta.url), "utf8");
  const bilingual = JSON.parse(await readFile(new URL("../app/bilingual-data.json", import.meta.url), "utf8"));
  const manifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  const serviceWorker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");

  for (const title of [
    "南头古城", "深圳湾北湾鹭港", "甘坑古镇", "莲花山公园", "华强北", "东门夜市",
    "深圳平安金融中心", "深圳杨梅坑", "锦绣中华", "二十四史书院", "玛丝菲尔",
    "深圳湾文化广场", "云海天使湾", "海上世界", "欢乐海岸", "欢乐港湾", "市民广场", "卓悦中心",
  ]) assert.match(data, new RegExp(title));

  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.short_name, "深游");
  assert.match(serviceWorker, /CACHE_NAME = "shenyou-v4"/);
  assert.doesNotMatch(data, /上海|徐汇/);
  assert.equal(bilingual.places.length, 18);
  assert.equal(bilingual.places.reduce((sum, place) => sum + place.zh.length, 0), 204);
  assert.equal(bilingual.places.reduce((sum, place) => sum + place.ko.length, 0), 214);
  assert.ok(bilingual.places.every((place) => /[가-힣]/.test(place.ko.join(" "))));
  assert.match(bilingualModule, /Language = "zh" \| "ko"/);
  assert.match(page, /\["zh", "ko"\]/);
  assert.doesNotMatch(page, /speechSynthesis|SpeechSynthesisUtterance|Headphones|播放完整讲解|中文语音|한국어 음성|"dual"/);
});
