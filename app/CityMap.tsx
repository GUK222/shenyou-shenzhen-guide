"use client";

import { useState } from "react";
import { MapPin, NavigationArrow } from "@phosphor-icons/react";
import type { Language } from "./bilingual";
import type { Place } from "./data";
import { guideFor, pick } from "./bilingual";
import { travelDetailFor } from "./travel-data";

export type MainlandMapProvider = "amap" | "baidu";

export function mainlandMapUrl(
  place: Pick<Place, "id" | "title">,
  provider: MainlandMapProvider,
) {
  const detail = travelDetailFor(place.id);
  const title = encodeURIComponent(place.title);
  if (!detail) return "https://www.amap.com/";
  if (provider === "baidu") {
    return `https://api.map.baidu.com/marker?location=${detail.lat},${detail.lng}&title=${title}&content=${title}&coord_type=wgs84&output=html&src=webapp.shenyou.guide`;
  }
  return `https://uri.amap.com/marker?position=${detail.lng},${detail.lat}&name=${title}&src=shenyou&coordinate=wgs84&callnative=1`;
}

const MAP_BOUNDS = {
  minLat: 22.45,
  maxLat: 22.72,
  minLng: 113.78,
  maxLng: 114.65,
};

function markerPosition(place: Place) {
  const detail = travelDetailFor(place.id);
  if (!detail) return { left: "50%", top: "50%" };
  const x = (detail.lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng);
  const y = (MAP_BOUNDS.maxLat - detail.lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);
  return {
    left: `${Math.min(92, Math.max(8, x * 84 + 8))}%`,
    top: `${Math.min(84, Math.max(16, y * 68 + 16))}%`,
  };
}

export function CityMap({
  places,
  language,
}: {
  places: Place[];
  language: Language;
}) {
  const [provider, setProvider] = useState<MainlandMapProvider>("amap");
  const providerName = provider === "amap" ? pick(language, "高德地图", "가오더 지도") : pick(language, "百度地图", "바이두 지도");

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-4">
        <div>
          <p className="text-[11px] font-semibold text-[var(--accent)]">
            {pick(language, "中国大陆地图导航", "중국 본토 지도 길찾기")}
          </p>
          <h2 className="mt-1 text-base font-semibold">
            {pick(language, "选择地图后点景点标记", "지도를 선택한 뒤 명소 표시를 누르세요")}
          </h2>
        </div>
        <NavigationArrow size={22} weight="fill" className="shrink-0 text-[var(--accent)]" />
      </div>

      <div className="grid grid-cols-2 gap-2 p-3" role="group" aria-label={pick(language, "选择地图软件", "지도 앱 선택")}>
        {([
          ["amap", "高德地图", "가오더 지도"],
          ["baidu", "百度地图", "바이두 지도"],
        ] as const).map(([id, zh, ko]) => (
          <button
            key={id}
            onClick={() => setProvider(id)}
            aria-pressed={provider === id}
            className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition active:scale-[.98] ${provider === id ? "bg-[var(--ink)] text-[var(--surface)]" : "bg-[var(--field)] text-[var(--muted)]"}`}
          >
            {pick(language, zh, ko)}
          </button>
        ))}
      </div>

      <div
        className="relative mx-3 min-h-[390px] overflow-hidden rounded-2xl bg-[linear-gradient(145deg,color-mix(in_srgb,var(--soft)_86%,var(--surface)),var(--field))]"
        aria-label={pick(language, "深圳景点分布示意", "선전 명소 분포 안내")}
      >
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,var(--line)_1px,transparent_1px),linear-gradient(to_bottom,var(--line)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute -bottom-20 -right-12 h-64 w-64 rounded-full border-[42px] border-[var(--surface)] opacity-60" />
        <span className="absolute left-5 top-5 text-[10px] font-semibold tracking-[.18em] text-[var(--muted)]">SHENZHEN</span>
        <span className="absolute bottom-5 right-5 text-[10px] text-[var(--muted)]">{pick(language, "大鹏方向", "다펑 방향")} →</span>

        {places.map((place) => {
          const guide = guideFor(place.id);
          const title = guide ? pick(language, guide.titleZh, guide.titleKo) : place.title;
          return (
            <a
              key={place.id}
              href={mainlandMapUrl(place, provider)}
              target="_blank"
              rel="noreferrer"
              style={{ ...markerPosition(place), zIndex: place.id + 1 }}
              className="absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-[var(--surface)] bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_7px_18px_rgba(7,60,54,.25)] transition hover:scale-110 active:scale-90"
              aria-label={pick(language, `用${providerName}打开${title}`, `${providerName}에서 ${title} 열기`)}
              title={title}
            >
              <MapPin size={18} weight="fill" />
            </a>
          );
        })}
      </div>

      <div className="flex items-start gap-2 p-4 text-xs leading-5 text-[var(--muted)]">
        <MapPin size={15} className="mt-0.5 shrink-0 text-[var(--accent)]" />
        <p>
          {pick(
            language,
            `点标记将打开${providerName}。位置为分布示意，请以地图软件的实时路线为准。`,
            `표시를 누르면 ${providerName}가 열립니다. 위치는 분포 안내이며 실시간 경로는 지도 앱을 확인하세요.`,
          )}
        </p>
      </div>
    </section>
  );
}
