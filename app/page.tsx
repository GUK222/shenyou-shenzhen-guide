"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowClockwise,
  ArrowRight,
  BookmarkSimple,
  CheckCircle,
  Clock,
  Compass,
  Headphones,
  House,
  Info,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  NavigationArrow,
  ShareNetwork,
  Trash,
  X,
} from "@phosphor-icons/react";
import { categories, getPlace, places, tourRoutes, type Place, type TourRoute } from "./data";

type Tab = "home" | "discover" | "routes" | "saved";

type AppState = {
  saved: number[];
  recent: number[];
  activeRouteId: string | null;
  routeProgress: Record<string, number[]>;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "shenyou-app-v2";
const defaultState: AppState = { saved: [], recent: [], activeRouteId: null, routeProgress: {} };
const featuredPlaceIds = [1, 2, 5, 14];

const routeTone: Record<TourRoute["tone"], string> = {
  bay: "route-bay",
  city: "route-city",
  heritage: "route-heritage",
  coast: "route-coast",
};

function PlaceCard({ place, saved, onOpen, onSave }: { place: Place; saved: boolean; onOpen: () => void; onSave: () => void }) {
  return (
    <article className="relative min-h-[168px] rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_12px_30px_rgba(30,68,61,.045)]">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-[var(--soft)] text-[var(--accent)]">
          <MapPin size={21} weight="duotone" />
        </span>
        <button onClick={onSave} className="grid size-9 place-items-center rounded-full text-[var(--muted)] transition active:scale-90" aria-label={saved ? `取消收藏${place.title}` : `收藏${place.title}`}>
          <BookmarkSimple size={19} weight={saved ? "fill" : "regular"} className={saved ? "text-[var(--accent)]" : undefined} />
        </button>
      </div>
      <button onClick={onOpen} className="mt-5 block w-full text-left">
        <span className="text-[11px] font-semibold text-[var(--accent)]">{place.category} / {place.district}</span>
        <h3 className="mt-1 text-[15px] font-semibold leading-5">{place.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{place.meta}</p>
      </button>
    </article>
  );
}

function PlaceRow({ place, onOpen }: { place: Place; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="grid w-full grid-cols-[44px_1fr_auto] items-center gap-3 py-3 text-left transition active:scale-[.99]">
      <span className="grid size-11 place-items-center rounded-lg bg-[var(--soft)] text-[var(--accent)]"><MapPin size={20} weight="duotone" /></span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{place.title}</span>
        <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{place.district} / {place.meta}</span>
      </span>
      <ArrowRight size={17} className="text-[var(--muted)]" />
    </button>
  );
}

function RouteCard({ route, completed, active, onOpen }: { route: TourRoute; completed: number; active: boolean; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className={`${routeTone[route.tone]} block w-full rounded-xl p-5 text-left text-[#f4f8f6] shadow-[0_16px_36px_rgba(17,54,49,.12)] transition active:scale-[.99]`}>
      <div className="flex items-start justify-between gap-4">
        <span className="text-xs font-semibold text-[rgba(244,248,246,.78)]">{route.suggestedTime} / {route.transport}</span>
        {active && <span className="rounded-full bg-[rgba(244,248,246,.16)] px-3 py-1 text-[11px] font-semibold">进行中</span>}
      </div>
      <h3 className="mt-8 text-xl font-semibold tracking-[-0.03em]">{route.title}</h3>
      <p className="mt-1 text-sm text-[rgba(244,248,246,.78)]">{route.subtitle}</p>
      <div className="mt-5 flex items-center justify-between text-xs font-semibold">
        <span>{active ? `已完成 ${completed}/${route.placeIds.length}` : `${route.placeIds.length} 个景点`}</span>
        <span className="inline-flex items-center gap-1.5">查看路线 <ArrowRight size={14} /></span>
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
  const [infoOpen, setInfoOpen] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const linkHandled = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const previousSaved = window.localStorage.getItem("shenyou-saved");
    const stored = window.localStorage.getItem(STORAGE_KEY);
    try {
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppState>;
        const validPlaceIds = new Set(places.map((place) => place.id));
        const routeProgress = Object.fromEntries(tourRoutes.map((route) => {
          const progress = parsed.routeProgress?.[route.id];
          return [route.id, Array.isArray(progress) ? progress.filter((id) => Number.isInteger(id) && route.placeIds.includes(id)) : []];
        }));
        setAppState({
          saved: Array.isArray(parsed.saved) ? parsed.saved.filter((id) => Number.isInteger(id) && validPlaceIds.has(id)) : [],
          recent: Array.isArray(parsed.recent) ? parsed.recent.filter((id) => Number.isInteger(id) && validPlaceIds.has(id)).slice(0, 6) : [],
          activeRouteId: tourRoutes.some((route) => route.id === parsed.activeRouteId) ? parsed.activeRouteId ?? null : null,
          routeProgress,
        });
      } else if (previousSaved) {
        const saved = JSON.parse(previousSaved);
        setAppState((current) => ({ ...current, saved: Array.isArray(saved) ? saved.filter(Number.isInteger) : [] }));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState, storageReady]);

  useEffect(() => {
    if (!storageReady || linkHandled.current) return;
    linkHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "home" || tab === "discover" || tab === "routes" || tab === "saved") setActiveTab(tab);
    const place = places.find((item) => item.slug === params.get("place"));
    const route = tourRoutes.find((item) => item.id === params.get("route"));
    if (place) {
      setSelectedPlace(place);
      setAppState((current) => ({ ...current, recent: [place.id, ...current.recent.filter((id) => id !== place.id)].slice(0, 6) }));
    } else if (route) {
      setSelectedRoute(route);
      setActiveTab("routes");
    }
  }, [storageReady]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    return () => window.removeEventListener("beforeinstallprompt", capturePrompt);
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
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
    };
  }, [selectedPlace, selectedRoute, infoOpen]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const filteredPlaces = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("zh-CN");
    const source = activeTab === "saved" ? places.filter((place) => appState.saved.includes(place.id)) : places;
    return source.filter((place) => {
      const categoryMatch = category === "全部" || place.category === category;
      const queryMatch = `${place.title}${place.category}${place.district}${place.meta}${place.description}`.toLocaleLowerCase("zh-CN").includes(keyword);
      return categoryMatch && queryMatch;
    });
  }, [activeTab, appState.saved, category, query]);

  const activeRoute = tourRoutes.find((route) => route.id === appState.activeRouteId) ?? null;
  const activeProgress = activeRoute ? appState.routeProgress[activeRoute.id] ?? [] : [];
  const recentPlaces = appState.recent.map(getPlace).filter((place): place is Place => Boolean(place));

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }

  function closeOverlays() {
    setSelectedPlace(null);
    setSelectedRoute(null);
    setInfoOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.search = activeTab === "home" ? "" : `?tab=${activeTab}`;
      window.history.replaceState({}, "", url);
    }
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
    setAppState((current) => ({ ...current, recent: [place.id, ...current.recent.filter((id) => id !== place.id)].slice(0, 6) }));
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

  function toggleSaved(id: number) {
    const wasSaved = appState.saved.includes(id);
    setAppState((current) => ({ ...current, saved: wasSaved ? current.saved.filter((item) => item !== id) : [...current.saved, id] }));
    showToast(wasSaved ? "已取消收藏" : "已加入收藏");
  }

  function toggleNarration(place: Place) {
    if (!("speechSynthesis" in window)) {
      showToast("当前浏览器不支持语音讲解");
      return;
    }
    if (speakingId === place.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${place.title}。${place.description}`);
    utterance.lang = "zh-CN";
    utterance.rate = 0.92;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(place.id);
    window.speechSynthesis.speak(utterance);
  }

  function startRoute(route: TourRoute) {
    setAppState((current) => {
      const existing = current.routeProgress[route.id] ?? [];
      const progress = existing.length === route.placeIds.length ? [] : existing;
      return { ...current, activeRouteId: route.id, routeProgress: { ...current.routeProgress, [route.id]: progress } };
    });
    showToast(`已开始${route.title}`);
  }

  function toggleRoutePlace(route: TourRoute, placeId: number) {
    setAppState((current) => {
      const completed = current.routeProgress[route.id] ?? [];
      const next = completed.includes(placeId) ? completed.filter((id) => id !== placeId) : [...completed, placeId];
      return { ...current, routeProgress: { ...current.routeProgress, [route.id]: next } };
    });
  }

  function restartRoute(route: TourRoute) {
    setAppState((current) => ({ ...current, activeRouteId: route.id, routeProgress: { ...current.routeProgress, [route.id]: [] } }));
    showToast("路线进度已重新开始");
  }

  function finishRoute(route: TourRoute) {
    setAppState((current) => ({ ...current, activeRouteId: current.activeRouteId === route.id ? null : current.activeRouteId }));
    closeOverlays();
    showToast("路线已保存到本机");
  }

  async function shareItem(title: string, url: string, text: string) {
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else {
        if (navigator.clipboard) await navigator.clipboard.writeText(url);
        else window.prompt("复制下面的链接", url);
        showToast("链接已复制");
      }
    } catch {
      return;
    }
  }

  async function installApp() {
    if (!installPrompt) {
      showToast("请在浏览器菜单中选择添加到主屏幕");
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") showToast("已开始安装");
    setInstallPrompt(null);
  }

  function clearLocalData() {
    if (!window.confirm("确定清除收藏、最近浏览和路线进度吗？")) return;
    setAppState(defaultState);
    setSelectedRoute(null);
    setInfoOpen(false);
    showToast("本机数据已清除");
  }

  function renderHeader(title?: string, subtitle?: string) {
    return (
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">SHENYOU · 深圳解说</p>
          <h1 className="mt-1 truncate text-lg font-semibold tracking-[-0.025em]">{title ?? "深游"}</h1>
          {subtitle && <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p>}
        </div>
        <button onClick={() => setInfoOpen(true)} className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] transition active:scale-95" aria-label="查看应用说明">
          <Info size={20} />
        </button>
      </header>
    );
  }

  function renderSearch() {
    return (
      <>
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--field)] px-4 py-3.5 focus-within:border-[var(--accent)]">
          <MagnifyingGlass size={20} className="shrink-0 text-[var(--muted)]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]" placeholder="搜索景点、讲解或区域" aria-label="搜索深圳景点" />
          {query && <button onClick={() => setQuery("")} className="grid size-7 place-items-center rounded-full bg-[var(--soft)]" aria-label="清除搜索"><X size={14} /></button>}
        </div>
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition active:scale-95 ${category === item ? "bg-[var(--ink)] text-[var(--surface)]" : "border border-[var(--line)] text-[var(--muted)]"}`}>{item}</button>
          ))}
        </div>
      </>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[var(--canvas)] text-[var(--ink)]">
      <div className="relative mx-auto min-h-[100dvh] max-w-[520px] overflow-hidden bg-[var(--surface)] shadow-[0_0_70px_rgba(23,33,31,.09)]">
        <div className="px-5 pb-28 pt-[max(20px,env(safe-area-inset-top))]">
          {activeTab === "home" && (
            <>
              {renderHeader("今天，从哪一段深圳开始？", "18 个资料景点 / 4 条建议路线")}

              <section className="relative mt-7 min-h-[290px] overflow-hidden rounded-xl bg-[#173a37] text-[#f4f8f6]">
                <img src="/images/riverside.png" alt="深圳湾滨海公共空间" width={1122} height={1402} fetchPriority="high" className="absolute inset-0 size-full object-cover opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a2421]/95 via-[#0a2421]/18 to-transparent" />
                <div className="relative flex min-h-[290px] flex-col justify-end p-5">
                  <p className="text-xs font-medium text-[rgba(244,248,246,.78)]">深圳湾滨海线 / 一日</p>
                  <h2 className="mt-1 max-w-[11ch] text-[28px] font-semibold leading-[1.1] tracking-[-0.04em]">从海风里，读懂深圳。</h2>
                  <button onClick={() => openRoute(tourRoutes[1])} className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-[#f4f8f6] px-4 py-2.5 text-sm font-semibold text-[#12312e] active:scale-[.98]">打开路线 <ArrowRight size={15} /></button>
                </div>
              </section>

              {activeRoute && (
                <section className="mt-7 rounded-xl border border-[var(--accent)]/25 bg-[var(--soft)] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[var(--accent)]">当前行程</p>
                      <h2 className="mt-1 text-lg font-semibold">{activeRoute.title}</h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">完成 {activeProgress.length}/{activeRoute.placeIds.length} 个景点</p>
                    </div>
                    <button onClick={() => openRoute(activeRoute)} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent-ink)]">查看进度</button>
                  </div>
                  <div className="mt-4 flex gap-2" aria-label="行程完成状态">
                    {activeRoute.placeIds.map((placeId) => <CheckCircle key={placeId} size={20} weight={activeProgress.includes(placeId) ? "fill" : "regular"} className={activeProgress.includes(placeId) ? "text-[var(--accent)]" : "text-[var(--muted)]"} />)}
                  </div>
                </section>
              )}

              <section className="mt-9">
                <div className="flex items-end justify-between gap-4">
                  <div><h2 className="text-xl font-semibold tracking-[-0.03em]">今天怎么逛</h2><p className="mt-1 text-sm text-[var(--muted)]">按区域组织，减少无效往返。</p></div>
                  <button onClick={() => changeTab("routes")} className="shrink-0 text-xs font-semibold text-[var(--accent)]">全部路线</button>
                </div>
                <div className="no-scrollbar -mx-5 mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
                  {tourRoutes.map((route) => (
                    <div key={route.id} className="w-[82%] shrink-0 snap-start">
                      <RouteCard route={route} completed={(appState.routeProgress[route.id] ?? []).length} active={appState.activeRouteId === route.id} onOpen={() => openRoute(route)} />
                    </div>
                  ))}
                </div>
              </section>

              {recentPlaces.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-lg font-semibold">最近浏览</h2>
                  <div className="mt-2 divide-y divide-[var(--line)]">{recentPlaces.slice(0, 3).map((place) => <PlaceRow key={place.id} place={place} onOpen={() => openPlace(place)} />)}</div>
                </section>
              )}

              <section className="mt-8">
                <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">资料精选</h2><button onClick={() => changeTab("discover")} className="text-xs font-semibold text-[var(--accent)]">查看 18 个景点</button></div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {featuredPlaceIds.map((id) => getPlace(id)).filter((place): place is Place => Boolean(place)).map((place) => <PlaceCard key={place.id} place={place} saved={appState.saved.includes(place.id)} onOpen={() => openPlace(place)} onSave={() => toggleSaved(place.id)} />)}
                </div>
              </section>
            </>
          )}

          {activeTab === "discover" && (
            <>
              {renderHeader("景点", "按主题、区域或关键词查找")}
              {renderSearch()}
              <section className="mt-7">
                <div className="flex items-end justify-between gap-3"><h2 className="text-xl font-semibold tracking-[-0.03em]">资料里的深圳</h2><span className="text-xs text-[var(--muted)]" aria-live="polite">{filteredPlaces.length} 个结果</span></div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {filteredPlaces.map((place) => <PlaceCard key={place.id} place={place} saved={appState.saved.includes(place.id)} onOpen={() => openPlace(place)} onSave={() => toggleSaved(place.id)} />)}
                </div>
                {filteredPlaces.length === 0 && (
                  <div className="mt-6 rounded-xl border border-dashed border-[var(--line)] px-6 py-12 text-center">
                    <Compass size={30} className="mx-auto text-[var(--accent)]" />
                    <h3 className="mt-3 font-semibold">没有找到对应景点</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">换个关键词或清除分类后再试。</p>
                    <button onClick={() => { setQuery(""); setCategory("全部"); }} className="mt-4 rounded-lg bg-[var(--ink)] px-4 py-2.5 text-xs font-semibold text-[var(--surface)]">清除筛选</button>
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === "routes" && (
            <>
              {renderHeader("路线", "按区域串联景点，行程进度保存在本机")}
              {activeRoute && (
                <section className="mt-7 rounded-xl border border-[var(--accent)]/25 bg-[var(--soft)] p-5">
                  <p className="text-xs font-semibold text-[var(--accent)]">正在进行</p>
                  <h2 className="mt-1 text-xl font-semibold">{activeRoute.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{activeRoute.subtitle}，已完成 {activeProgress.length}/{activeRoute.placeIds.length} 个景点。</p>
                  <button onClick={() => openRoute(activeRoute)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)]">继续行程 <ArrowRight size={15} /></button>
                </section>
              )}
              <section className="mt-8">
                <h2 className="text-xl font-semibold tracking-[-0.03em]">4 条建议路线</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">依据资料景点与区域关系整理，时间为行程规划建议。</p>
                <div className="mt-5 grid gap-4">
                  {tourRoutes.map((route) => <RouteCard key={route.id} route={route} completed={(appState.routeProgress[route.id] ?? []).length} active={appState.activeRouteId === route.id} onOpen={() => openRoute(route)} />)}
                </div>
              </section>
            </>
          )}

          {activeTab === "saved" && (
            <>
              {renderHeader("收藏", `${appState.saved.length} 个景点保存在当前设备`)}
              {renderSearch()}
              <section className="mt-7">
                <div className="flex items-end justify-between gap-3"><h2 className="text-xl font-semibold tracking-[-0.03em]">想去的地方</h2><span className="text-xs text-[var(--muted)]">{filteredPlaces.length} 个结果</span></div>
                {appState.saved.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {filteredPlaces.map((place) => <PlaceCard key={place.id} place={place} saved onOpen={() => openPlace(place)} onSave={() => toggleSaved(place.id)} />)}
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl bg-[var(--field)] px-6 py-12 text-center">
                    <BookmarkSimple size={31} className="mx-auto text-[var(--accent)]" />
                    <h3 className="mt-3 font-semibold">收藏夹还是空的</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">在景点卡片上点收藏，稍后可以快速找到。</p>
                    <button onClick={() => changeTab("discover")} className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)]">去看景点</button>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[520px] border-t border-[var(--line)] bg-[var(--surface)]/94 px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl" aria-label="主导航">
          <div className="grid grid-cols-4">
            {[
              { id: "home", label: "首页", Icon: House },
              { id: "discover", label: "景点", Icon: Compass },
              { id: "routes", label: "路线", Icon: MapTrifold },
              { id: "saved", label: "收藏", Icon: BookmarkSimple },
            ].map(({ id, label, Icon }) => (
              <button key={id} onClick={() => changeTab(id as Tab)} className={`flex flex-col items-center gap-1 py-1.5 text-[10px] font-medium transition active:scale-95 ${activeTab === id ? "text-[var(--accent)]" : "text-[var(--muted)]"}`} aria-current={activeTab === id ? "page" : undefined}>
                <Icon size={22} weight={activeTab === id ? "fill" : "regular"} />{label}
              </button>
            ))}
          </div>
        </nav>

        {toast && <div className="fixed inset-x-5 bottom-24 z-30 mx-auto max-w-[440px] rounded-lg bg-[var(--ink)] px-4 py-3 text-center text-sm font-semibold text-[var(--surface)] shadow-xl" role="status" aria-live="polite">{toast}</div>}

        {selectedPlace && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#071210]/55 px-3" role="dialog" aria-modal="true" aria-label={selectedPlace.title} onClick={closeOverlays}>
            <div className="sheet mb-3 max-h-[88dvh] w-full max-w-[496px] overflow-y-auto rounded-xl bg-[var(--surface)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div><span className="text-xs font-semibold text-[var(--accent)]">{selectedPlace.category} / {selectedPlace.district}</span><h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">{selectedPlace.title}</h2></div>
                <button onClick={closeOverlays} className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--field)]" aria-label="关闭"><X size={18} /></button>
              </div>
              <p className="mt-5 text-sm leading-7 text-[var(--muted)]">{selectedPlace.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <span className="flex items-center gap-2 rounded-lg bg-[var(--field)] p-3"><MapPin size={17} className="shrink-0 text-[var(--accent)]" />深圳市{selectedPlace.district}</span>
                <span className="flex items-center gap-2 rounded-lg bg-[var(--field)] p-3"><Headphones size={17} className="shrink-0 text-[var(--accent)]" />中文语音讲解</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button onClick={() => toggleNarration(selectedPlace)} aria-pressed={speakingId === selectedPlace.id} className="flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-3.5 text-sm font-semibold text-[var(--accent-ink)] active:scale-[.99]"><Headphones size={18} weight="fill" />{speakingId === selectedPlace.id ? "停止讲解" : "开始讲解"}</button>
                <a href={`https://uri.amap.com/search?keyword=${encodeURIComponent(selectedPlace.title)}&city=深圳&view=map&src=shenyou`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-lg border border-[var(--line)] px-3 py-3.5 text-sm font-semibold"><NavigationArrow size={17} weight="fill" />地图导航</a>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => toggleSaved(selectedPlace.id)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--field)] px-3 py-3 text-sm font-semibold"><BookmarkSimple size={17} weight={appState.saved.includes(selectedPlace.id) ? "fill" : "regular"} />{appState.saved.includes(selectedPlace.id) ? "已收藏" : "收藏"}</button>
                <button onClick={() => shareItem(selectedPlace.title, `${window.location.origin}/?place=${selectedPlace.slug}`, selectedPlace.description)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--field)] px-3 py-3 text-sm font-semibold"><ShareNetwork size={17} />分享</button>
              </div>
              {tourRoutes.some((route) => route.placeIds.includes(selectedPlace.id)) && (
                <div className="mt-6 border-t border-[var(--line)] pt-5">
                  <h3 className="text-sm font-semibold">所在路线</h3>
                  <div className="mt-2 divide-y divide-[var(--line)]">
                    {tourRoutes.filter((route) => route.placeIds.includes(selectedPlace.id)).map((route) => <button key={route.id} onClick={() => openRoute(route)} className="flex w-full items-center justify-between gap-3 py-3 text-left"><span><span className="block text-sm font-semibold">{route.title}</span><span className="mt-0.5 block text-xs text-[var(--muted)]">{route.suggestedTime} / {route.placeIds.length} 个景点</span></span><ArrowRight size={16} className="text-[var(--muted)]" /></button>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedRoute && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#071210]/55 px-3" role="dialog" aria-modal="true" aria-label={selectedRoute.title} onClick={closeOverlays}>
            <div className="sheet mb-3 max-h-[90dvh] w-full max-w-[496px] overflow-y-auto rounded-xl bg-[var(--surface)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div><span className="text-xs font-semibold text-[var(--accent)]">{selectedRoute.suggestedTime} / {selectedRoute.transport}</span><h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">{selectedRoute.title}</h2></div>
                <button onClick={closeOverlays} className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--field)]" aria-label="关闭"><X size={18} /></button>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{selectedRoute.description}</p>
              <div className="mt-5 flex items-center gap-4 rounded-lg bg-[var(--field)] p-4 text-xs">
                <span className="inline-flex items-center gap-1.5"><Clock size={16} className="text-[var(--accent)]" />{selectedRoute.suggestedTime}</span>
                <span className="inline-flex items-center gap-1.5"><MapTrifold size={16} className="text-[var(--accent)]" />{selectedRoute.placeIds.length} 个景点</span>
              </div>
              <div className="mt-6">
                <h3 className="text-sm font-semibold">建议顺序</h3>
                <div className="mt-2 divide-y divide-[var(--line)]">
                  {selectedRoute.placeIds.map((placeId, index) => {
                    const place = getPlace(placeId);
                    if (!place) return null;
                    const active = appState.activeRouteId === selectedRoute.id;
                    const complete = (appState.routeProgress[selectedRoute.id] ?? []).includes(placeId);
                    return (
                      <div key={placeId} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 py-3">
                        <button disabled={!active} onClick={() => toggleRoutePlace(selectedRoute, placeId)} className={`grid size-10 place-items-center rounded-full ${complete ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "border border-[var(--line)] text-[var(--muted)]"}`} aria-label={active ? `${complete ? "标记未完成" : "标记已完成"}${place.title}` : `第${index + 1}站`}>
                          {complete ? <CheckCircle size={20} weight="fill" /> : <span className="text-xs font-semibold">{index + 1}</span>}
                        </button>
                        <button onClick={() => openPlace(place)} className="min-w-0 text-left"><span className="block truncate text-sm font-semibold">{place.title}</span><span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{place.district} / {place.meta}</span></button>
                        <ArrowRight size={16} className="text-[var(--muted)]" />
                      </div>
                    );
                  })}
                </div>
              </div>
              {appState.activeRouteId === selectedRoute.id ? (
                <>
                  <button onClick={() => finishRoute(selectedRoute)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--accent-ink)]"><CheckCircle size={18} weight="fill" />{(appState.routeProgress[selectedRoute.id] ?? []).length === selectedRoute.placeIds.length ? "完成路线" : "保存并退出"}</button>
                  <button onClick={() => restartRoute(selectedRoute)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-xs font-semibold text-[var(--muted)]"><ArrowClockwise size={16} />重新开始路线</button>
                </>
              ) : (
                <button onClick={() => startRoute(selectedRoute)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--accent-ink)]"><NavigationArrow size={17} weight="fill" />开始这条路线</button>
              )}
              <button onClick={() => shareItem(selectedRoute.title, `${window.location.origin}/?route=${selectedRoute.id}`, selectedRoute.description)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--field)] py-3 text-sm font-semibold"><ShareNetwork size={17} />分享路线</button>
            </div>
          </div>
        )}

        {infoOpen && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#071210]/55 px-3" role="dialog" aria-modal="true" aria-label="关于深游" onClick={closeOverlays}>
            <div className="sheet mb-3 max-h-[88dvh] w-full max-w-[496px] overflow-y-auto rounded-xl bg-[var(--surface)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div><span className="text-xs font-semibold text-[var(--accent)]">关于深游</span><h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">深圳景点随身讲解</h2></div>
                <button onClick={closeOverlays} className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--field)]" aria-label="关闭"><X size={18} /></button>
              </div>
              <p className="mt-5 text-sm leading-7 text-[var(--muted)]">内容基于你提供的《관광지 해설 자료》深圳章节整理。当前收录 18 个景点，并按真实区域关系组织为 4 条建议路线。</p>
              <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
                <span className="rounded-lg bg-[var(--field)] p-4"><strong className="block text-lg text-[var(--ink)]">18</strong><span className="mt-1 block text-[var(--muted)]">资料景点</span></span>
                <span className="rounded-lg bg-[var(--field)] p-4"><strong className="block text-lg text-[var(--ink)]">4</strong><span className="mt-1 block text-[var(--muted)]">建议路线</span></span>
              </div>
              <div className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {["收藏、最近浏览和路线进度保存在当前设备", "支持中文系统语音讲解与高德地图导航", "支持分享景点、分享路线和添加到手机主屏幕", "资料含中韩双语原稿，当前界面先提供中文版本"].map((item) => <p key={item} className="py-3 text-sm leading-6 text-[var(--muted)]">{item}</p>)}
              </div>
              <button onClick={installApp} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--accent-ink)]"><House size={18} weight="fill" />安装到手机</button>
              <button onClick={clearLocalData} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-xs font-semibold text-[var(--muted)]"><Trash size={16} />清除本机数据</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
