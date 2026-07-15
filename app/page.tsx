"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowClockwise,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookmarkSimple,
  Buildings,
  CalendarDots,
  CaretDown,
  CheckCircle,
  Clock,
  Compass,
  Copy,
  DownloadSimple,
  House,
  IdentificationCard,
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
  SunHorizon,
  Ticket,
  Train,
  Trash,
  UploadSimple,
  UserCircle,
  Wallet,
  WifiHigh,
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
import { CityMap, mainlandMapUrl } from "./CityMap";
import { guideSkills, learningGoals, quizQuestions } from "./learning-data";
import {
  districtStories,
  estimateTravelMinutes,
  photoCredits,
  themedCollections,
  travelDetailFor,
  travelToolkits,
} from "./travel-data";

type Tab = "home" | "discover" | "map" | "planner" | "saved";
type SavedView = "learned" | "favorites" | "notes";
type PlaceView = "grid" | "list";
type PracticeMode = "quiz" | "cards" | "rehearsal";

type AppState = {
  language: Language;
  saved: number[];
  learned: number[];
  visited: number[];
  recent: number[];
  plan: number[];
  notes: Record<string, string>;
  activeRouteId: string | null;
  routeProgress: Record<string, number[]>;
  quizBest: number;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "shenyou-app-v4";
const OLD_STORAGE_KEY = "shenyou-app-v3";
const BASE_PATH = typeof window !== "undefined" && window.location.pathname.startsWith("/shenyou-shenzhen-guide")
  ? "/shenyou-shenzhen-guide"
  : "";
const defaultState: AppState = {
  language: "zh",
  saved: [],
  learned: [],
  visited: [],
  recent: [],
  plan: [],
  notes: {},
  activeRouteId: null,
  routeProgress: {},
  quizBest: 0,
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
    learned: validIds(input.learned),
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
    quizBest:
      typeof input.quizBest === "number" && Number.isFinite(input.quizBest)
        ? Math.max(0, Math.min(quizQuestions.length, Math.floor(input.quizBest)))
        : 0,
  };
}

