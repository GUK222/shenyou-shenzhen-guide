"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowClockwise,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookmarkSimple,
  CalendarDots,
  CheckCircle,
  Clock,
  Compass,
  DownloadSimple,
  Footprints,
  House,
  Info,
  MapPin,
  MapTrifold,
  ListBullets,
  MagnifyingGlass,
  NavigationArrow,
  NotePencil,
  Plus,
  ShareNetwork,
  Shuffle,
  SquaresFour,
  Trash,
  Translate,
  UploadSimple,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import {
  categories,
  getPlace,
  places,
  tourRoutes,
  type Place,
  type TourRoute,
} from "./data";
import {
  guideFor,
  guidePlaces,
  pick,
  routeKorean,
  type Language,
} from "./bilingual";

type Tab = "home" | "discover" | "routes" | "planner" | "saved";
type SavedView = "favorites" | "visited" | "notes";
type PlaceView = "grid" | "list";

type AppState = {
  language: Language;
  saved: number[];
  visited: number[];
  recent: number[];
  plan: number[];
  notes: Record<string, string>;
  activeRouteId: string | null;
  routeProgress: Record<string, number[]>;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "shenyou-app-v3";
const OLD_STORAGE_KEY = "shenyou-app-v2";
const BASE_PATH = typeof window !== "undefined" && window.location.pathname.startsWith("/shenyou-shenzhen-guide")
  ? "/shenyou-shenzhen-guide"
  : "";
const defaultState: AppState = {
  language: "zh",
  saved: [],
  visited: [],
  recent: [],
  plan: [],
  notes: {},
  activeRouteId: null,
  routeProgress: {},
};
const featuredPlaceIds = [1, 2, 5, 14];

const routeTone: Record<TourRoute["tone"], string> = {
  bay: "route-bay",
  city: "route-city",
  heritage: "route-heritage",
  coast: "route-coast",
};

function validIds(
  value: unknown,
  allowed = new Set(places.map((place) => place.id)),
) {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is number =>
              Number.isInteger(id) && allowed.has(id as number),
          ),
        ),
      ]
    : [];
}

function normaliseState(input: Partial<AppState>): AppState {
  const routeProgress = Object.fromEntries(
    tourRoutes.map((route) => [
      route.id,
      validIds(input.routeProgress?.[route.id], new Set(route.placeIds)),
    ]),
  );
  return {
    language: input.language === "ko" ? "ko" : "zh",
    saved: validIds(input.saved),
    visited: validIds(input.visited),
    recent: validIds(input.recent).slice(0, 8),
    plan: validIds(input.plan),
    notes:
      input.notes && typeof input.notes === "object"
        ? Object.fromEntries(
            Object.entries(input.notes).filter(
              ([key, value]) =>
                Number.isInteger(Number(key)) && typeof value === "string",
            ),
          )
        : {},
    activeRouteId: tourRoutes.some((route) => route.id === input.activeRouteId)
      ? (input.activeRouteId ?? null)
      : null,
    routeProgress,
  };
}

