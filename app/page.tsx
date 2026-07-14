"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BookmarkSimple,
  CaretDown,
  CalendarBlank,
  Compass,
  Headphones,
  House,
  MagnifyingGlass,
  MapPin,
  NavigationArrow,
  SlidersHorizontal,
  Sparkle,
  UserCircle,
  X,
} from "@phosphor-icons/react";

type Tab = "home" | "discover" | "saved" | "profile";

type Place = {
  id: number;
  title: string;
  category: string;
  meta: string;
  district: string;
  description: string;
};

const places: Place[] = [
  { id: 1, title: "南头古城", category: "历史", meta: "深圳城市之根 / 新安故城", district: "南山", description: "资料称其为深圳城市之根，拥有 1700 余年建城史，是深圳、香港、东莞一带早期的政治、军事和文化中心。" },
  { id: 2, title: "深圳湾北湾鹭港", category: "滨海", meta: "滨海湿地 / 候鸟生态", district: "南山", description: "位于深圳湾北段，衔接人才公园与红树林海滨生态公园，适合观察候鸟、湿地和城市天际线。" },
  { id: 3, title: "甘坑古镇", category: "历史", meta: "客家古村 / 原生街巷", district: "龙岗", description: "甘坑古镇也叫甘坑客家小镇。资料将其列为深圳十大客家古村落之一，重点呈现原址、原貌与客家村落肌理。" },
  { id: 4, title: "莲花山公园", category: "城市", meta: "城市中轴 / 福田全景", district: "福田", description: "位于福田 CBD 核心，是深圳具有代表性的城市公园。山势平缓，登顶后可以俯瞰福田中心城区。" },
  { id: 5, title: "华强北", category: "科创", meta: "电子第一街 / 创业热土", district: "福田", description: "资料以华强北讲述深圳从边陲小镇到科创都市的变化。这里从一米柜台发展为全球重要的电子元器件集散中心。" },
  { id: 6, title: "东门夜市", category: "夜游", meta: "老街记忆 / 城市烟火", district: "罗湖", description: "东门老街是深圳老牌商圈，也是资料中的城市商业记忆入口，适合用夜市、美食和街巷讲深圳的烟火气。" },
  { id: 7, title: "深圳平安金融中心", category: "城市", meta: "福田地标 / 高空视角", district: "福田", description: "位于福田 CBD 核心。资料把它作为深圳现代天际线的重要地标，适合与市民广场、莲花山串联讲解。" },
  { id: 8, title: "深圳杨梅坑", category: "滨海", meta: "七娘山 / 大亚湾海岸", district: "大鹏", description: "杨梅坑背靠七娘山、面朝大亚湾。资料以溪谷、海岸与电影取景地为线索，呈现深圳东部的山海景观。" },
  { id: 9, title: "锦绣中华", category: "人文", meta: "文化主题 / 民俗体验", district: "南山", description: "资料将锦绣中华民俗村概括为大型文化主题公园，通过实景与微缩景观集中展示中国历史和民俗文化。" },
  { id: 10, title: "二十四史书院", category: "人文", meta: "东方园林 / 国风研学", district: "龙岗", description: "书院位于甘坑客家古镇，以《二十四史》为核心主题，适合国风体验、汉服拍摄与文化研学。" },
  { id: 11, title: "玛丝菲尔", category: "人文", meta: "仿生建筑 / 深圳时尚", district: "龙华", description: "资料从高迪风格的仿生曲线、回收材料与时装展陈切入，讲述深圳本土时尚产业和先锋建筑。" },
  { id: 12, title: "深圳湾文化广场", category: "人文", meta: "滨海文化 / 设计艺术", district: "南山", description: "坐落在南山后海深圳湾海岸线。资料以白色流线建筑、滨海草坡和主题展厅讲述深圳的设计文化。" },
  { id: 13, title: "云海天使湾", category: "滨海", meta: "月牙海湾 / 悬崖观景", district: "大鹏", description: "位于大鹏新区，海湾呈月牙形。资料收录了悬崖观景、沙滩、山海栈道等体验，适合滨海度假路线。" },
  { id: 14, title: "海上世界", category: "夜游", meta: "明华轮 / 蛇口记忆", district: "南山", description: "以明华轮为核心的蛇口滨海地标，融合改革开放记忆、公共艺术、环球美食与夜游体验。" },
  { id: 15, title: "欢乐海岸", category: "夜游", meta: "岭南水乡 / 滨海夜景", district: "南山", description: "资料将岭南水乡、滨海沙滩、生态湿地、光影演艺与潮流商业串在一起，适合城市微度假和夜游。" },
  { id: 16, title: "欢乐港湾", category: "夜游", meta: "滨海公园 / 湾区之光", district: "宝安", description: "深圳西部滨海文旅地标，资料收录了滨海公园、摩天轮、光影水秀、演艺中心与开放式商业空间。" },
  { id: 17, title: "市民广场", category: "城市", meta: "城市客厅 / 中轴核心", district: "福田", description: "位于福田 CBD 与深圳城市中轴线核心。向北连接莲花山，向南面对平安金融中心和高层建筑群。" },
  { id: 18, title: "卓悦中心", category: "夜游", meta: "开放街区 / 都市生活", district: "福田", description: "位于福田 CBD 核心，资料将其定位为开放式街区型商业综合体，适合连接城市夜景、餐饮与休闲体验。" },
];