function PlaceCard({
  place,
  language,
  saved,
  learned,
  onOpen,
  onSave,
}: {
  place: Place;
  language: Language;
  saved: boolean;
  learned: boolean;
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
  const detail = travelDetailFor(place.id);
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_12px_34px_rgba(30,68,61,.06)] transition active:scale-[.99]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--field)]">
        <button
          onClick={onOpen}
          className="block size-full overflow-hidden text-left"
          aria-label={pick(language, `查看${title}`, `${title} 보기`)}
        >
          <img
            src={`${BASE_PATH}${detail?.image ?? "/images/riverside.png"}`}
            alt={title}
            width={640}
            height={480}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition duration-500 group-hover:scale-[1.025]"
          />
        </button>
        <button
          onClick={onSave}
          className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-xl border border-white/30 bg-[#0b1715]/70 text-white shadow-lg backdrop-blur-md transition active:scale-90"
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
      <button onClick={onOpen} className="block w-full p-4 text-left">
        <span className="text-[11px] font-semibold text-[var(--accent)]">
          {guide
            ? pick(language, guide.categoryZh, guide.categoryKo)
            : place.category}{" "}
          /{" "}
          {guide
            ? pick(language, guide.districtZh, guide.districtKo)
            : place.district}
        </span>
        <h3 className="mt-1.5 text-base font-semibold leading-5">{title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
          {secondary}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {travelMeta(language, guide?.duration ?? "1-2小时")}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <Train size={12} /> {pick(language, "地铁可达", "지하철 이용")}
          </span>
          {learned && (
            <span className="text-[var(--accent)]">
              {pick(language, "已掌握", "학습 완료")}
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
  const detail = travelDetailFor(place.id);
  return (
    <button
      onClick={onOpen}
      className="grid min-h-24 w-full grid-cols-[72px_1fr_auto] items-center gap-3 rounded-2xl border border-transparent p-2 text-left transition hover:border-[var(--line)] hover:bg-[var(--field)] active:scale-[.99]"
    >
      <span className="h-20 overflow-hidden rounded-xl bg-[var(--field)]">
        <img
          src={`${BASE_PATH}${detail?.image ?? "/images/riverside.png"}`}
          alt=""
          width={180}
          height={180}
          loading="lazy"
          className="size-full object-cover"
        />
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
        <span className="mt-1 block truncate text-xs text-[var(--muted)]">
          {guide
            ? language === "ko"
              ? guide.titleZh
              : guide.titleKo
            : place.meta}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-[var(--muted)]">
          <Clock size={11} /> {travelMeta(language, guide?.duration ?? "1-2小时")}
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

function ToolkitIcon({ id, size = 21 }: { id: string; size?: number }) {
  const Icon =
    id === "payment"
      ? Wallet
      : id === "transport"
        ? Train
        : id === "border"
          ? IdentificationCard
          : WifiHigh;
  return <Icon size={size} weight="duotone" />;
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
          {pick(language, "查看路径", "학습 코스 보기")} <ArrowRight size={14} />
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
  const [savedView, setSavedView] = useState<SavedView>("learned");
  const [placeView, setPlaceView] = useState<PlaceView>("grid");
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("quiz");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [practiceExitOpen, setPracticeExitOpen] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
  const [expandedToolkit, setExpandedToolkit] = useState<string | null>("payment");
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
    setPracticeExitOpen(false);
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
        tab === "map" ||
        tab === "planner" ||
        tab === "saved"
      )
        setActiveTab(tab);
      else if (tab === "routes") setActiveTab("home");
      const place = places.find((item) => item.slug === params.get("place"));
      const route = tourRoutes.find((item) => item.id === params.get("route"));
      if (place) openPlace(place);
      else if (route) {
        setSelectedRoute(route);
        setActiveTab("home");
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
    const overlayOpen = Boolean(selectedPlace || selectedRoute || infoOpen || practiceExitOpen);
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
  }, [selectedPlace, selectedRoute, infoOpen, practiceExitOpen, closeOverlays]);

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
    const collection = themedCollections.find((item) => item.id === collectionFilter);
    return source.filter((place) => {
      const guide = guideFor(place.id);
      const categoryMatch = category === "全部" || place.category === category;
      const collectionMatch = !collection || collection.placeIds.includes(place.id);
      const queryMatch =
        !keyword ||
        `${place.title}${place.category}${place.district}${place.meta}${place.description}${guide?.search ?? ""}`
          .toLocaleLowerCase()
          .includes(keyword);
      return categoryMatch && collectionMatch && queryMatch;
    });
  }, [activeTab, appState.saved, category, collectionFilter, query, savedView]);

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
  const nextCourse =
    recentPlaces.find((place) => !appState.learned.includes(place.id)) ??
    places.find((place) => !appState.learned.includes(place.id)) ??
    places[0];
  const currentQuestion = quizQuestions[questionIndex];
  const currentCard = places[cardIndex % places.length];

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }

  async function copyText(text: string) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        // Some mobile webviews expose Clipboard API but reject the write.
      }
    }

    const field = document.createElement("textarea");
    field.value = text;
    field.readOnly = true;
    field.style.position = "fixed";
    field.style.inset = "0 auto auto -9999px";
    document.body.appendChild(field);
    field.focus();
    field.select();
    field.setSelectionRange(0, field.value.length);
    const copied = document.execCommand("copy");
    field.remove();
    if (!copied) throw new Error("Copy is unavailable");
  }

  function setLanguage(next: Language) {
    setAppState((current) => ({ ...current, language: next }));
  }

  function changeTab(tab: Tab) {
    closeOverlays();
    setActiveTab(tab);
    setQuery("");
    setCategory("全部");
    setCollectionFilter(null);
    const url = new URL(window.location.href);
    url.search = tab === "home" ? "" : `?tab=${tab}`;
    window.history.replaceState({}, "", url);
    window.scrollTo({ top: 0 });
  }

  function openCollection(id: string) {
    closeOverlays();
    setActiveTab("discover");
    setCollectionFilter(id);
    setCategory("全部");
    setQuery("");
    const url = new URL(window.location.href);
    url.search = "?tab=discover";
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

  function toggleList(key: "saved" | "learned" | "visited" | "plan", id: number) {
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

  function answerQuestion(index: number) {
    if (selectedAnswer !== null || quizFinished) return;
    setSelectedAnswer(index);
    if (index === currentQuestion.answer) setQuizScore((score) => score + 1);
  }

  function nextQuestion() {
    if (selectedAnswer === null) return;
    const nextScore = quizScore;
    if (questionIndex === quizQuestions.length - 1) {
      setQuizFinished(true);
      setAppState((current) => ({
        ...current,
        quizBest: Math.max(current.quizBest, nextScore),
      }));
      return;
    }
    setQuestionIndex((index) => index + 1);
    setSelectedAnswer(null);
  }

  function resetQuiz() {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
  }

  function openPractice(placeId?: number, mode: PracticeMode = "quiz") {
    closeOverlays();
    setPracticeMode(mode);
    if (placeId) {
      const match = quizQuestions.findIndex((question) => question.placeId === placeId);
      if (match >= 0) setQuestionIndex(match);
    }
    setSelectedAnswer(null);
    setQuizFinished(false);
    setActiveTab("planner");
    const url = new URL(window.location.href);
    url.search = "?tab=planner";
    window.history.replaceState({}, "", url);
    window.scrollTo({ top: 0 });
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

  function applyRoutePlan(route: TourRoute) {
    setAppState((current) => ({
      ...current,
      plan: route.placeIds,
      activeRouteId: route.id,
    }));
    showToast(tx("已生成建议行程", "추천 일정을 만들었습니다"));
  }

  async function sharePlan() {
    if (!plannedPlaces.length) {
      showToast(tx("请先添加景点", "먼저 명소를 추가하세요"));
      return;
    }
    const title = tx("我的深圳行程", "나의 선전 일정");
    const text = plannedPlaces
      .map((place, index) => {
        const guide = guideFor(place.id);
        return `${index + 1}. ${pick(language, guide?.titleZh ?? place.title, guide?.titleKo ?? place.title)}`;
      })
      .join("\n");
    const url = new URL(window.location.href);
    url.search = "?tab=planner";
    try {
      if (navigator.share) await navigator.share({ title, text, url: url.href });
      else {
        await copyText(`${title}\n${text}\n${url.href}`);
        showToast(tx("行程已复制", "일정을 복사했습니다"));
      }
    } catch {
      return;
    }
  }

  async function copyChineseCard(place: Place) {
    const guide = guideFor(place.id);
    const detail = travelDetailFor(place.id);
    const text = `${guide?.titleZh ?? place.title}\n${detail?.metroZh ?? place.district}`;
    try {
      await copyText(text);
      showToast(tx("中文地点卡已复制", "중국어 장소 카드를 복사했습니다"));
    } catch {
      showToast(tx("请长按复制中文地点", "중국어 장소를 길게 눌러 복사하세요"));
    }
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
    showToast(tx("学习路径已开始", "학습 코스를 시작했습니다"));
  }

  function toggleRoutePlace(route: TourRoute, placeId: number) {
    setAppState((current) => {
      const completed = current.routeProgress[route.id] ?? [];
      const next = completed.includes(placeId)
        ? completed.filter((id) => id !== placeId)
        : [...completed, placeId];
      return {
        ...current,
        learned: next.includes(placeId)
          ? [...new Set([...current.learned, placeId])]
          : current.learned,
        routeProgress: { ...current.routeProgress, [route.id]: next },
      };
    });
  }

  async function shareItem(title: string, text: string) {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else {
        await copyText(url);
        showToast(tx("链接已复制", "링크를 복사했습니다"));
      }
    } catch {
      return;
    }
  }

  function exportData() {
    const blob = new Blob(
      [JSON.stringify({ version: 4, state: appState }, null, 2)],
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
          "确定清除学习进度、收藏和备课笔记吗？",
          "학습 진도, 저장과 수업 준비 메모를 모두 삭제할까요?",
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
            SHENYOU / 导游学院
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
      learned={appState.learned.includes(place.id)}
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
                "今天，练哪一段讲解？",
                "오늘은 어떤 해설을 연습할까요?",
                "深圳中韩双语导游学习与备课",
                "선전 중한 이중언어 가이드 학습과 수업 준비",
              )}
              <section className="relative mt-6 min-h-[310px] overflow-hidden rounded-2xl bg-[#173a37] text-[#f4f8f6]">
                <img
                  src={`${BASE_PATH}${travelDetailFor(nextCourse.id)?.image ?? "/images/places/shenzhen-bay.jpg"}`}
                  alt={pick(language, guideFor(nextCourse.id)?.titleZh ?? nextCourse.title, guideFor(nextCourse.id)?.titleKo ?? nextCourse.title)}
                  width={1200}
                  height={800}
                  fetchPriority="high"
                  decoding="async"
                  className="absolute inset-0 size-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071b19]/95 via-[#071b19]/18 to-[#071b19]/10" />
                <div className="relative flex min-h-[310px] flex-col justify-end p-6">
                  <p className="text-xs font-medium text-[rgba(244,248,246,.78)]">
                    {tx("今日学习 / 约 5 分钟", "오늘의 학습 / 약 5분")}
                  </p>
                  <h2 className="mt-2 max-w-[13ch] text-[30px] font-semibold leading-[1.08] tracking-[-0.045em]">
                    {pick(language, guideFor(nextCourse.id)?.titleZh ?? nextCourse.title, guideFor(nextCourse.id)?.titleKo ?? nextCourse.title)}
                  </h2>
                  <p className="mt-2 text-sm text-[rgba(244,248,246,.78)]">
                    {tx("读讲解词，记关键事实，完成一次自测。", "해설문을 읽고 핵심 사실을 익힌 뒤 퀴즈를 풀어 보세요.")}
                  </p>
                  <button
                    onClick={() => openPlace(nextCourse)}
                    className="mt-5 inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-[#f4f8f6] px-4 py-3 text-sm font-semibold text-[#12312e] active:scale-[.98]"
                  >
                    {tx("继续学习", "계속 학습")} <ArrowRight size={15} />
                  </button>
                </div>
              </section>
              <section className="mt-4 grid grid-cols-4 gap-2" aria-label={tx("学习概览", "학습 개요")}>
                <button
                  onClick={() => {
                    setSavedView("learned");
                    changeTab("saved");
                  }}
                  className="min-h-24 rounded-2xl bg-[var(--field)] p-3 text-left active:scale-[.98]"
                >
                  <CheckCircle size={20} className="text-[var(--accent)]" />
                  <b className="mt-3 block text-sm">{appState.learned.length}/18</b>
                  <span className="text-[10px] text-[var(--muted)]">
                    {tx("已学课程", "완료 강의")}
                  </span>
                </button>
                <button
                  onClick={() => openPractice(undefined, "quiz")}
                  className="min-h-24 rounded-2xl bg-[var(--field)] p-3 text-left active:scale-[.98]"
                >
                  <IdentificationCard size={20} className="text-[var(--accent)]" />
                  <b className="mt-3 block text-sm">{appState.quizBest}/{quizQuestions.length}</b>
                  <span className="text-[10px] text-[var(--muted)]">
                    {tx("自测最佳", "최고 점수")}
                  </span>
                </button>
                <button
                  onClick={() => changeTab("discover")}
                  className="min-h-24 rounded-2xl bg-[var(--field)] p-3 text-left active:scale-[.98]"
                >
                  <Buildings size={20} className="text-[var(--accent)]" />
                  <b className="mt-3 block text-sm">18</b>
                  <span className="text-[10px] text-[var(--muted)]">
                    {tx("讲解课程", "해설 강의")}
                  </span>
                </button>
                <button
                  onClick={() => openPractice(undefined, "cards")}
                  className="min-h-24 rounded-2xl bg-[var(--field)] p-3 text-left active:scale-[.98]"
                >
                  <Shuffle size={20} className="text-[var(--accent)]" />
                  <b className="mt-3 block text-sm">中 / 한</b>
                  <span className="text-[10px] text-[var(--muted)]">
                    {tx("双语卡片", "이중언어 카드")}
                  </span>
                </button>
              </section>
              {activeRoute && (
                <section className="mt-6 rounded-xl border border-[var(--accent)]/25 bg-[var(--soft)] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[var(--accent)]">
                        {tx("当前学习路径", "현재 학습 코스")}
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
                      {tx("查看路径", "코스 보기")}
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
                <h2 className="text-xl font-semibold tracking-[-0.03em]">
                  {tx("导游核心能力", "가이드 핵심 역량")}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {tx("课程围绕讲得准、说得清、带得顺来组织。", "정확한 지식, 명확한 표현과 매끄러운 인솔을 중심으로 구성했습니다.")}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {guideSkills.map((skill, index) => (
                    <button
                      key={skill.id}
                      onClick={() => index === 2 ? changeTab("map") : index === 3 ? openPractice(undefined, "rehearsal") : changeTab("discover")}
                      className="min-h-32 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left active:scale-[.99]"
                    >
                      <span className="text-xs font-semibold text-[var(--accent)]">0{index + 1}</span>
                      <b className="mt-6 block text-base">{tx(skill.zh, skill.ko)}</b>
                      <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{tx(skill.noteZh, skill.noteKo)}</span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="mt-8">
                <h2 className="text-xl font-semibold tracking-[-0.03em]">
                  {tx("主题学习路径", "주제별 학습 코스")}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {tx("把相关景点串起来，形成完整的城市讲解逻辑。", "관련 명소를 연결해 완성도 있는 도시 해설 흐름을 만드세요.")}
                </p>
                <div className="no-scrollbar -mx-5 mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
                  {themedCollections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => openCollection(collection.id)}
                      className="w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-left active:scale-[.99]"
                    >
                      <img
                        src={`${BASE_PATH}${collection.image}`}
                        alt={tx(collection.titleZh, collection.titleKo)}
                        width={640}
                        height={360}
                        loading="lazy"
                        className="aspect-[16/9] w-full object-cover"
                      />
                      <span className="block p-4">
                        <b className="block text-base">{tx(collection.titleZh, collection.titleKo)}</b>
                        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                          {tx(collection.subtitleZh, collection.subtitleKo)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="mt-8">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.03em]">
                      {tx("线路讲解训练", "코스 해설 훈련")}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {tx(
                        "学习集合、转场与整条线路的叙事顺序。",
                        "집합, 이동과 전체 코스의 설명 순서를 익히세요.",
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => changeTab("planner")}
                    className="text-xs font-semibold text-[var(--accent)]"
                  >
                    {tx("开始练习", "연습 시작")}
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
              <section className="mt-8">
                <h2 className="text-xl font-semibold tracking-[-0.03em]">
                  {tx("按片区备课", "지역별 수업 준비")}
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {districtStories.map((district, index) => (
                    <button
                      key={district.zh}
                      onClick={() => {
                        setActiveTab("discover");
                        setCollectionFilter(null);
                        setQuery(district.zh);
                        setCategory("全部");
                        window.scrollTo({ top: 0 });
                      }}
                      className={`min-h-36 rounded-2xl p-4 text-left active:scale-[.99] ${index === 0 ? "col-span-2 bg-[var(--ink)] text-[var(--surface)]" : "bg-[var(--field)]"}`}
                    >
                      <Buildings size={21} className={index === 0 ? "text-[var(--accent)]" : "text-[var(--accent)]"} />
                      <b className="mt-7 block text-lg">{tx(district.zh, district.ko)}</b>
                      <span className={`mt-1 block text-xs leading-5 ${index === 0 ? "opacity-70" : "text-[var(--muted)]"}`}>
                        {tx(district.noteZh, district.noteKo)}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="mt-8">
                <h2 className="text-xl font-semibold tracking-[-0.03em]">
                  {tx("导游现场工具箱", "가이드 현장 도구")}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {tx("支付、交通、通关和网络，带团前集中复习。", "결제, 교통, 출입경과 통신을 인솔 전에 복습하세요.")}
                </p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)]">
                  {travelToolkits.map((toolkit) => {
                    const open = expandedToolkit === toolkit.id;
                    return (
                      <div key={toolkit.id} className="border-b border-[var(--line)] last:border-b-0">
                        <button
                          onClick={() => setExpandedToolkit(open ? null : toolkit.id)}
                          aria-expanded={open}
                          className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left active:bg-[var(--field)]"
                        >
                          <span className="grid size-10 place-items-center rounded-xl bg-[var(--soft)] text-[var(--accent)]">
                            <ToolkitIcon id={toolkit.id} />
                          </span>
                          <b className="flex-1 text-sm">{tx(toolkit.titleZh, toolkit.titleKo)}</b>
                          <CaretDown size={16} className={`text-[var(--muted)] transition ${open ? "rotate-180" : ""}`} />
                        </button>
                        {open && (
                          <p className="px-4 pb-4 pl-[68px] text-sm leading-6 text-[var(--muted)]">
                            {tx(toolkit.bodyZh, toolkit.bodyKo)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
              {recentPlaces.length > 0 && (
                <section className="mt-7">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      {tx("继续学习", "계속 학습")}
                    </h2>
                    <button
                      onClick={() => changeTab("saved")}
                      className="text-xs font-semibold text-[var(--accent)]"
                    >
                      {tx("学习记录", "학습 기록")}
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
                    {tx("重点讲解课程", "핵심 해설 강의")}
                  </h2>
                  <button
                    onClick={() => changeTab("discover")}
                    className="text-xs font-semibold text-[var(--accent)]"
                  >
                    {tx("查看 18 门课程", "18개 강의 보기")}
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
                "讲解词课程库",
                "해설문 강의실",
                "按景点学习中文要点与韩文讲解",
                "명소별 중국어 핵심과 한국어 해설 학습",
              )}
              {renderSearch()}
              {collectionFilter && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[var(--soft)] p-4">
                  <div>
                    <p className="text-xs font-semibold text-[var(--accent)]">
                      {tx("主题筛选", "테마 필터")}
                    </p>
                    <b className="mt-1 block text-sm">
                      {(() => {
                        const item = themedCollections.find((collection) => collection.id === collectionFilter);
                        return item ? tx(item.titleZh, item.titleKo) : "";
                      })()}
                    </b>
                  </div>
                  <button
                    onClick={() => setCollectionFilter(null)}
                    className="grid size-10 place-items-center rounded-xl bg-[var(--surface)] active:scale-95"
                    aria-label={tx("清除主题筛选", "테마 필터 지우기")}
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
              <button
                onClick={() => {
                  setActiveTab("map");
                  window.scrollTo({ top: 0 });
                }}
                className="mt-4 flex min-h-16 w-full items-center gap-3 rounded-2xl bg-[var(--ink)] p-4 text-left text-[var(--surface)] active:scale-[.99]"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-ink)]">
                  <MapTrifold size={20} weight="duotone" />
                </span>
                <span className="flex-1">
                  <b className="block text-sm">{tx("进入实地认路", "현장 동선 익히기")}</b>
                  <small className="mt-1 block opacity-70">{tx("熟悉集合点、片区和转场位置", "집합 장소, 지역과 이동 위치를 익히세요")}</small>
                </span>
                <ArrowRight size={17} />
              </button>
              <section className="mt-7">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.03em]">
                      {tx("全部课程", "전체 강의")}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--muted)]" aria-live="polite">
                      {tx(
                        `找到 ${filteredPlaces.length} 门课程`,
                        `${filteredPlaces.length}개 강의를 찾았습니다`,
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
                {plannedPlaces.length > 0 && (
                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-[var(--soft)] p-4 text-xs text-[var(--muted)]">
                    <span>{tx("交通时间为距离估算，请以实时导航为准。", "이동 시간은 거리 기준 예상치이며 실시간 길찾기를 확인하세요.")}</span>
                    <button
                      onClick={() => changeTab("map")}
                      className="ml-3 shrink-0 font-semibold text-[var(--accent)]"
                    >
                      {tx("看地图", "지도")}
                    </button>
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === "map" && (
            <>
              {renderHeader(
                "实地认路",
                "현장 동선",
                "用高德或百度熟悉集合点和转场位置",
                "가오더 또는 바이두로 집합 장소와 이동 위치를 익히세요",
              )}
              {renderSearch()}
              <section className="mt-5">
                <CityMap
                  places={filteredPlaces}
                  language={language}
                />
                <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{tx(`${filteredPlaces.length} 个地点`, `${filteredPlaces.length}개 장소`)}</span>
                  <span>{tx("支持高德与百度地图", "가오더 및 바이두 지도 지원")}</span>
                </div>
              </section>
              <section className="mt-8">
                <h2 className="text-lg font-semibold">{tx("集合点与导航", "집합 장소와 길찾기")}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {tx("点照片查看介绍，点地图按钮直接定位。", "사진은 상세 정보, 지도 버튼은 위치를 바로 엽니다.")}
                </p>
                <div className="mt-3 grid gap-2">
                  {filteredPlaces.map((place) => {
                    const guide = guideFor(place.id);
                    const detail = travelDetailFor(place.id);
                    const title = guide ? pick(language, guide.titleZh, guide.titleKo) : place.title;
                    return (
                      <article
                        key={place.id}
                        className="grid grid-cols-[1fr_auto] gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2"
                      >
                        <button
                          onClick={() => openPlace(place)}
                          className="grid min-w-0 grid-cols-[68px_1fr] items-center gap-3 rounded-xl text-left active:scale-[.99]"
                          aria-label={tx(`查看${title}介绍`, `${title} 상세 보기`)}
                        >
                          <span className="h-16 overflow-hidden rounded-xl bg-[var(--field)]">
                            <img
                              src={`${BASE_PATH}${detail?.image ?? "/images/riverside.png"}`}
                              alt=""
                              width={160}
                              height={160}
                              loading="lazy"
                              className="size-full object-cover"
                            />
                          </span>
                          <span className="min-w-0">
                            <b className="block truncate text-sm">{title}</b>
                            <small className="mt-1 block truncate text-[var(--muted)]">
                              {guide ? pick(language, guide.districtZh, guide.districtKo) : place.district}
                            </small>
                          </span>
                        </button>
                        <div className="grid grid-cols-2 gap-1">
                          <a
                            href={mainlandMapUrl(place, "amap")}
                            target="_blank"
                            rel="noreferrer"
                            className="grid min-h-14 min-w-12 place-items-center rounded-xl bg-[var(--soft)] px-2 text-[10px] font-semibold text-[var(--accent)] active:scale-95"
                            aria-label={tx(`用高德地图打开${title}`, `가오더 지도에서 ${title} 열기`)}
                          >
                            <NavigationArrow size={17} weight="fill" />
                            {tx("高德", "가오더")}
                          </a>
                          <a
                            href={mainlandMapUrl(place, "baidu")}
                            target="_blank"
                            rel="noreferrer"
                            className="grid min-h-14 min-w-12 place-items-center rounded-xl bg-[var(--field)] px-2 text-[10px] font-semibold text-[var(--muted)] active:scale-95"
                            aria-label={tx(`用百度地图打开${title}`, `바이두 지도에서 ${title} 열기`)}
                          >
                            <MapPin size={17} weight="fill" />
                            {tx("百度", "바이두")}
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
              <section className="mt-8">
                <h2 className="text-lg font-semibold">{tx("按区域查看", "지역별 보기")}</h2>
                <div className="mt-3 grid gap-2">
                  {districtStories.map((district) => (
                    <button
                      key={district.zh}
                      onClick={() => {
                        setQuery(district.zh);
                        setCategory("全部");
                      }}
                      className="flex min-h-16 items-center gap-3 rounded-2xl bg-[var(--field)] p-4 text-left active:scale-[.99]"
                    >
                      <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface)] text-[var(--accent)]">
                        <Buildings size={19} />
                      </span>
                      <span className="flex-1">
                        <b className="block text-sm">{tx(district.zh, district.ko)}</b>
                        <small className="mt-1 block text-[var(--muted)]">{tx(district.noteZh, district.noteKo)}</small>
                      </span>
                      <span className="text-xs font-semibold text-[var(--accent)]">{district.placeIds.length}</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === "planner" && (
            <>
              {renderHeader(
                "练习中心",
                "연습 센터",
                "用短时自测、双语卡片和复述训练巩固讲解",
                "짧은 퀴즈, 이중언어 카드와 말하기 연습으로 해설을 익히세요",
              )}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setPracticeExitOpen(true)}
                  className="flex min-h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--muted)] active:scale-95"
                >
                  <X size={15} /> {tx("退出练习", "연습 나가기")}
                </button>
              </div>
              <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto" role="tablist" aria-label={tx("练习方式", "연습 방식")}>
                {([
                  { id: "quiz", zh: "知识自测", ko: "지식 퀴즈", Icon: IdentificationCard },
                  { id: "cards", zh: "双语卡片", ko: "이중언어 카드", Icon: Copy },
                  { id: "rehearsal", zh: "讲解复述", ko: "해설 말하기", Icon: NotePencil },
                ] as const).map(({ id, zh, ko, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPracticeMode(id)}
                    role="tab"
                    aria-selected={practiceMode === id}
                    className={`flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${practiceMode === id ? "bg-[var(--ink)] text-[var(--surface)]" : "bg-[var(--field)] text-[var(--muted)]"}`}
                  >
                    <Icon size={17} /> {tx(zh, ko)}
                  </button>
                ))}
              </div>

              {practiceMode === "quiz" && (
                <section className="mt-6">
                  {!quizFinished ? (
                    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_12px_34px_rgba(30,68,61,.06)]">
                      <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
                        <span>{tx("今日强化", "오늘의 강화 학습")}</span>
                        <span>{questionIndex + 1}/{quizQuestions.length}</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--field)]">
                        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${((questionIndex + 1) / quizQuestions.length) * 100}%` }} />
                      </div>
                      <h2 className="mt-6 text-xl font-semibold leading-8">
                        {tx(currentQuestion.questionZh, currentQuestion.questionKo)}
                      </h2>
                      <div className="mt-5 grid gap-2">
                        {(language === "ko" ? currentQuestion.optionsKo : currentQuestion.optionsZh).map((option, index) => {
                          const answered = selectedAnswer !== null;
                          const correct = index === currentQuestion.answer;
                          const selected = selectedAnswer === index;
                          return (
                            <button
                              key={option}
                              onClick={() => answerQuestion(index)}
                              disabled={answered}
                              className={`min-h-14 rounded-xl border p-4 text-left text-sm font-medium ${answered && correct ? "border-[var(--accent)] bg-[var(--soft)] text-[var(--accent)]" : answered && selected ? "border-[#b65b52] bg-[#b65b52]/10" : "border-[var(--line)] bg-[var(--field)]"}`}
                            >
                              <span className="mr-3 text-xs opacity-60">{String.fromCharCode(65 + index)}</span>
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      {selectedAnswer !== null && (
                        <div className="mt-4 rounded-xl bg-[var(--soft)] p-4">
                          <b className="text-sm text-[var(--accent)]">
                            {selectedAnswer === currentQuestion.answer ? tx("回答正确", "정답입니다") : tx("再记一次", "다시 기억해 보세요")}
                          </b>
                          <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                            {tx(currentQuestion.explainZh, currentQuestion.explainKo)}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={nextQuestion}
                        disabled={selectedAnswer === null}
                        className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-40"
                      >
                        {questionIndex === quizQuestions.length - 1 ? tx("查看结果", "결과 보기") : tx("下一题", "다음 문제")}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--surface)]">
                      <p className="text-xs font-semibold opacity-65">{tx("本轮完成", "이번 학습 완료")}</p>
                      <h2 className="mt-3 text-4xl font-semibold">{quizScore}/{quizQuestions.length}</h2>
                      <p className="mt-3 text-sm leading-6 opacity-75">
                        {quizScore >= 5 ? tx("基础知识掌握稳定，可以进入讲解复述。", "기초 지식이 안정적입니다. 해설 말하기로 넘어가세요.") : tx("建议重做错题，并回到对应课程复习。", "틀린 문제를 다시 풀고 관련 강의를 복습해 보세요.")}
                      </p>
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <button onClick={resetQuiz} className="min-h-12 rounded-xl bg-[var(--surface)] text-sm font-semibold text-[var(--ink)]">{tx("重新自测", "다시 풀기")}</button>
                        <button onClick={() => setPracticeMode("rehearsal")} className="min-h-12 rounded-xl border border-white/20 text-sm font-semibold">{tx("去复述", "말하기 연습")}</button>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {practiceMode === "cards" && (
                <section className="mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{tx("景点双语卡片", "명소 이중언어 카드")}</h2>
                      <p className="mt-1 text-xs text-[var(--muted)]">{tx("先回忆，再翻面核对。", "먼저 떠올린 뒤 뒤집어 확인하세요.")}</p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--muted)]">{cardIndex + 1}/18</span>
                  </div>
                  <button
                    onClick={() => setCardFlipped((value) => !value)}
                    className="mt-4 flex min-h-[340px] w-full flex-col justify-between rounded-2xl bg-[var(--ink)] p-6 text-left text-[var(--surface)] shadow-[0_18px_48px_rgba(14,47,42,.16)]"
                    aria-label={tx("翻转学习卡片", "학습 카드 뒤집기")}
                  >
                    <span className="text-xs font-semibold opacity-60">{cardFlipped ? tx("讲解提示", "해설 힌트") : tx("中文名称", "중국어 명칭")}</span>
                    {cardFlipped ? (
                      <span>
                        <b className="block text-2xl">{guideFor(currentCard.id)?.titleKo}</b>
                        <span className="mt-4 block text-sm leading-7 opacity-75">{language === "ko" ? guideFor(currentCard.id)?.ko[0] : currentCard.description}</span>
                        <span className="mt-5 inline-flex rounded-full bg-white/10 px-3 py-2 text-xs">{tx("再点一次返回正面", "한 번 더 눌러 앞면 보기")}</span>
                      </span>
                    ) : (
                      <span>
                        <b className="block text-4xl leading-tight">{guideFor(currentCard.id)?.titleZh ?? currentCard.title}</b>
                        <span className="mt-3 block text-sm opacity-70">{currentCard.district} / {currentCard.category}</span>
                        <span className="mt-8 inline-flex items-center gap-2 text-xs font-semibold"><ArrowClockwise size={16} /> {tx("点卡片查看韩文与要点", "카드를 눌러 한국어와 핵심 보기")}</span>
                      </span>
                    )}
                    <span className="text-xs opacity-55">SHENYOU GUIDE LAB</span>
                  </button>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setCardIndex((index) => Math.max(0, index - 1)); setCardFlipped(false); }}
                      disabled={cardIndex === 0}
                      className="min-h-12 rounded-xl bg-[var(--field)] text-sm font-semibold disabled:opacity-35"
                    >
                      {tx("上一张", "이전 카드")}
                    </button>
                    <button
                      onClick={() => { setCardIndex((index) => (index + 1) % places.length); setCardFlipped(false); }}
                      className="min-h-12 rounded-xl bg-[var(--accent)] text-sm font-semibold text-[var(--accent-ink)]"
                    >
                      {tx("下一张", "다음 카드")}
                    </button>
                  </div>
                </section>
              )}

              {practiceMode === "rehearsal" && (
                <section className="mt-6">
                  <div className="rounded-2xl bg-[var(--soft)] p-5">
                    <p className="text-xs font-semibold text-[var(--accent)]">{tx("60 秒讲解任务", "60초 해설 과제")}</p>
                    <h2 className="mt-2 text-2xl font-semibold">{pick(language, guideFor(nextCourse.id)?.titleZh ?? nextCourse.title, guideFor(nextCourse.id)?.titleKo ?? nextCourse.title)}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{tx("不看正文，按下面结构完成一次口头复述。本功能不录音，也不使用语音读报。", "본문을 보지 않고 아래 구조에 따라 말해 보세요. 녹음과 음성 읽기는 사용하지 않습니다.")}</p>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {[
                      tx("10 秒：中文名称、位置与一句定位", "10초: 중국어 명칭, 위치와 한 문장 소개"),
                      tx("30 秒：讲清 3 个核心事实", "30초: 핵심 사실 3개 설명"),
                      tx("15 秒：加入交通或参观提示", "15초: 교통 또는 관람 안내"),
                      tx("5 秒：自然收尾并引导游客", "5초: 자연스럽게 마무리하고 관람객 안내"),
                    ].map((item, index) => (
                      <div key={item} className="flex min-h-16 items-center gap-3 rounded-xl border border-[var(--line)] p-4">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--field)] text-xs font-semibold text-[var(--accent)]">{index + 1}</span>
                        <span className="text-sm leading-6">{item}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => openPlace(nextCourse)} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--ink)] text-sm font-semibold text-[var(--surface)]">
                    {tx("打开课程核对", "강의를 열어 확인")} <ArrowRight size={16} />
                  </button>
                </section>
              )}
            </>
          )}

          {false && activeTab === "planner" && (
            <>
              {renderHeader(
                "我的行程",
                "나의 일정",
                "生成路线、调整顺序并分享给同行朋友",
                "코스를 만들고 순서를 조정해 동행과 공유하세요",
              )}
              <section className="mt-6">
                <h2 className="text-lg font-semibold">{tx("快速生成", "빠른 일정 만들기")}</h2>
                <div className="no-scrollbar -mx-5 mt-3 flex snap-x gap-2 overflow-x-auto px-5 pb-2">
                  {tourRoutes.map((route) => (
                    <button
                      key={route.id}
                      onClick={() => applyRoutePlan(route)}
                      className="w-[64%] shrink-0 snap-start rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left active:scale-[.99]"
                    >
                      <span className="text-[11px] font-semibold text-[var(--accent)]">
                        {travelMeta(language, route.suggestedTime)} / {route.placeIds.length} {tx("站", "곳")}
                      </span>
                      <b className="mt-3 block text-sm">{tx(route.title, routeKorean[route.id].title)}</b>
                      <small className="mt-1 block line-clamp-2 leading-5 text-[var(--muted)]">
                        {tx(route.subtitle, routeKorean[route.id].subtitle)}
                      </small>
                    </button>
                  ))}
                </div>
              </section>
              <section className="mt-5 rounded-2xl bg-[var(--field)] p-5">
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
                  <div className="flex gap-2">
                    <button
                      onClick={sharePlan}
                      disabled={!plannedPlaces.length}
                      className="grid size-11 place-items-center rounded-xl bg-[var(--surface)] text-[var(--accent)] active:scale-95 disabled:opacity-40"
                      aria-label={tx("分享行程", "일정 공유")}
                    >
                      <ShareNetwork size={18} />
                    </button>
                    <button
                      onClick={clearPlan}
                      disabled={!plannedPlaces.length}
                      className="grid size-11 place-items-center rounded-xl bg-[var(--surface)] text-[var(--muted)] active:scale-95 disabled:opacity-40"
                      aria-label={tx("清空行程", "일정 비우기")}
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              </section>
              <section className="mt-5">
                {plannedPlaces.length ? (
                  <div>
                    {plannedPlaces.map((place, index) => {
                      const detail = travelDetailFor(place.id);
                      const guide = guideFor(place.id);
                      const next = plannedPlaces[index + 1];
                      return (
                        <div key={place.id}>
                          <div className="grid grid-cols-[68px_1fr_auto] items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3">
                            <button onClick={() => openPlace(place)} className="relative h-16 overflow-hidden rounded-xl bg-[var(--field)]">
                              <img
                                src={`${BASE_PATH}${detail?.image ?? "/images/riverside.png"}`}
                                alt=""
                                width={160}
                                height={160}
                                loading="lazy"
                                className="size-full object-cover"
                              />
                              <span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-lg bg-[#0a1715]/78 text-[10px] font-semibold text-white">
                                {index + 1}
                              </span>
                            </button>
                            <button onClick={() => openPlace(place)} className="min-w-0 text-left">
                              <b className="block truncate text-sm">
                                {pick(language, guide?.titleZh ?? place.title, guide?.titleKo ?? place.title)}
                              </b>
                              <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                                {pick(language, detail?.metroZh ?? place.district, detail?.metroKo ?? place.district)}
                              </span>
                            </button>
                            <div className="grid grid-cols-2">
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
                                className="col-span-2 grid h-9 place-items-center rounded-lg text-[var(--muted)] active:bg-[var(--field)]"
                                aria-label={tx("从行程移除", "일정에서 삭제")}
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </div>
                          {next && (
                            <div className="ml-8 flex min-h-10 items-center gap-3 border-l border-dashed border-[var(--line)] pl-5 text-[11px] text-[var(--muted)]">
                              <Train size={14} className="text-[var(--accent)]" />
                              {tx(
                                `预计约 ${estimateTravelMinutes(place.id, next.id)} 分钟`,
                                `예상 이동 약 ${estimateTravelMinutes(place.id, next.id)}분`,
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                "我的学习",
                "내 학습",
                "课程进度、收藏与备课笔记",
                "강의 진도, 저장과 수업 준비 메모",
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
                      id: "learned",
                      zh: "已学",
                      ko: "학습 완료",
                      count: appState.learned.length,
                      Icon: CheckCircle,
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
              {savedView === "learned" && (
                <div className="mt-6 grid gap-1">
                  {places
                    .filter((place) => appState.learned.includes(place.id))
                    .map((place) => (
                      <PlaceRow
                        key={place.id}
                        place={place}
                        language={language}
                        onOpen={() => openPlace(place)}
                      />
                    ))}
                  {!appState.learned.length && (
                    <div className="rounded-xl border border-dashed border-[var(--line)] px-6 py-12 text-center">
                      <CheckCircle size={30} className="mx-auto text-[var(--accent)]" />
                      <h3 className="mt-3 font-semibold">
                        {tx("还没有完成课程", "완료한 강의가 없습니다")}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {tx("学完讲解词后，在课程详情中标记完成。", "해설문을 학습한 뒤 강의 상세에서 완료로 표시하세요.")}
                      </p>
                      <button
                        onClick={() => changeTab("discover")}
                        className="mt-5 rounded-lg bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--surface)] active:scale-[.98]"
                      >
                        {tx("选择课程", "강의 선택")}
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
              { id: "home", zh: "学习", ko: "학습", Icon: House },
              { id: "discover", zh: "课程", ko: "강의", Icon: Compass },
              { id: "map", zh: "实地", ko: "현장", Icon: MapTrifold },
              { id: "planner", zh: "练习", ko: "연습", Icon: IdentificationCard },
              { id: "saved", zh: "我的", ko: "내 학습", Icon: UserCircle },
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

        {practiceExitOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-[#071210]/60 px-3"
            role="dialog"
            aria-modal="true"
            aria-label={tx("退出练习", "연습 나가기")}
            onClick={() => setPracticeExitOpen(false)}
          >
            <div
              className="sheet mb-3 w-full max-w-[496px] rounded-2xl bg-[var(--surface)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[var(--accent)]">{tx("本轮练习尚未完成", "이번 연습이 아직 끝나지 않았습니다")}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{tx("现在退出吗？", "지금 나갈까요?")}</h2>
                </div>
                <button
                  onClick={() => setPracticeExitOpen(false)}
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--field)]"
                  aria-label={tx("关闭退出界面", "나가기 화면 닫기")}
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                {tx("已完成的学习记录会保留，本轮尚未提交的自测进度将结束。", "완료한 학습 기록은 유지되지만 아직 제출하지 않은 퀴즈 진행은 종료됩니다.")}
              </p>
              <div className="mt-6 grid gap-2">
                <button
                  onClick={() => setPracticeExitOpen(false)}
                  className="min-h-12 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-ink)]"
                >
                  {tx("继续练习", "계속 연습")}
                </button>
                <button
                  onClick={() => {
                    setPracticeExitOpen(false);
                    resetQuiz();
                    changeTab("home");
                  }}
                  className="min-h-12 rounded-xl border border-[var(--line)] px-4 text-sm font-semibold text-[var(--muted)]"
                >
                  {tx("退出到学习首页", "학습 홈으로 나가기")}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedPlace &&
          (() => {
            const guide = guideFor(selectedPlace.id);
            if (!guide) return null;
            const detail = travelDetailFor(selectedPlace.id);
            const paragraphs = language === "ko" ? guide.ko : guide.zh;
            const shown = narrationExpanded
              ? paragraphs
              : paragraphs.slice(0, 3);
            const nearbyPlaces = places
              .filter((place) => place.id !== selectedPlace.id)
              .sort((a, b) => {
                const aDetail = travelDetailFor(a.id);
                const bDetail = travelDetailFor(b.id);
                if (!detail || !aDetail || !bDetail) return 0;
                const aDistance = Math.hypot(detail.lat - aDetail.lat, detail.lng - aDetail.lng);
                const bDistance = Math.hypot(detail.lat - bDetail.lat, detail.lng - bDetail.lng);
                return aDistance - bDistance;
              })
              .slice(0, 3);
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
                  <div className="relative -mx-5 -mt-5 aspect-[16/10] overflow-hidden bg-[var(--field)]">
                    <img
                      src={`${BASE_PATH}${detail?.image ?? "/images/riverside.png"}`}
                      alt={pick(language, guide.titleZh, guide.titleKo)}
                      width={900}
                      height={560}
                      className="size-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071210]/70 via-transparent to-[#071210]/15" />
                    <button
                      onClick={closeOverlays}
                      className="absolute right-4 top-4 grid size-11 place-items-center rounded-xl border border-white/20 bg-[#071210]/68 text-white backdrop-blur-md active:scale-95"
                      aria-label={tx("关闭", "닫기")}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="mt-5">
                    <span className="text-xs font-semibold text-[var(--accent)]">
                      {pick(language, guide.categoryZh, guide.categoryKo)} / {pick(language, guide.districtZh, guide.districtKo)}
                    </span>
                    <h2 className="mt-1 text-[28px] font-semibold leading-tight tracking-[-0.04em]">
                      {pick(language, guide.titleZh, guide.titleKo)}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {language === "ko" ? guide.titleZh : guide.titleKo}
                    </p>
                  </div>
                  <section className="mt-5 rounded-2xl bg-[var(--soft)] p-4">
                    <div className="flex items-center justify-between">
                      <b className="text-sm text-[var(--accent)]">{tx("本课学习目标", "이번 강의 학습 목표")}</b>
                      <span className="text-[10px] font-semibold text-[var(--muted)]">5 MIN</span>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {(language === "ko" ? learningGoals(selectedPlace.id).ko : learningGoals(selectedPlace.id).zh).map((goal) => (
                        <span key={goal} className="flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
                          <CheckCircle size={15} className="mt-0.5 shrink-0 text-[var(--accent)]" /> {goal}
                        </span>
                      ))}
                    </div>
                  </section>
                  <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                    <span className="rounded-xl bg-[var(--field)] p-3">
                      <Clock size={16} className="mb-2 text-[var(--accent)]" />
                      {travelMeta(language, guide.duration)}
                    </span>
                    <span className="rounded-xl bg-[var(--field)] p-3">
                      <Ticket size={16} className="mb-2 text-[var(--accent)]" />
                      {pick(language, detail?.priceZh ?? "现场确认", detail?.priceKo ?? "현장 확인")}
                    </span>
                    <span className="rounded-xl bg-[var(--field)] p-3 leading-5">
                      <Clock size={16} className="mb-2 text-[var(--accent)]" />
                      {pick(language, detail?.hoursZh ?? "当天确认", detail?.hoursKo ?? "당일 확인")}
                    </span>
                    <span className="rounded-xl bg-[var(--field)] p-3 leading-5">
                      <SunHorizon size={16} className="mb-2 text-[var(--accent)]" />
                      {pick(language, detail?.bestZh ?? "白天", detail?.bestKo ?? "낮 시간")}
                    </span>
                  </div>
                  {detail && (
                    <div className="mt-3 rounded-2xl border border-[var(--line)] p-4">
                      <div className="flex gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--soft)] text-[var(--accent)]">
                          <Train size={20} weight="duotone" />
                        </span>
                        <div>
                          <b className="text-sm">{tx("怎么到达", "가는 방법")}</b>
                          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                            {pick(language, detail.metroZh, detail.metroKo)}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 border-t border-[var(--line)] pt-3 text-xs leading-5 text-[var(--muted)]">
                        {pick(language, detail.tipZh, detail.tipKo)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(language === "ko" ? detail.tagsKo : detail.tagsZh).map((tag) => (
                          <span key={tag} className="rounded-full bg-[var(--soft)] px-3 py-1.5 text-[10px] font-semibold text-[var(--accent)]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
                      onClick={() => toggleList("learned", selectedPlace.id)}
                      aria-pressed={appState.learned.includes(selectedPlace.id)}
                      className={`grid min-h-14 place-items-center gap-1 rounded-lg p-2 text-[11px] ${appState.learned.includes(selectedPlace.id) ? "bg-[var(--soft)] text-[var(--accent)]" : "bg-[var(--field)]"}`}
                    >
                      <CheckCircle size={18} weight={appState.learned.includes(selectedPlace.id) ? "fill" : "regular"} />
                      {tx("学完", "학습 완료")}
                    </button>
                    <button
                      onClick={() => openPractice(selectedPlace.id, "quiz")}
                      className="grid min-h-14 place-items-center gap-1 rounded-lg bg-[var(--field)] p-2 text-[11px]"
                    >
                      <IdentificationCard size={18} />
                      {tx("自测", "퀴즈")}
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
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a
                      href={mainlandMapUrl(selectedPlace, "amap")}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-3 text-sm font-semibold text-[var(--accent-ink)] active:scale-[.99]"
                    >
                      <NavigationArrow size={17} weight="fill" />
                      {tx("高德地图", "가오더 지도")}
                    </a>
                    <a
                      href={mainlandMapUrl(selectedPlace, "baidu")}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--field)] px-3 py-3 text-sm font-semibold text-[var(--ink)] active:scale-[.99]"
                    >
                      <MapPin size={17} weight="fill" />
                      {tx("百度地图", "바이두 지도")}
                    </a>
                  </div>
                  <button
                    onClick={() => copyChineseCard(selectedPlace)}
                    className="mt-3 flex min-h-16 w-full items-center gap-3 rounded-2xl border border-[var(--line)] p-4 text-left active:scale-[.99]"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--soft)] text-[var(--accent)]">
                      <Copy size={19} />
                    </span>
                    <span className="flex-1">
                      <b className="block text-sm">{tx("复制中文地点卡", "중국어 장소 카드 복사")}</b>
                      <small className="mt-1 block leading-5 text-[var(--muted)]">
                        {tx("打车或问路时直接展示", "택시나 길을 물을 때 바로 보여 주세요")}
                      </small>
                    </span>
                    <span className="text-sm font-semibold">{guide.titleZh}</span>
                  </button>
                  <section className="mt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        {tx("双语讲解词", "이중언어 해설문")}
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
                  <section className="mt-7">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{tx("附近顺路", "근처 함께 보기")}</h3>
                      <span className="text-xs text-[var(--muted)]">{tx("按直线距离", "직선 거리 기준")}</span>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {nearbyPlaces.map((place) => {
                        const nearbyGuide = guideFor(place.id);
                        const nearbyDetail = travelDetailFor(place.id);
                        return (
                          <button
                            key={place.id}
                            onClick={() => openPlace(place)}
                            className="grid grid-cols-[58px_1fr_auto] items-center gap-3 rounded-2xl bg-[var(--field)] p-2 text-left active:scale-[.99]"
                          >
                            <img
                              src={`${BASE_PATH}${nearbyDetail?.image ?? "/images/riverside.png"}`}
                              alt=""
                              width={120}
                              height={120}
                              loading="lazy"
                              className="size-[58px] rounded-xl object-cover"
                            />
                            <span>
                              <b className="block text-sm">{pick(language, nearbyGuide?.titleZh ?? place.title, nearbyGuide?.titleKo ?? place.title)}</b>
                              <small className="mt-1 block text-[var(--muted)]">
                                {tx(
                                  `预计约 ${estimateTravelMinutes(selectedPlace.id, place.id)} 分钟`,
                                  `예상 이동 약 ${estimateTravelMinutes(selectedPlace.id, place.id)}분`,
                                )}
                              </small>
                            </span>
                            <ArrowRight size={16} className="mr-2 text-[var(--muted)]" />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <section className="mt-7">
                    <label
                      htmlFor="place-note"
                      className="text-sm font-semibold"
                    >
                      {tx("备课笔记", "수업 준비 메모")}
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
                        {tx("保存学习进度", "학습 진도 저장")}
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
                      {tx("开始学习路径", "학습 코스 시작")}
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
              <section className="mt-7">
                <h3 className="font-semibold">{tx("韩国游客旅行准备", "한국 여행자 준비")}</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {travelToolkits.map((toolkit) => (
                    <div key={toolkit.id} className="rounded-2xl bg-[var(--field)] p-3">
                      <span className="text-[var(--accent)]"><ToolkitIcon id={toolkit.id} size={19} /></span>
                      <b className="mt-3 block text-xs">{tx(toolkit.titleZh, toolkit.titleKo)}</b>
                      <p className="mt-1 line-clamp-3 text-[10px] leading-4 text-[var(--muted)]">
                        {tx(toolkit.bodyZh, toolkit.bodyKo)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
              <p className="mt-5 text-xs leading-6 text-[var(--muted)]">
                {tx(
                  "包含 18 个深圳景点的中文与韩文原始讲解。收藏、笔记与路线进度只保存在你的设备。",
                  "선전 18개 명소의 중국어와 한국어 원문 해설을 담았습니다. 저장, 메모와 코스 진행 상황은 이 기기에만 보관됩니다.",
                )}
              </p>
              <details className="mt-4 rounded-2xl border border-[var(--line)] p-4 text-xs text-[var(--muted)]">
                <summary className="cursor-pointer font-semibold text-[var(--ink)]">
                  {tx("照片来源与许可", "사진 출처와 라이선스")}
                </summary>
                <ul className="mt-3 grid gap-2 leading-5">
                  {photoCredits.map((credit) => <li key={credit}>{credit}</li>)}
                </ul>
              </details>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