function PlaceCard({
  place,
  language,
  saved,
  visited,
  onOpen,
  onSave,
}: {
  place: Place;
  language: Language;
  saved: boolean;
  visited: boolean;
  onOpen: () => void;
  onSave: () => void;
}) {
  const guide = guideFor(place.id);
  const title = guide
    ? pick(language, guide.titleZh, guide.titleKo)
    : place.title;
  const secondary = guide
    ? language === "ko"
      ? guide.titleZh
      : guide.titleKo
    : place.meta;
  return (
    <article className="relative min-h-[176px] rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_12px_30px_rgba(30,68,61,.045)] transition active:scale-[.99]">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-[var(--soft)] text-[var(--accent)]">
          <MapPin size={21} weight="duotone" />
        </span>
        <button
          onClick={onSave}
          className="grid size-11 place-items-center rounded-lg text-[var(--muted)] transition active:scale-90"
          aria-label={
            saved
              ? pick(language, `取消收藏${title}`, `${title} 저장 취소`)
              : pick(language, `收藏${title}`, `${title} 저장`)
          }
        >
          <BookmarkSimple
            size={19}
            weight={saved ? "fill" : "regular"}
            className={saved ? "text-[var(--accent)]" : undefined}
          />
        </button>
      </div>
      <button onClick={onOpen} className="mt-4 block w-full text-left">
        <span className="text-[11px] font-semibold text-[var(--accent)]">
          {guide
            ? pick(language, guide.categoryZh, guide.categoryKo)
            : place.category}{" "}
          /{" "}
          {guide
            ? pick(language, guide.districtZh, guide.districtKo)
            : place.district}
        </span>
        <h3 className="mt-1 text-base font-semibold leading-5">{title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
          {secondary}
        </p>
        <div className="mt-2 flex gap-2 text-[10px] font-semibold text-[var(--muted)]">
          {guide && (
            <span>
              {guide.zh.length} 中 / {guide.ko.length} 한
            </span>
          )}
          {visited && (
            <span className="text-[var(--accent)]">
              {pick(language, "已到访", "방문 완료")}
            </span>
          )}
        </div>
      </button>
    </article>
  );
}

function PlaceRow({
  place,
  language,
  onOpen,
}: {
  place: Place;
  language: Language;
  onOpen: () => void;
}) {
  const guide = guideFor(place.id);
  return (
    <button
      onClick={onOpen}
      className="grid min-h-20 w-full grid-cols-[48px_1fr_auto] items-center gap-3 rounded-xl border border-transparent px-2 py-3 text-left transition hover:border-[var(--line)] hover:bg-[var(--field)] active:scale-[.99]"
    >
      <span className="grid size-12 place-items-center rounded-lg bg-[var(--soft)] text-[var(--accent)]">
        <MapPin size={20} weight="duotone" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold text-[var(--accent)]">
          {guide
            ? `${pick(language, guide.categoryZh, guide.categoryKo)} / ${pick(language, guide.districtZh, guide.districtKo)}`
            : `${place.category} / ${place.district}`}
        </span>
        <span className="mt-0.5 block truncate text-sm font-semibold">
          {guide ? pick(language, guide.titleZh, guide.titleKo) : place.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">
          {guide
            ? language === "ko"
              ? guide.titleZh
              : guide.titleKo
            : place.meta}
        </span>
      </span>
      <ArrowRight size={17} className="text-[var(--muted)]" />
    </button>
  );
}

function koreanTravelMeta(value: string) {
  return value
    .replaceAll("预约交通", "예약 차량")
    .replaceAll("自驾", "자가용")
    .replaceAll("地铁", "지하철")
    .replaceAll("步行", "도보")
    .replaceAll("公交", "버스")
    .replaceAll("打车", "택시")
    .replaceAll("与", "와 ")
    .replaceAll("或", " 또는 ")
    .replaceAll("半日", "반나절")
    .replaceAll("一日", "하루")
    .replaceAll("小时", "시간");
}

function travelMeta(language: Language, value: string) {
  return pick(language, value, koreanTravelMeta(value));
}

function RouteCard({
  route,
  language,
  completed,
  active,
  onOpen,
}: {
  route: TourRoute;
  language: Language;
  completed: number;
  active: boolean;
  onOpen: () => void;
}) {
  const ko = routeKorean[route.id];
  return (
    <button
      onClick={onOpen}
      className={`${routeTone[route.tone]} block w-full rounded-xl p-5 text-left text-[#f4f8f6] shadow-[0_16px_36px_rgba(17,54,49,.12)] transition active:scale-[.99]`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="text-xs font-semibold text-[rgba(244,248,246,.78)]">
          {travelMeta(language, route.suggestedTime)} /{" "}
          {travelMeta(language, route.transport)}
        </span>
        {active && (
          <span className="rounded-full bg-[rgba(244,248,246,.16)] px-3 py-1 text-[11px] font-semibold">
            {pick(language, "进行中", "진행 중")}
          </span>
        )}
      </div>
      <h3 className="mt-8 text-xl font-semibold tracking-[-0.03em]">
        {pick(language, route.title, ko.title)}
      </h3>
      <p className="mt-1 text-sm text-[rgba(244,248,246,.78)]">
        {pick(language, route.subtitle, ko.subtitle)}
      </p>
      <div className="mt-5 flex items-center justify-between text-xs font-semibold">
        <span>
          {active
            ? `${completed}/${route.placeIds.length}`
            : `${route.placeIds.length} ${pick(language, "个景点", "개 명소")}`}
        </span>
        <span className="inline-flex items-center gap-1.5">
          {pick(language, "查看路线", "코스 보기")} <ArrowRight size={14} />
        </span>
      </div>
    </button>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [category, setCategory] = useState("全部");
  const [query, setQuery] = useState("");
  const [appState, setAppState] = useState<AppState>(defaultState);
  const [storageReady, setStorageReady] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TourRoute | null>(null);
  const [savedView, setSavedView] = useState<SavedView>("favorites");
  const [placeView, setPlaceView] = useState<PlaceView>("grid");
  const [infoOpen, setInfoOpen] = useState(false);
  const [narrationExpanded, setNarrationExpanded] = useState(false);
  const [toast, setToast] = useState("");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null,
  );
  const importRef = useRef<HTMLInputElement>(null);
  const linkHandled = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const language = appState.language;
  const tx = (zh: string, ko: string) => pick(language, zh, ko);
  const closeOverlays = useCallback(() => {
    setSelectedPlace(null);
    setSelectedRoute(null);
    setInfoOpen(false);
    setNarrationExpanded(false);
    const url = new URL(window.location.href);
    url.search = activeTab === "home" ? "" : `?tab=${activeTab}`;
    window.history.replaceState({}, "", url);
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const stored =
        window.localStorage.getItem(STORAGE_KEY) ??
        window.localStorage.getItem(OLD_STORAGE_KEY);
      try {
        if (stored)
          setAppState(normaliseState(JSON.parse(stored) as Partial<AppState>));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      setStorageReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (storageReady)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState, storageReady]);

  useEffect(() => {
    if (!storageReady || linkHandled.current) return;
    linkHandled.current = true;
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (
        tab === "home" ||
        tab === "discover" ||
        tab === "routes" ||
        tab === "planner" ||
        tab === "saved"
      )
        setActiveTab(tab);
      const place = places.find((item) => item.slug === params.get("place"));
      const route = tourRoutes.find((item) => item.id === params.get("route"));
      if (place) openPlace(place);
      else if (route) {
        setSelectedRoute(route);
        setActiveTab("routes");
      }
    });
  }, [storageReady]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        })
        .catch(() => undefined);
      return;
    }
    navigator.serviceWorker
      .register(`${BASE_PATH}/sw.js`)
      .then((registration) => registration.update())
      .catch(() => undefined);
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", capturePrompt);
  }, []);

  useEffect(() => {
    const overlayOpen = Boolean(selectedPlace || selectedRoute || infoOpen);
    if (!overlayOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeOverlays();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedPlace, selectedRoute, infoOpen, closeOverlays]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const filteredPlaces = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    const source =
      activeTab === "saved" && savedView === "favorites"
        ? places.filter((place) => appState.saved.includes(place.id))
        : places;
    return source.filter((place) => {
      const guide = guideFor(place.id);
      const categoryMatch = category === "全部" || place.category === category;
      const queryMatch =
        !keyword ||
        `${place.title}${place.category}${place.district}${place.meta}${place.description}${guide?.search ?? ""}`
          .toLocaleLowerCase()
          .includes(keyword);
      return categoryMatch && queryMatch;
    });
  }, [activeTab, appState.saved, category, query, savedView]);

  const activeRoute =
    tourRoutes.find((route) => route.id === appState.activeRouteId) ?? null;
  const activeProgress = activeRoute
    ? (appState.routeProgress[activeRoute.id] ?? [])
    : [];
  const recentPlaces = appState.recent
    .map(getPlace)
    .filter((place): place is Place => Boolean(place));
  const plannedPlaces = appState.plan
    .map(getPlace)
    .filter((place): place is Place => Boolean(place));
  const plannedDistricts = new Set(plannedPlaces.map((place) => place.district));

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }

  function setLanguage(next: Language) {
    setAppState((current) => ({ ...current, language: next }));
  }

  function changeTab(tab: Tab) {
    closeOverlays();
    setActiveTab(tab);
    setQuery("");
    setCategory("全部");
    const url = new URL(window.location.href);
    url.search = tab === "home" ? "" : `?tab=${tab}`;
    window.history.replaceState({}, "", url);
    window.scrollTo({ top: 0 });
  }

  function openPlace(place: Place) {
    setSelectedRoute(null);
    setSelectedPlace(place);
    setNarrationExpanded(false);
    setAppState((current) => ({
      ...current,
      recent: [
        place.id,
        ...current.recent.filter((id) => id !== place.id),
      ].slice(0, 8),
    }));
    const url = new URL(window.location.href);
    url.search = `?place=${place.slug}`;
    window.history.replaceState({}, "", url);
  }

  function openRoute(route: TourRoute) {
    setSelectedPlace(null);
    setSelectedRoute(route);
    const url = new URL(window.location.href);
    url.search = `?route=${route.id}`;
    window.history.replaceState({}, "", url);
  }

  function toggleList(key: "saved" | "visited" | "plan", id: number) {
    const exists = appState[key].includes(id);
    setAppState((current) => ({
      ...current,
      [key]: exists
        ? current[key].filter((item) => item !== id)
        : [...current[key], id],
    }));
    showToast(
      exists
        ? tx("已移除", "삭제했습니다")
        : tx("已保存到本机", "기기에 저장했습니다"),
    );
  }

  function movePlan(id: number, direction: -1 | 1) {
    setAppState((current) => {
      const index = current.plan.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.plan.length)
        return current;
      const plan = [...current.plan];
      [plan[index], plan[target]] = [plan[target], plan[index]];
      return { ...current, plan };
    });
  }

  function addSuggestedPlan() {
    const suggestion = (activeRoute ?? tourRoutes[0]).placeIds;
    setAppState((current) => ({
      ...current,
      plan: [...new Set([...current.plan, ...suggestion])],
    }));
    showToast(tx("推荐行程已加入", "추천 일정이 추가되었습니다"));
  }

  function clearPlan() {
    if (!plannedPlaces.length) return;
    if (!window.confirm(tx("确定清空当前行程吗？", "현재 일정을 비울까요?")))
      return;
    setAppState((current) => ({ ...current, plan: [] }));
    showToast(tx("行程已清空", "일정을 비웠습니다"));
  }

  function startRoute(route: TourRoute) {
    setAppState((current) => ({
      ...current,
      activeRouteId: route.id,
      routeProgress: {
        ...current.routeProgress,
        [route.id]:
          (current.routeProgress[route.id] ?? []).length ===
          route.placeIds.length
            ? []
            : (current.routeProgress[route.id] ?? []),
      },
    }));
    showToast(tx("路线已开始", "코스를 시작했습니다"));
  }

  function toggleRoutePlace(route: TourRoute, placeId: number) {
    setAppState((current) => {
      const completed = current.routeProgress[route.id] ?? [];
      const next = completed.includes(placeId)
        ? completed.filter((id) => id !== placeId)
        : [...completed, placeId];
      return {
        ...current,
        visited: next.includes(placeId)
          ? [...new Set([...current.visited, placeId])]
          : current.visited,
        routeProgress: { ...current.routeProgress, [route.id]: next },
      };
    });
  }

  async function shareItem(title: string, text: string) {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else {
        await navigator.clipboard.writeText(url);
        showToast(tx("链接已复制", "링크를 복사했습니다"));
      }
    } catch {
      return;
    }
  }

  function exportData() {
    const blob = new Blob(
      [JSON.stringify({ version: 3, state: appState }, null, 2)],
      { type: "application/json" },
    );
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `shenyou-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
    showToast(tx("备份已导出", "백업을 내보냈습니다"));
  }

  function importData(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          state?: Partial<AppState>;
        };
        setAppState(normaliseState(parsed.state ?? {}));
        showToast(tx("数据已导入", "데이터를 가져왔습니다"));
      } catch {
        showToast(
          tx("备份文件格式不正确", "백업 파일 형식이 올바르지 않습니다"),
        );
      }
    };
    reader.readAsText(file);
  }

  async function installApp() {
    if (!installPrompt) {
      showToast(
        tx(
          "请在浏览器菜单中选择添加到主屏幕",
          "브라우저 메뉴에서 홈 화면에 추가를 선택하세요",
        ),
      );
      return;
    }
    await installPrompt.prompt();
    setInstallPrompt(null);
  }

  function clearLocalData() {
    if (
      !window.confirm(
        tx(
          "确定清除收藏、笔记和行程吗？",
          "저장, 메모와 일정을 모두 삭제할까요?",
        ),
      )
    )
      return;
    setAppState(defaultState);
    closeOverlays();
    showToast(tx("本机数据已清除", "기기 데이터를 삭제했습니다"));
  }

  function renderHeader(
    titleZh: string,
    titleKo: string,
    subtitleZh: string,
    subtitleKo: string,
  ) {
    return (
      <header className="pt-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            SHENYOU / 深圳解说
          </p>
          <div className="flex items-center gap-2">
            <div
              className="flex rounded-xl bg-[var(--field)] p-1"
              role="group"
              aria-label="语言"
            >
              {(["zh", "ko"] as Language[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setLanguage(item)}
                  aria-pressed={language === item}
                  className={`grid min-h-9 min-w-10 place-items-center rounded-lg px-2 text-xs font-semibold transition active:scale-95 ${language === item ? "bg-[var(--surface)] text-[var(--ink)] shadow-[0_2px_8px_rgba(23,33,31,.08)]" : "text-[var(--muted)]"}`}
                >
                  {item === "zh" ? "中" : "한"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setInfoOpen(true)}
              className="grid size-11 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] active:scale-95"
              aria-label={tx("应用设置", "앱 설정")}
            >
              <Info size={18} />
            </button>
          </div>
        </div>
        <h1 className="mt-5 text-[28px] font-semibold leading-[1.16] tracking-[-0.045em]">
          {tx(titleZh, titleKo)}
        </h1>
        <p className="mt-1.5 text-[13px] leading-5 text-[var(--muted)]">
          {tx(subtitleZh, subtitleKo)}
        </p>
      </header>
    );
  }

  function renderSearch() {
    return (
      <>
        <div className="mt-6 flex min-h-13 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--field)] px-4 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/10">
          <MagnifyingGlass size={20} className="shrink-0 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-[var(--muted)]"
            placeholder={tx(
              "搜索中文、韩文、区域或正文",
              "중국어, 한국어, 지역과 본문 검색",
            )}
            aria-label={tx("搜索深圳景点", "선전 명소 검색")}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="grid size-9 place-items-center rounded-lg bg-[var(--soft)] active:scale-95"
              aria-label={tx("清除搜索", "검색 지우기")}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div
          className="no-scrollbar mt-4 flex snap-x gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label={tx("景点分类", "명소 분류")}
        >
          {categories.map((item) => {
            const ko = guidePlaces.find(
              (place) => place.categoryZh === item,
            )?.categoryKo;
            return (
              <button
                key={item}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={`min-h-10 shrink-0 snap-start rounded-full px-4 py-2 text-sm font-medium transition active:scale-95 ${category === item ? "bg-[var(--ink)] text-[var(--surface)]" : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"}`}
              >
                {item === "全部" ? tx("全部", "전체") : tx(item, ko ?? item)}
              </button>
            );
          })}
        </div>
      </>
    );
  }

  const placeCard = (place: Place) => (
    <PlaceCard
      key={place.id}
      place={place}
      language={language}
      saved={appState.saved.includes(place.id)}
      visited={appState.visited.includes(place.id)}
      onOpen={() => openPlace(place)}
      onSave={() => toggleList("saved", place.id)}
    />
  );

  return (
    <main className="min-h-[100dvh] bg-[var(--canvas)] text-[var(--ink)]">
      <div className="relative mx-auto min-h-[100dvh] max-w-[520px] overflow-hidden bg-[var(--surface)] shadow-[0_0_70px_rgba(23,33,31,.09)]">
        <div className="px-5 pb-32 pt-[max(18px,env(safe-area-inset-top))]">
          {activeTab === "home" && (
            <>
              {renderHeader(
                "今天，从哪一段深圳开始？",
                "오늘은 어떤 선전을 만나볼까요?",
                "18 个中韩双语景点 / 4 条建议路线",
                "18개 중한 명소 / 4개 추천 코스",
              )}
              <section className="relative mt-6 min-h-[286px] overflow-hidden rounded-xl bg-[#173a37] text-[#f4f8f6]">
                <img
                  src={`${BASE_PATH}/images/riverside.png`}
                  alt={tx("深圳湾滨海公共空间", "선전만 해안 공공 공간")}
                  width={1200}
                  height={800}
                  fetchPriority="high"
                  decoding="async"
                  className="absolute inset-0 size-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a2421]/95 via-[#0a2421]/16 to-transparent" />
                <div className="relative flex min-h-[286px] flex-col justify-end p-5">
                  <p className="text-xs font-medium text-[rgba(244,248,246,.78)]">
                    {tx("深圳湾滨海线 / 一日", "선전만 해안 코스 / 하루")}
                  </p>
                  <h2 className="mt-1 max-w-[13ch] text-[28px] font-semibold leading-[1.1] tracking-[-0.04em]">
                    {tx("从海风里，读懂深圳。", "바닷바람 속에서 선전을 읽다.")}
                  </h2>
                  <button
                    onClick={() => openRoute(tourRoutes[1])}
                    className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-[#f4f8f6] px-4 py-2.5 text-sm font-semibold text-[#12312e] active:scale-[.98]"
                  >
                    {tx("打开路线", "코스 열기")} <ArrowRight size={15} />
                  </button>
                </div>
              </section>
              <section className="mt-4 grid grid-cols-3 gap-2" aria-label={tx("快捷入口", "빠른 메뉴")}>
                <button
                  onClick={() => changeTab("discover")}
                  className="min-h-24 rounded-xl bg-[var(--field)] p-3 text-left active:scale-[.98]"
                >
                  <Translate size={20} className="text-[var(--accent)]" />
                  <b className="mt-3 block text-sm">18</b>
                  <span className="text-[10px] text-[var(--muted)]">
                    {tx("中韩资料", "중한 자료")}
                  </span>
                </button>
                <button
                  onClick={() => changeTab("planner")}
                  className="min-h-24 rounded-xl bg-[var(--field)] p-3 text-left active:scale-[.98]"
                >
                  <CalendarDots size={20} className="text-[var(--accent)]" />
                  <b className="mt-3 block text-sm">{appState.plan.length}</b>
                  <span className="text-[10px] text-[var(--muted)]">
                    {tx("行程景点", "일정 장소")}
                  </span>
                </button>
                <button
                  onClick={() => {
                    const place =
                      places[Math.floor(Math.random() * places.length)];
                    openPlace(place);
                  }}
                  className="min-h-24 rounded-xl bg-[var(--field)] p-3 text-left active:scale-[.98]"
                >
                  <Shuffle size={20} className="text-[var(--accent)]" />
                  <b className="mt-3 block text-sm">GO</b>
                  <span className="text-[10px] text-[var(--muted)]">
                    {tx("随机推荐", "무작위 추천")}
                  </span>
                </button>
              </section>
              {activeRoute && (
                <section className="mt-6 rounded-xl border border-[var(--accent)]/25 bg-[var(--soft)] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[var(--accent)]">
                        {tx("当前行程", "현재 코스")}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold">
                        {tx(
                          activeRoute.title,
                          routeKorean[activeRoute.id].title,
                        )}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {activeProgress.length}/{activeRoute.placeIds.length}
                      </p>
                    </div>
                    <button
                      onClick={() => openRoute(activeRoute)}
                      className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent-ink)]"
                    >
                      {tx("查看进度", "진행 보기")}
                    </button>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {activeRoute.placeIds.map((id) => (
                      <CheckCircle
                        key={id}
                        size={20}
                        weight={
                          activeProgress.includes(id) ? "fill" : "regular"
                        }
                        className={
                          activeProgress.includes(id)
                            ? "text-[var(--accent)]"
                            : "text-[var(--muted)]"
                        }
                      />
                    ))}
                  </div>
                </section>
              )}
              <section className="mt-8">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.03em]">
                      {tx("今天怎么逛", "오늘의 추천 코스")}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {tx(
                        "按区域组织，减少无效往返。",
                        "지역별로 묶어 이동을 줄였습니다.",
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => changeTab("routes")}
                    className="text-xs font-semibold text-[var(--accent)]"
                  >
                    {tx("全部路线", "전체 코스")}
                  </button>
                </div>
                <div className="no-scrollbar -mx-5 mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
                  {tourRoutes.map((route) => (
                    <div key={route.id} className="w-[82%] shrink-0 snap-start">
                      <RouteCard
                        route={route}
                        language={language}
                        completed={
                          (appState.routeProgress[route.id] ?? []).length
                        }
                        active={appState.activeRouteId === route.id}
                        onOpen={() => openRoute(route)}
                      />
                    </div>
                  ))}
                </div>
              </section>
              {recentPlaces.length > 0 && (
                <section className="mt-7">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      {tx("继续浏览", "계속 보기")}
                    </h2>
                    <button
                      onClick={() => changeTab("saved")}
                      className="text-xs font-semibold text-[var(--accent)]"
                    >
                      {tx("查看足迹", "기록 보기")}
                    </button>
                  </div>
                  <div className="mt-2 grid gap-1">
                    {recentPlaces.slice(0, 3).map((place) => (
                      <PlaceRow
                        key={place.id}
                        place={place}
                        language={language}
                        onOpen={() => openPlace(place)}
                      />
                    ))}
                  </div>
                </section>
              )}
              <section className="mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {tx("资料精选", "추천 명소")}
                  </h2>
                  <button
                    onClick={() => changeTab("discover")}
                    className="text-xs font-semibold text-[var(--accent)]"
                  >
                    {tx("查看 18 个景点", "18개 명소 보기")}
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
                  {featuredPlaceIds
                    .map(getPlace)
                    .filter((place): place is Place => Boolean(place))
                    .map(placeCard)}
                </div>
              </section>
            </>
          )}

          {activeTab === "discover" && (
            <>
              {renderHeader(
                "景点",
                "명소",
                "搜索完整中文与韩文讲解",
                "중국어와 한국어 전체 해설 검색",
              )}
              {renderSearch()}
              <section className="mt-7">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.03em]">
                      {tx("资料里的深圳", "자료 속 선전")}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--muted)]" aria-live="polite">
                      {tx(
                        `找到 ${filteredPlaces.length} 个景点`,
                        `${filteredPlaces.length}개 명소를 찾았습니다`,
                      )}
                    </p>
                  </div>
                  <div
                    className="flex rounded-xl bg-[var(--field)] p-1"
                    role="group"
                    aria-label={tx("显示方式", "보기 방식")}
                  >
                    {(
                      [
                        { id: "grid", Icon: SquaresFour, zh: "卡片", ko: "카드" },
                        { id: "list", Icon: ListBullets, zh: "列表", ko: "목록" },
                      ] as const
                    ).map(({ id, Icon, zh, ko }) => (
                      <button
                        key={id}
                        onClick={() => setPlaceView(id)}
                        aria-pressed={placeView === id}
                        aria-label={tx(zh, ko)}
                        className={`grid size-10 place-items-center rounded-lg transition active:scale-95 ${placeView === id ? "bg-[var(--surface)] text-[var(--ink)] shadow-[0_2px_8px_rgba(23,33,31,.08)]" : "text-[var(--muted)]"}`}
                      >
                        <Icon size={18} weight={placeView === id ? "fill" : "regular"} />
                      </button>
                    ))}
                  </div>
                </div>
                {placeView === "grid" ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
                    {filteredPlaces.map(placeCard)}
                  </div>
                ) : (
                  <div className="mt-4 grid gap-1">
                    {filteredPlaces.map((place) => (
                      <PlaceRow
                        key={place.id}
                        place={place}
                        language={language}
                        onOpen={() => openPlace(place)}
                      />
                    ))}
                  </div>
                )}
                {filteredPlaces.length === 0 && (
                  <div className="mt-6 rounded-xl border border-dashed border-[var(--line)] px-6 py-12 text-center">
                    <Compass
                      size={30}
                      className="mx-auto text-[var(--accent)]"
                    />
                    <h3 className="mt-3 font-semibold">
                      {tx("没有找到对应景点", "검색 결과가 없습니다")}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {tx("试试其他关键词或分类。", "다른 검색어나 분류를 선택해 보세요.")}
                    </p>
                    <button
                      onClick={() => {
                        setQuery("");
                        setCategory("全部");
                      }}
                      className="mt-4 rounded-lg bg-[var(--ink)] px-4 py-2.5 text-xs font-semibold text-[var(--surface)]"
                    >
                      {tx("清除筛选", "필터 지우기")}
                    </button>
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === "routes" && (
            <>
              {renderHeader(
                "路线",
                "추천 코스",
                "区域串联与到访进度保存在本机",
                "코스와 방문 진행 상황은 기기에 저장됩니다",
              )}
              <section className="mt-7 grid gap-4">
                {tourRoutes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    language={language}
                    completed={(appState.routeProgress[route.id] ?? []).length}
                    active={appState.activeRouteId === route.id}
                    onOpen={() => openRoute(route)}
                  />
                ))}
              </section>
            </>
          )}

          {activeTab === "planner" && (
            <>
              {renderHeader(
                "我的行程",
                "나의 일정",
                "添加景点并调整游览顺序",
                "장소를 추가하고 방문 순서를 조정하세요",
              )}
              <section className="mt-6 rounded-xl bg-[var(--field)] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex gap-7">
                    <div>
                      <p className="text-xs text-[var(--muted)]">
                        {tx("当前计划", "현재 일정")}
                      </p>
                      <h2 className="mt-1 text-xl font-semibold">
                        {plannedPlaces.length} {tx("个景点", "개 명소")}
                      </h2>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--muted)]">
                        {tx("覆盖区域", "방문 지역")}
                      </p>
                      <h2 className="mt-1 text-xl font-semibold">
                        {plannedDistricts.size} {tx("个", "곳")}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={clearPlan}
                    disabled={!plannedPlaces.length}
                    className="grid size-11 place-items-center rounded-xl bg-[var(--surface)] text-[var(--muted)] active:scale-95 disabled:opacity-40"
                    aria-label={tx("清空行程", "일정 비우기")}
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </section>
              <section className="mt-5">
                {plannedPlaces.length ? (
                  <div className="grid gap-3">
                    {plannedPlaces.map((place, index) => (
                      <div
                        key={place.id}
                        className="grid grid-cols-[38px_1fr_auto] items-center gap-3 rounded-xl border border-[var(--line)] p-3"
                      >
                        <span className="grid size-9 place-items-center rounded-lg bg-[var(--soft)] text-sm font-semibold text-[var(--accent)]">
                          {index + 1}
                        </span>
                        <button
                          onClick={() => openPlace(place)}
                          className="min-w-0 text-left"
                        >
                          <b className="block truncate text-sm">
                            {pick(
                              language,
                              guideFor(place.id)?.titleZh ?? place.title,
                              guideFor(place.id)?.titleKo ?? place.title,
                            )}
                          </b>
                          <span className="text-xs text-[var(--muted)]">
                            {place.district}
                          </span>
                        </button>
                        <div className="flex">
                          <button
                            onClick={() => movePlan(place.id, -1)}
                            disabled={index === 0}
                            className="grid size-9 place-items-center rounded-lg active:bg-[var(--field)] disabled:opacity-25"
                            aria-label={tx("上移", "위로 이동")}
                          >
                            <ArrowUp size={15} />
                          </button>
                          <button
                            onClick={() => movePlan(place.id, 1)}
                            disabled={index === plannedPlaces.length - 1}
                            className="grid size-9 place-items-center rounded-lg active:bg-[var(--field)] disabled:opacity-25"
                            aria-label={tx("下移", "아래로 이동")}
                          >
                            <ArrowDown size={15} />
                          </button>
                          <button
                            onClick={() => toggleList("plan", place.id)}
                            className="grid size-9 place-items-center rounded-lg text-[var(--muted)] active:bg-[var(--field)]"
                            aria-label={tx("从行程移除", "일정에서 삭제")}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--line)] px-6 py-12 text-center">
                    <CalendarDots
                      size={32}
                      className="mx-auto text-[var(--accent)]"
                    />
                    <h3 className="mt-3 font-semibold">
                      {tx("还没有行程", "일정이 아직 없습니다")}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {tx("可以从推荐路线开始，再按需要调整。", "추천 코스로 시작한 뒤 자유롭게 조정하세요.")}
                    </p>
                    <button
                      onClick={addSuggestedPlan}
                      className="mt-5 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-ink)] active:scale-[.98]"
                    >
                      {tx("加入推荐行程", "추천 일정 추가")}
                    </button>
                  </div>
                )}
              </section>
              <section className="mt-8">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {tx("添加景点", "명소 추가")}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {tx("搜索后点按加号即可加入", "검색 후 더하기 버튼을 누르세요")}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--muted)]">
                    {filteredPlaces.filter((place) => !appState.plan.includes(place.id)).length}
                  </span>
                </div>
                {renderSearch()}
                <div className="mt-3 grid gap-2">
                  {filteredPlaces
                    .filter((place) => !appState.plan.includes(place.id))
                    .map((place) => (
                      <button
                        key={place.id}
                        onClick={() => toggleList("plan", place.id)}
                        className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-xl bg-[var(--field)] p-3 text-left active:scale-[.99]"
                      >
                        <span className="grid size-10 place-items-center rounded-lg bg-[var(--surface)] text-[var(--accent)]">
                          <MapPin size={18} />
                        </span>
                        <span>
                          <b className="block text-sm">
                            {pick(
                              language,
                              guideFor(place.id)?.titleZh ?? place.title,
                              guideFor(place.id)?.titleKo ?? place.title,
                            )}
                          </b>
                          <small className="text-[var(--muted)]">
                            {place.district} / {place.category}
                          </small>
                        </span>
                        <Plus size={17} />
                      </button>
                    ))}
                </div>
                {filteredPlaces.every((place) => appState.plan.includes(place.id)) && (
                  <div className="mt-4 rounded-xl border border-dashed border-[var(--line)] px-5 py-8 text-center text-sm text-[var(--muted)]">
                    {query || category !== "全部"
                      ? tx("当前筛选下没有可添加的景点", "현재 조건에서 추가할 명소가 없습니다")
                      : tx("18 个景点已全部加入行程", "18개 명소를 모두 일정에 추가했습니다")}
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === "saved" && (
            <>
              {renderHeader(
                "我的",
                "내 여행",
                "收藏、到访与个人笔记",
                "저장, 방문과 개인 메모",
              )}
              <div className="mt-6 grid grid-cols-3 gap-2">
                {(
                  [
                    {
                      id: "favorites",
                      zh: "收藏",
                      ko: "저장",
                      count: appState.saved.length,
                      Icon: BookmarkSimple,
                    },
                    {
                      id: "visited",
                      zh: "到访",
                      ko: "방문",
                      count: appState.visited.length,
                      Icon: Footprints,
                    },
                    {
                      id: "notes",
                      zh: "笔记",
                      ko: "메모",
                      count: Object.values(appState.notes).filter(Boolean)
                        .length,
                      Icon: NotePencil,
                    },
                  ] as const
                ).map(({ id, zh, ko, count, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSavedView(id)}
                    className={`rounded-xl p-3 text-left ${savedView === id ? "bg-[var(--ink)] text-[var(--surface)]" : "bg-[var(--field)]"}`}
                  >
                    <Icon size={19} />
                    <b className="mt-3 block text-lg">{count}</b>
                    <span className="text-[10px] opacity-70">{tx(zh, ko)}</span>
                  </button>
                ))}
              </div>
              {savedView === "favorites" && (
                <>
                  {renderSearch()}
                  <div className="mt-5 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
                    {filteredPlaces.map(placeCard)}
                  </div>
                  {!filteredPlaces.length && (
                    <div className="mt-6 rounded-xl border border-dashed border-[var(--line)] px-6 py-12 text-center">
                      <BookmarkSimple size={30} className="mx-auto text-[var(--accent)]" />
                      <h3 className="mt-3 font-semibold">
                        {appState.saved.length
                          ? tx("没有符合筛选的收藏", "조건에 맞는 저장 장소가 없습니다")
                          : tx("收藏夹还是空的", "저장한 장소가 없습니다")}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {appState.saved.length
                          ? tx("清除筛选即可查看全部收藏。", "필터를 지우면 모든 저장 장소를 볼 수 있습니다.")
                          : tx("浏览景点时点按收藏即可保存。", "명소에서 저장 버튼을 누르면 여기에 표시됩니다.")}
                      </p>
                      <button
                        onClick={() => {
                          if (appState.saved.length) {
                            setQuery("");
                            setCategory("全部");
                          } else changeTab("discover");
                        }}
                        className="mt-5 rounded-lg bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--surface)] active:scale-[.98]"
                      >
                        {appState.saved.length
                          ? tx("清除筛选", "필터 지우기")
                          : tx("浏览景点", "명소 보기")}
                      </button>
                    </div>
                  )}
                </>
              )}
              {savedView === "visited" && (
                <div className="mt-6 grid gap-1">
                  {places
                    .filter((place) => appState.visited.includes(place.id))
                    .map((place) => (
                      <PlaceRow
                        key={place.id}
                        place={place}
                        language={language}
                        onOpen={() => openPlace(place)}
                      />
                    ))}
                  {!appState.visited.length && (
                    <div className="rounded-xl border border-dashed border-[var(--line)] px-6 py-12 text-center">
                      <Footprints size={30} className="mx-auto text-[var(--accent)]" />
                      <h3 className="mt-3 font-semibold">
                        {tx("还没有到访记录", "방문 기록이 없습니다")}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {tx("在景点详情中标记到访。", "명소 상세에서 방문을 표시하세요.")}
                      </p>
                      <button
                        onClick={() => changeTab("discover")}
                        className="mt-5 rounded-lg bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--surface)] active:scale-[.98]"
                      >
                        {tx("浏览景点", "명소 보기")}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {savedView === "notes" && (
                <div className="mt-6 grid gap-3">
                  {places
                    .filter((place) => appState.notes[place.id]?.trim())
                    .map((place) => (
                      <button
                        key={place.id}
                        onClick={() => openPlace(place)}
                        className="rounded-xl bg-[var(--field)] p-4 text-left"
                      >
                        <b className="text-sm">
                          {pick(
                            language,
                            guideFor(place.id)?.titleZh ?? place.title,
                            guideFor(place.id)?.titleKo ?? place.title,
                          )}
                        </b>
                        <p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--muted)]">
                          {appState.notes[place.id]}
                        </p>
                      </button>
                    ))}
                  {!Object.values(appState.notes).some(Boolean) && (
                    <div className="rounded-xl border border-dashed border-[var(--line)] px-6 py-12 text-center">
                      <NotePencil size={30} className="mx-auto text-[var(--accent)]" />
                      <h3 className="mt-3 font-semibold">
                        {tx("还没有个人笔记", "개인 메모가 없습니다")}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {tx("打开景点详情即可记录。", "명소 상세를 열어 메모를 남기세요.")}
                      </p>
                      <button
                        onClick={() => changeTab("discover")}
                        className="mt-5 rounded-lg bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--surface)] active:scale-[.98]"
                      >
                        {tx("选择景点", "명소 선택")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <nav
          className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[520px] border-t border-[var(--line)] bg-[var(--surface)]/94 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"
          aria-label={tx("主导航", "메인 탐색")}
        >
          <div className="grid grid-cols-5">
            {[
              { id: "home", zh: "首页", ko: "홈", Icon: House },
              { id: "discover", zh: "景点", ko: "명소", Icon: Compass },
              { id: "routes", zh: "路线", ko: "코스", Icon: MapTrifold },
              { id: "planner", zh: "行程", ko: "일정", Icon: CalendarDots },
              { id: "saved", zh: "我的", ko: "내 여행", Icon: UserCircle },
            ].map(({ id, zh, ko, Icon }) => (
              <button
                key={id}
                onClick={() => changeTab(id as Tab)}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium transition active:scale-95 ${activeTab === id ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
                aria-current={activeTab === id ? "page" : undefined}
              >
                <span className={`grid h-7 min-w-10 place-items-center rounded-lg ${activeTab === id ? "bg-[var(--soft)]" : ""}`}>
                  <Icon
                    size={21}
                    weight={activeTab === id ? "fill" : "regular"}
                  />
                </span>
                {tx(zh, ko)}
              </button>
            ))}
          </div>
        </nav>
        {toast && (
          <div
            className="fixed inset-x-5 bottom-24 z-30 mx-auto max-w-[440px] rounded-lg bg-[var(--ink)] px-4 py-3 text-center text-sm font-semibold text-[var(--surface)] shadow-xl"
            role="status"
            aria-live="polite"
          >
            {toast}
          </div>
        )}

        {selectedPlace &&
          (() => {
            const guide = guideFor(selectedPlace.id);
            if (!guide) return null;
            const paragraphs = language === "ko" ? guide.ko : guide.zh;
            const shown = narrationExpanded
              ? paragraphs
              : paragraphs.slice(0, 3);
            return (
              <div
                className="fixed inset-0 z-40 flex items-end justify-center bg-[#071210]/55 px-3"
                role="dialog"
                aria-modal="true"
                aria-label={pick(language, guide.titleZh, guide.titleKo)}
                onClick={closeOverlays}
              >
                <div
                  className="sheet mb-3 max-h-[90dvh] w-full max-w-[496px] overscroll-contain overflow-y-auto rounded-xl bg-[var(--surface)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="sticky -top-5 z-10 -mx-5 -mt-5 bg-[var(--surface)]/96 px-5 pb-3 pt-2 backdrop-blur-xl">
                    <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--line)]" aria-hidden="true" />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-[var(--accent)]">
                          {pick(language, guide.categoryZh, guide.categoryKo)} /{" "}
                          {pick(language, guide.districtZh, guide.districtKo)}
                        </span>
                        <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">
                          {pick(language, guide.titleZh, guide.titleKo)}
                        </h2>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {language === "ko" ? guide.titleZh : guide.titleKo}
                        </p>
                      </div>
                      <button
                        onClick={closeOverlays}
                        className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--field)] active:scale-95"
                        aria-label={tx("关闭", "닫기")}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
                    <span className="rounded-lg bg-[var(--field)] p-3">
                      <Clock size={16} className="mb-2 text-[var(--accent)]" />
                      {travelMeta(language, guide.duration)}
                    </span>
                    <span className="rounded-lg bg-[var(--field)] p-3">
                      <MapPin size={16} className="mb-2 text-[var(--accent)]" />
                      {pick(language, guide.districtZh, guide.districtKo)}
                    </span>
                    <span className="rounded-lg bg-[var(--field)] p-3">
                      <Translate
                        size={16}
                        className="mb-2 text-[var(--accent)]"
                      />
                      {language === "ko"
                        ? `${guide.ko.length}개 문단`
                        : `${guide.zh.length} 段`}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <button
                      onClick={() => toggleList("saved", selectedPlace.id)}
                      aria-pressed={appState.saved.includes(selectedPlace.id)}
                      className={`grid min-h-14 place-items-center gap-1 rounded-lg p-2 text-[11px] ${appState.saved.includes(selectedPlace.id) ? "bg-[var(--soft)] text-[var(--accent)]" : "bg-[var(--field)]"}`}
                    >
                      <BookmarkSimple
                        size={18}
                        weight={
                          appState.saved.includes(selectedPlace.id)
                            ? "fill"
                            : "regular"
                        }
                      />
                      {tx("收藏", "저장")}
                    </button>
                    <button
                      onClick={() => toggleList("visited", selectedPlace.id)}
                      aria-pressed={appState.visited.includes(selectedPlace.id)}
                      className={`grid min-h-14 place-items-center gap-1 rounded-lg p-2 text-[11px] ${appState.visited.includes(selectedPlace.id) ? "bg-[var(--soft)] text-[var(--accent)]" : "bg-[var(--field)]"}`}
                    >
                      <Footprints size={18} />
                      {tx("到访", "방문")}
                    </button>
                    <button
                      onClick={() => toggleList("plan", selectedPlace.id)}
                      aria-pressed={appState.plan.includes(selectedPlace.id)}
                      className={`grid min-h-14 place-items-center gap-1 rounded-lg p-2 text-[11px] ${appState.plan.includes(selectedPlace.id) ? "bg-[var(--soft)] text-[var(--accent)]" : "bg-[var(--field)]"}`}
                    >
                      <CalendarDots size={18} />
                      {tx("行程", "일정")}
                    </button>
                    <button
                      onClick={() =>
                        shareItem(
                          pick(language, guide.titleZh, guide.titleKo),
                          pick(language, guide.tagZh, guide.tagKo),
                        )
                      }
                      className="grid min-h-14 place-items-center gap-1 rounded-lg bg-[var(--field)] p-2 text-[11px]"
                    >
                      <ShareNetwork size={18} />
                      {tx("分享", "공유")}
                    </button>
                  </div>
                  <a
                    href={`https://uri.amap.com/search?keyword=${encodeURIComponent(selectedPlace.title)}&city=深圳&view=map&src=shenyou`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-3 text-sm font-semibold text-[var(--accent-ink)] active:scale-[.99]"
                  >
                    <NavigationArrow size={17} weight="fill" />
                    {tx("地图导航", "지도 길찾기")}
                  </a>
                  <section className="mt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        {tx("景点介绍", "명소 소개")}
                      </h3>
                      <span className="text-xs text-[var(--muted)]">
                        {language === "ko" ? "한국어" : "中文"}
                      </span>
                    </div>
                    <div className="mt-3">
                      {shown.map((text, index) => (
                        <p
                          key={index}
                          className="mt-3 text-[15px] leading-8 text-[var(--muted)]"
                        >
                          {text}
                        </p>
                      ))}
                    </div>
                    <button
                      onClick={() => setNarrationExpanded((value) => !value)}
                      className="mt-4 w-full rounded-lg bg-[var(--field)] py-3 text-sm font-semibold"
                    >
                      {narrationExpanded
                        ? tx("收起正文", "본문 접기")
                        : tx("展开完整正文", "전체 본문 보기")}
                    </button>
                  </section>
                  <section className="mt-6">
                    <label
                      htmlFor="place-note"
                      className="text-sm font-semibold"
                    >
                      {tx("我的笔记", "내 메모")}
                    </label>
                    <textarea
                      id="place-note"
                      value={appState.notes[selectedPlace.id] ?? ""}
                      onChange={(event) =>
                        setAppState((current) => ({
                          ...current,
                          notes: {
                            ...current.notes,
                            [selectedPlace.id]: event.target.value,
                          },
                        }))
                      }
                      className="mt-2 min-h-28 w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--field)] p-3 text-sm leading-6 outline-none focus:border-[var(--accent)]"
                      placeholder={tx(
                        "记录集合点、讲解重点或个人感受",
                        "집합 장소, 해설 요점이나 느낌을 기록하세요",
                      )}
                    />
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {tx("内容会自动保存在本机", "내용은 기기에 자동 저장됩니다")}
                    </p>
                  </section>
                </div>
              </div>
            );
          })()}

        {selectedRoute &&
          (() => {
            const ko = routeKorean[selectedRoute.id];
            const progress = appState.routeProgress[selectedRoute.id] ?? [];
            return (
              <div
                className="fixed inset-0 z-40 flex items-end justify-center bg-[#071210]/55 px-3"
                role="dialog"
                aria-modal="true"
                onClick={closeOverlays}
              >
                <div
                  className="sheet mb-3 max-h-[88dvh] w-full max-w-[496px] overscroll-contain overflow-y-auto rounded-xl bg-[var(--surface)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--line)]" aria-hidden="true" />
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-[var(--accent)]">
                        {travelMeta(language, selectedRoute.suggestedTime)} /{" "}
                        {travelMeta(language, selectedRoute.transport)}
                      </span>
                      <h2 className="mt-1 text-2xl font-semibold">
                        {tx(selectedRoute.title, ko.title)}
                      </h2>
                    </div>
                    <button
                      onClick={closeOverlays}
                      className="grid size-11 place-items-center rounded-xl bg-[var(--field)] active:scale-95"
                      aria-label={tx("关闭", "닫기")}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                    {tx(selectedRoute.description, ko.description)}
                  </p>
                  <div className="mt-5 grid gap-3">
                    {selectedRoute.placeIds.map((id, index) => {
                      const place = getPlace(id);
                      const guide = guideFor(id);
                      if (!place || !guide) return null;
                      const done = progress.includes(id);
                      return (
                        <div
                          key={id}
                          className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-xl bg-[var(--field)] p-3"
                        >
                          <button
                            disabled={
                              appState.activeRouteId !== selectedRoute.id
                            }
                            onClick={() => toggleRoutePlace(selectedRoute, id)}
                            className={`grid size-10 place-items-center rounded-full ${done ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "border border-[var(--line)]"}`}
                            aria-label={
                              done
                                ? tx("取消完成标记", "완료 표시 취소")
                                : tx("标记为已完成", "완료로 표시")
                            }
                            aria-pressed={done}
                          >
                            {done ? (
                              <CheckCircle size={20} weight="fill" />
                            ) : (
                              index + 1
                            )}
                          </button>
                          <button
                            onClick={() => openPlace(place)}
                            className="text-left"
                          >
                            <b className="text-sm">
                              {pick(language, guide.titleZh, guide.titleKo)}
                            </b>
                            <span className="mt-0.5 block text-xs text-[var(--muted)]">
                              {pick(
                                language,
                                guide.districtZh,
                                guide.districtKo,
                              )}
                            </span>
                          </button>
                          <ArrowRight size={16} />
                        </div>
                      );
                    })}
                  </div>
                  {appState.activeRouteId === selectedRoute.id ? (
                    <>
                      <button
                        onClick={() => {
                          setAppState((current) => ({
                            ...current,
                            activeRouteId: null,
                          }));
                          closeOverlays();
                        }}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--accent-ink)]"
                      >
                        <CheckCircle size={18} />
                        {tx("保存并退出", "저장하고 나가기")}
                      </button>
                      <button
                        onClick={() =>
                          setAppState((current) => ({
                            ...current,
                            routeProgress: {
                              ...current.routeProgress,
                              [selectedRoute.id]: [],
                            },
                          }))
                        }
                        className="mt-2 flex w-full items-center justify-center gap-2 py-3 text-xs font-semibold text-[var(--muted)]"
                      >
                        <ArrowClockwise size={16} />
                        {tx("重新开始", "다시 시작")}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startRoute(selectedRoute)}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--accent-ink)]"
                    >
                      <NavigationArrow size={17} />
                      {tx("开始路线", "코스 시작")}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

        {infoOpen && (
          <div
            className="fixed inset-0 z-40 flex items-end justify-center bg-[#071210]/55 px-3"
            role="dialog"
            aria-modal="true"
            onClick={closeOverlays}
          >
            <div
              className="sheet mb-3 max-h-[88dvh] w-full max-w-[496px] overscroll-contain overflow-y-auto rounded-xl bg-[var(--surface)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--line)]" aria-hidden="true" />
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-[var(--accent)]">
                    SHENYOU
                  </span>
                  <h2 className="mt-1 text-2xl font-semibold">
                    {tx("应用与数据", "앱과 데이터")}
                  </h2>
                </div>
                <button
                  onClick={closeOverlays}
                  className="grid size-11 place-items-center rounded-xl bg-[var(--field)] active:scale-95"
                  aria-label={tx("关闭", "닫기")}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-5 grid gap-2">
                <button
                  onClick={installApp}
                  className="flex min-h-16 items-center gap-3 rounded-xl bg-[var(--field)] p-4 text-left active:scale-[.99]"
                >
                  <DownloadSimple size={20} className="text-[var(--accent)]" />
                  <span>
                    <b className="block text-sm">
                      {tx("添加到手机主屏幕", "휴대폰 홈 화면에 추가")}
                    </b>
                    <small className="text-[var(--muted)]">PWA</small>
                  </span>
                </button>
                <button
                  onClick={exportData}
                  className="flex min-h-16 items-center gap-3 rounded-xl bg-[var(--field)] p-4 text-left active:scale-[.99]"
                >
                  <DownloadSimple size={20} className="text-[var(--accent)]" />
                  <b className="text-sm">
                    {tx("导出收藏、笔记与行程", "저장, 메모와 일정 내보내기")}
                  </b>
                </button>
                <button
                  onClick={() => importRef.current?.click()}
                  className="flex min-h-16 items-center gap-3 rounded-xl bg-[var(--field)] p-4 text-left active:scale-[.99]"
                >
                  <UploadSimple size={20} className="text-[var(--accent)]" />
                  <b className="text-sm">
                    {tx("导入本机备份", "기기 백업 가져오기")}
                  </b>
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={(event) => {
                    importData(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                <button
                  onClick={clearLocalData}
                  className="flex min-h-16 items-center gap-3 rounded-xl bg-[var(--field)] p-4 text-left text-[var(--muted)] active:scale-[.99]"
                >
                  <Trash size={20} />
                  <b className="text-sm">
                    {tx("清除本机数据", "기기 데이터 삭제")}
                  </b>
                </button>
              </div>
              <p className="mt-5 text-xs leading-6 text-[var(--muted)]">
                {tx(
                  "包含 18 个深圳景点的中文与韩文原始讲解。收藏、笔记与路线进度只保存在你的设备。",
                  "선전 18개 명소의 중국어와 한국어 원문 해설을 담았습니다. 저장, 메모와 코스 진행 상황은 이 기기에만 보관됩니다.",
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