const categories = ["全部", "历史", "滨海", "人文", "城市", "科创", "夜游"];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [category, setCategory] = useState("全部");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<number[]>([2]);
  const [storageReady, setStorageReady] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Place | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("shenyou-saved");
    if (!stored) {
      setStorageReady(true);
      return;
    }
    try {
      const ids = JSON.parse(stored);
      if (Array.isArray(ids)) setSaved(ids.filter((id) => Number.isInteger(id)));
    } catch {
      window.localStorage.removeItem("shenyou-saved");
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem("shenyou-saved", JSON.stringify(saved));
  }, [saved, storageReady]);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
    };
  }, [selected]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("zh-CN");
    return places.filter((place) => {
      const categoryMatch = category === "全部" || place.category === category;
      const queryMatch = `${place.title}${place.category}${place.district}${place.meta}${place.description}`.toLocaleLowerCase("zh-CN").includes(keyword);
      const savedMatch = activeTab !== "saved" || saved.includes(place.id);
      return categoryMatch && queryMatch && savedMatch;
    });
  }, [category, query, activeTab, saved]);

  function toggleSaved(id: number) {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleNarration(place: Place) {
    if (!("speechSynthesis" in window)) return;
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

  const isProfile = activeTab === "profile";

  return (
    <main className="min-h-[100dvh] bg-[var(--canvas)] text-[var(--ink)]">
      <div className="relative mx-auto min-h-[100dvh] max-w-[480px] overflow-hidden bg-[var(--surface)] shadow-[0_0_60px_rgba(23,33,31,.08)]">
        <div className="px-5 pb-28 pt-[max(20px,env(safe-area-inset-top))]">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">SHENYOU · 深圳解说</p>
              <button className="mt-1 flex items-center gap-1 text-sm font-semibold" aria-label="当前城市为深圳">
                <MapPin size={15} weight="fill" className="text-[var(--accent)]" /> 深圳景点资料 <CaretDown size={12} className="text-[var(--muted)]" />
              </button>
            </div>
            <button className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] transition active:scale-95" aria-label="讲解提醒">
              <Bell size={20} />
            </button>
          </header>

          {isProfile ? (
            <section className="mt-10">
              <div className="grid size-14 place-items-center rounded-lg bg-[var(--soft)] text-[var(--accent)]">
                <Headphones size={27} weight="duotone" />
              </div>
              <p className="mt-6 text-sm text-[var(--muted)]">关于这份导览</p>
              <h1 className="mt-1 max-w-[13ch] text-[32px] font-semibold leading-[1.12] tracking-[-0.045em]">内容来自你提供的深圳解说资料。</h1>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">当前已整理 18 个深圳景点，覆盖历史、滨海、人文、城市、科创和夜游主题。原资料里的中韩双语讲解可继续扩展为音频与双语模式。</p>

              <div className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {[
                  ["深圳景点库", "18 个资料内点位"],
                  ["收藏方式", "保存在当前设备"],
                  ["内容方向", "中文讲解与韩文双语"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-4">
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="text-right text-xs text-[var(--muted)]">{value}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <>
              {activeTab === "home" && (
                <>
                  <section className="mt-8">
                    <p className="text-sm text-[var(--muted)]">从历史根脉，到山海与科创</p>
                    <h1 className="mt-1 max-w-[12ch] text-[32px] font-semibold leading-[1.12] tracking-[-0.045em]">把深圳景点，装进口袋里。</h1>
                  </section>

                  <section className="relative mt-6 min-h-[250px] overflow-hidden rounded-lg bg-[#173a37] text-white">
                    <img src="/images/riverside.png" alt="深圳湾滨海公共空间" width={1122} height={1402} fetchPriority="high" className="absolute inset-0 size-full object-cover opacity-85" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c2422]/95 via-[#0c2422]/20 to-transparent" />
                    <div className="relative flex min-h-[250px] flex-col justify-between p-5">
                      <div className="flex justify-end">
                        <button onClick={() => toggleSaved(2)} className="grid size-10 place-items-center rounded-full bg-[#0c2422]/55 backdrop-blur-sm transition active:scale-95" aria-label={saved.includes(2) ? "取消收藏深圳湾北湾鹭港" : "收藏深圳湾北湾鹭港"}>
                          <BookmarkSimple size={20} weight={saved.includes(2) ? "fill" : "regular"} />
                        </button>
                      </div>
                      <button onClick={() => setSelected(places[1])} className="text-left">
                        <p className="text-xs text-white/80">滨海生态线 / 红树林与城市天际线</p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">从深圳湾，读懂这座城</h2>
                        <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold">查看讲解 <NavigationArrow size={15} weight="fill" /></span>
                      </button>
                    </div>
                  </section>
                </>
              )}

              <div className={`${activeTab === "home" ? "mt-5" : "mt-8"} flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--field)] px-4 py-3`}>
                <MagnifyingGlass size={20} className="shrink-0 text-[var(--muted)]" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]" placeholder="搜索景点、讲解或区域" aria-label="搜索深圳景点" />
                <SlidersHorizontal size={19} className="text-[var(--muted)]" />
              </div>

              <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
                {categories.map((item) => (
                  <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition active:scale-95 ${category === item ? "bg-[var(--ink)] text-[var(--surface)]" : "border border-[var(--line)] text-[var(--muted)]"}`}>{item}</button>
                ))}
              </div>

              <section className="mt-7">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[var(--accent)]">{activeTab === "saved" ? "你的清单" : activeTab === "discover" ? "按主题探索" : "资料里的深圳"}</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">{activeTab === "saved" ? "已收藏的景点" : activeTab === "discover" ? "找到你的下一站" : "18 个景点，慢慢认识"}</h2>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted)]" aria-live="polite">{filtered.length} 个景点</span>
                </div>

                <div className="mt-3 divide-y divide-[var(--line)]">
                  {filtered.map((place) => (
                    <article key={place.id} className="grid grid-cols-[70px_1fr_auto] gap-3 py-4">
                      <button onClick={() => setSelected(place)} className="grid h-[78px] place-items-center overflow-hidden rounded-lg bg-[var(--soft)] text-[var(--accent)] transition active:scale-[.98]" aria-label={`查看${place.title}`}>
                        <MapPin size={24} weight="duotone" />
                      </button>
                      <button onClick={() => setSelected(place)} className="min-w-0 py-0.5 text-left">
                        <span className="text-[11px] font-semibold text-[var(--accent)]">{place.category}</span>
                        <h3 className="mt-1 truncate text-[15px] font-semibold">{place.title}</h3>
                        <p className="mt-1 truncate text-xs text-[var(--muted)]">{place.meta}</p>
                        <p className="mt-1 text-[11px] text-[var(--muted)]">{place.district}</p>
                      </button>
                      <button onClick={() => toggleSaved(place.id)} className="grid size-9 place-items-center rounded-full transition active:scale-90" aria-label={saved.includes(place.id) ? `取消收藏${place.title}` : `收藏${place.title}`}>
                        <BookmarkSimple size={20} weight={saved.includes(place.id) ? "fill" : "regular"} className={saved.includes(place.id) ? "text-[var(--accent)]" : "text-[var(--muted)]"} />
                      </button>
                    </article>
                  ))}
                </div>

                {filtered.length === 0 && (
                  <div className="mt-5 rounded-lg border border-dashed border-[var(--line)] px-6 py-10 text-center">
                    <Compass size={30} className="mx-auto text-[var(--accent)]" />
                    <h3 className="mt-3 font-semibold">还没有找到对应景点</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">换个资料关键词或分类再看看。</p>
                    <button onClick={() => { setQuery(""); setCategory("全部"); }} className="mt-4 rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-[var(--surface)]">清除筛选</button>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] border-t border-[var(--line)] bg-[var(--surface)]/95 px-5 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl" aria-label="主导航">
          <div className="grid grid-cols-4">
            {[
              { id: "home", label: "首页", Icon: House },
              { id: "discover", label: "景点", Icon: Compass },
              { id: "saved", label: "收藏", Icon: BookmarkSimple },
              { id: "profile", label: "资料", Icon: UserCircle },
            ].map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id as Tab)} className={`flex flex-col items-center gap-1 py-1.5 text-[10px] font-medium transition active:scale-95 ${activeTab === id ? "text-[var(--accent)]" : "text-[var(--muted)]"}`} aria-current={activeTab === id ? "page" : undefined}>
                <Icon size={22} weight={activeTab === id ? "fill" : "regular"} />{label}
              </button>
            ))}
          </div>
        </nav>

        {selected && (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#0c1715]/50 px-3" role="dialog" aria-modal="true" aria-label={selected.title} onClick={() => setSelected(null)}>
            <div className="mb-3 w-full max-w-[456px] rounded-lg bg-[var(--surface)] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div><span className="text-xs font-semibold text-[var(--accent)]">{selected.category}</span><h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{selected.title}</h2></div>
                <button onClick={() => setSelected(null)} className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--field)]" aria-label="关闭"><X size={18} /></button>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{selected.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <span className="flex items-center gap-2 rounded-lg bg-[var(--field)] p-3"><MapPin size={17} className="shrink-0 text-[var(--accent)]" />{selected.district}</span>
                <span className="flex items-center gap-2 rounded-lg bg-[var(--field)] p-3"><CalendarBlank size={17} className="shrink-0 text-[var(--accent)]" />{selected.category}路线</span>
              </div>
              <button onClick={() => toggleNarration(selected)} aria-pressed={speakingId === selected.id} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3.5 text-sm font-semibold text-[var(--accent-ink)] active:scale-[.99]"><Headphones size={18} weight="fill" />{speakingId === selected.id ? "停止讲解" : "开始讲解"}</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
