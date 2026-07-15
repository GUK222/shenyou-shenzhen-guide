"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapPin, SpinnerGap } from "@phosphor-icons/react";
import type { Language } from "./bilingual";
import type { Place } from "./data";
import { guideFor, pick } from "./bilingual";
import { travelDetailFor } from "./travel-data";

export function CityMap({
  places,
  language,
  onOpen,
}: {
  places: Place[];
  language: Language;
  onOpen: (place: Place) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onOpenRef = useRef(onOpen);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => undefined;

    async function mountMap() {
      if (!hostRef.current) return;
      try {
        const L = await import("leaflet");
        if (disposed || !hostRef.current) return;
        const map = L.map(hostRef.current, {
          zoomControl: false,
          attributionControl: true,
          minZoom: 9,
        });
        L.control.zoom({ position: "bottomright" }).addTo(map);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution: "© OpenStreetMap",
        }).addTo(map);

        const bounds: [number, number][] = [];
        places.forEach((place) => {
          const detail = travelDetailFor(place.id);
          const guide = guideFor(place.id);
          if (!detail || !guide) return;
          bounds.push([detail.lat, detail.lng]);
          const marker = L.circleMarker([detail.lat, detail.lng], {
            radius: 9,
            color: "#f4f8f6",
            weight: 3,
            fillColor: "#087f75",
            fillOpacity: 1,
          }).addTo(map);
          marker.bindTooltip(
            `<strong>${pick(language, guide.titleZh, guide.titleKo)}</strong><br><span>${pick(language, guide.districtZh, guide.districtKo)}</span>`,
            { direction: "top", offset: [0, -10], opacity: 0.96 },
          );
          marker.on("click", () => onOpenRef.current(place));
        });
        if (bounds.length) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 11 });
        else map.setView([22.5431, 114.0579], 10);
        setReady(true);
        cleanup = () => map.remove();
      } catch {
        setFailed(true);
      }
    }

    mountMap();
    return () => {
      disposed = true;
      cleanup();
    };
  }, [language, places]);

  return (
    <div className="relative min-h-[54dvh] overflow-hidden rounded-2xl bg-[var(--field)]">
      <div ref={hostRef} className="absolute inset-0 z-0" aria-label={pick(language, "深圳景点地图", "선전 명소 지도")} />
      {!ready && !failed && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[var(--field)] text-[var(--muted)]">
          <div className="text-center">
            <SpinnerGap size={26} className="mx-auto animate-spin text-[var(--accent)]" />
            <p className="mt-3 text-sm">{pick(language, "正在加载地图", "지도를 불러오는 중")}</p>
          </div>
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[var(--field)] px-8 text-center">
          <div>
            <MapPin size={30} className="mx-auto text-[var(--accent)]" />
            <h3 className="mt-3 font-semibold">{pick(language, "地图暂时无法加载", "지도를 불러올 수 없습니다")}</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              {pick(language, "仍可使用下方区域列表和景点导航。", "아래 지역 목록과 명소 길찾기는 계속 사용할 수 있습니다.")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
