from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path

from docx import Document


PLACES = [
    ("南头古城", "난터우 고성", "历史", "역사", "南山", "난산", "深圳城市之根 / 新安故城", "선전 도시의 뿌리 / 신안 옛 성", "2-3 小时", "地铁 + 步行"),
    ("深圳湾北湾鹭港", "선전만 북만 로항", "滨海", "해안", "南山", "난산", "滨海湿地 / 候鸟生态", "해안 습지 / 철새 생태", "1-2 小时", "地铁 + 步行"),
    ("甘坑古镇", "간컹 고진", "历史", "역사", "龙岗", "룽강", "客家古村 / 非遗体验", "객가 고촌 / 무형문화유산", "半日", "地铁 + 公交"),
    ("莲花山公园", "롄화산 공원", "城市", "도시", "福田", "푸톈", "城市中轴 / 福田全景", "도시 중심축 / 푸톈 전망", "2 小时", "地铁 + 步行"),
    ("华强北", "화창베이", "科创", "혁신", "福田", "푸톈", "电子第一街 / 创业热土", "전자상가 / 창업 중심지", "2-3 小时", "地铁 + 步行"),
    ("东门夜市", "둥먼 야시장", "夜游", "야간", "罗湖", "뤄후", "老街记忆 / 城市烟火", "옛 거리 / 야시장", "2-3 小时", "地铁 + 步行"),
    ("深圳平安金融中心", "선전 핑안 금융센터", "城市", "도시", "福田", "푸톈", "福田地标 / 高空视角", "푸톈 랜드마크 / 고공 전망", "2 小时", "地铁 + 步行"),
    ("深圳杨梅坑", "선전 양메이컹", "滨海", "해안", "大鹏", "다펑", "七娘山 / 大亚湾海岸", "치낭산 / 다야만 해안", "半日", "预约交通 / 自驾"),
    ("锦绣中华", "진슈중화", "人文", "문화", "南山", "난산", "文化主题 / 民俗体验", "문화 테마 / 민속 체험", "半日-一日", "地铁"),
    ("二十四史书院", "이십사사 서원", "人文", "문화", "龙岗", "룽강", "东方园林 / 国风研学", "동양 정원 / 역사 체험", "2-3 小时", "地铁 + 步行"),
    ("玛丝菲尔", "마리스프롤그", "人文", "문화", "龙华", "룽화", "仿生建筑 / 深圳时尚", "생체모방 건축 / 선전 패션", "1-2 小时", "地铁 + 打车"),
    ("深圳湾文化广场", "선전만 문화광장", "人文", "문화", "南山", "난산", "滨海文化 / 设计艺术", "해안 문화 / 디자인 예술", "2-3 小时", "地铁 + 步行"),
    ("云海天使湾", "윈하이 천사만", "滨海", "해안", "大鹏", "다펑", "月牙海湾 / 悬崖观景", "초승달 해변 / 절벽 전망", "半日", "预约交通 / 自驾"),
    ("海上世界", "해상세계", "夜游", "야간", "南山", "난산", "明华轮 / 蛇口记忆", "밍화호 / 서커우 역사", "3 小时", "地铁 + 步行"),
    ("欢乐海岸", "환러하이안", "夜游", "야간", "南山", "난산", "岭南水乡 / 滨海夜景", "링난 수향 / 해안 야경", "半日", "地铁 + 步行"),
    ("欢乐港湾", "환러강완", "夜游", "야간", "宝安", "바오안", "滨海公园 / 湾区之光", "해안 공원 / 대관람차", "半日", "地铁 + 步行"),
    ("市民广场", "시민광장", "城市", "도시", "福田", "푸톈", "城市客厅 / 中轴核心", "도시 거실 / 중심축", "2 小时", "地铁 + 步行"),
    ("卓悦中心", "줘웨 센터", "夜游", "야간", "福田", "푸톈", "开放街区 / 都市生活", "개방형 거리 / 도시 생활", "2-3 小时", "地铁 + 步行"),
]

ROUTES = [
    {"id": "futian", "zh": "福田城市中轴", "ko": "푸톈 도시 중심축", "descZh": "从莲花山的城市全景走向市民广场、平安金融中心与卓悦中心夜色。", "descKo": "롄화산 전망에서 시민광장, 핑안 금융센터, 줘웨 센터의 야경까지 이어집니다.", "ids": [4, 17, 7, 18]},
    {"id": "bay", "zh": "深圳湾滨海线", "ko": "선전만 해안 코스", "descZh": "湿地、设计文化、城市度假与蛇口开放记忆的一日组合。", "descKo": "습지, 디자인 문화, 도시 휴양과 서커우의 개방 역사를 하루에 만납니다.", "ids": [2, 12, 15, 14]},
    {"id": "heritage", "zh": "甘坑客家人文", "ko": "간컹 객가 문화 코스", "descZh": "甘坑古镇与二十四史书院的轻松半日文化路线。", "descKo": "간컹 고진과 이십사사 서원을 잇는 편안한 반일 문화 코스입니다.", "ids": [3, 10]},
    {"id": "coast", "zh": "大鹏山海线", "ko": "다펑 산과 바다 코스", "descZh": "杨梅坑与云海天使湾组成的东部山海一日路线。", "descKo": "양메이컹과 윈하이 천사만을 연결하는 동부 해안 종일 코스입니다.", "ids": [8, 13]},
]


def language_of(text: str) -> str:
    ko = len(re.findall(r"[가-힣]", text))
    zh = len(re.findall(r"[\u4e00-\u9fff]", text))
    return "ko" if ko > zh else "zh"


def clean(text: str) -> str:
    text = text.replace("**", "").replace("光灯会", "")
    return re.sub(r"\s+", " ", text).strip()


def extract(docx_path: Path) -> list[dict]:
    doc = Document(docx_path)
    paragraphs = [clean(p.text) for p in doc.paragraphs]
    title_indices = []
    for title, *_ in PLACES:
        try:
            title_indices.append(paragraphs.index(title))
        except ValueError as exc:
            raise RuntimeError(f"未在资料中找到景点标题: {title}") from exc
    end_index = paragraphs.index("珠海")
    boundaries = title_indices + [end_index]
    records = []
    for number, meta in enumerate(PLACES, start=1):
        title, ko_title, category, category_ko, district, district_ko, tag, tag_ko, duration, transport = meta
        body = [p for p in paragraphs[boundaries[number - 1] + 1 : boundaries[number]] if p]
        zh = [p for p in body if language_of(p) == "zh"]
        ko = [p for p in body if language_of(p) == "ko"]
        if not zh or not ko:
            raise RuntimeError(f"{title} 缺少中韩正文")
        records.append({
            "id": number,
            "titleZh": title,
            "titleKo": ko_title,
            "categoryZh": category,
            "categoryKo": category_ko,
            "districtZh": district,
            "districtKo": district_ko,
            "tagZh": tag,
            "tagKo": tag_ko,
            "duration": duration,
            "transport": transport,
            "zh": zh,
            "ko": ko,
            "search": " ".join([title, ko_title, category, category_ko, district, district_ko, tag, tag_ko, *zh, *ko]).lower(),
        })
    return records


HTML = r'''<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="color-scheme" content="light dark">
  <title>深游 SHENYOU · 深圳中韩双语导览</title>
  <style>
    :root{--bg:#f2f5f1;--panel:#fbfcf9;--ink:#16221d;--muted:#68746e;--line:#dbe2dc;--brand:#0c725d;--brand2:#0a594a;--soft:#dcefe8;--warm:#f2e7d5;--shadow:0 18px 60px rgba(18,43,35,.12)}
    @media(prefers-color-scheme:dark){:root{--bg:#101714;--panel:#17201c;--ink:#edf4f0;--muted:#a8b5af;--line:#2c3b34;--brand:#52c9a8;--brand2:#7bd9bf;--soft:#1c3e34;--warm:#3b3023;--shadow:0 18px 60px rgba(0,0,0,.35)}}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,"Noto Sans SC","Microsoft YaHei","Malgun Gothic",sans-serif;line-height:1.55}button,input,select,textarea{font:inherit;color:inherit}button{cursor:pointer}.shell{max-width:1440px;margin:auto;min-height:100vh}.top{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}.topin{display:flex;align-items:center;gap:18px;padding:14px 24px}.brand{font-weight:900;letter-spacing:.08em}.brand small{display:block;font-size:11px;color:var(--muted);letter-spacing:.18em}.lang{margin-left:auto;display:flex;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:3px}.lang button,.tab,.chip,.ghost,.primary{border:0;border-radius:10px;padding:9px 13px;background:transparent}.lang button.on,.tab.on,.chip.on{background:var(--ink);color:var(--panel)}.layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:24px;padding:24px}.side{position:sticky;top:92px;height:calc(100vh - 116px);display:flex;flex-direction:column;gap:9px}.side .tab{text-align:left;padding:13px 15px;color:var(--muted)}.side .tab.on{color:var(--panel)}.sidefoot{margin-top:auto;font-size:12px;color:var(--muted)}main{min-width:0}.hero{position:relative;overflow:hidden;min-height:310px;border-radius:30px;padding:38px;background:linear-gradient(135deg,#0b5144 0%,#0c725d 55%,#6fa68b 100%);color:#f7fbf9;box-shadow:var(--shadow)}.hero:after{content:"深 圳";position:absolute;right:-30px;bottom:-80px;font-size:180px;font-weight:900;opacity:.08;white-space:nowrap}.eyebrow{font-size:12px;letter-spacing:.18em;text-transform:uppercase;opacity:.78}.hero h1{font-size:clamp(34px,6vw,72px);line-height:1.02;max-width:760px;margin:20px 0 15px}.hero p{max-width:650px;font-size:17px;opacity:.86}.heroactions,.row{display:flex;gap:10px;flex-wrap:wrap}.primary{background:var(--brand);color:white;font-weight:750}.hero .primary{background:#f6fbf8;color:#12473b}.ghost{border:1px solid var(--line);background:var(--panel)}.hero .ghost{border-color:#ffffff55;background:#ffffff12;color:white}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}.stat{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:16px}.stat b{display:block;font-size:24px}.stat span{color:var(--muted);font-size:12px}.toolbar{display:grid;grid-template-columns:minmax(220px,1fr) auto auto;gap:10px;margin:22px 0 14px}.field{width:100%;border:1px solid var(--line);background:var(--panel);border-radius:14px;padding:12px 14px;outline:none}.field:focus{border-color:var(--brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 18%,transparent)}.chips{display:flex;gap:8px;overflow:auto;padding-bottom:8px}.chip{white-space:nowrap;border:1px solid var(--line);background:var(--panel)}.sectionhead{display:flex;justify-content:space-between;align-items:end;gap:18px;margin:30px 0 14px}.sectionhead h2{margin:0;font-size:28px}.sectionhead p{margin:4px 0 0;color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.card{position:relative;text-align:left;border:1px solid var(--line);background:var(--panel);border-radius:20px;padding:18px;min-height:205px;transition:.2s transform,.2s border-color}.card:hover{transform:translateY(-3px);border-color:var(--brand)}.card .num{font-size:12px;color:var(--brand);font-weight:800;letter-spacing:.12em}.card h3{font-size:21px;margin:22px 0 2px}.card .ko{color:var(--muted);font-size:14px}.card p{color:var(--muted);font-size:13px}.tags{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.tag{font-size:11px;padding:5px 8px;border-radius:999px;background:var(--soft);color:var(--brand2)}.mark{position:absolute;right:14px;top:14px;border:0;background:transparent;font-size:20px}.panel{background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:20px;margin-bottom:14px}.route{display:grid;grid-template-columns:1fr auto;gap:16px}.stops{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.stop{border:1px solid var(--line);padding:8px 10px;border-radius:10px;font-size:13px}.stop.done{text-decoration:line-through;background:var(--soft)}.empty{padding:70px 20px;text-align:center;border:1px dashed var(--line);border-radius:22px;color:var(--muted)}.modal{position:fixed;inset:0;z-index:40;background:rgba(7,15,12,.66);display:none;align-items:end;justify-content:center;padding:18px}.modal.open{display:flex}.sheet{background:var(--panel);width:min(860px,100%);max-height:92vh;overflow:auto;border-radius:26px 26px 18px 18px;box-shadow:var(--shadow)}.sheethead{position:sticky;top:0;background:color-mix(in srgb,var(--panel) 94%,transparent);backdrop-filter:blur(10px);padding:20px;border-bottom:1px solid var(--line);display:flex;gap:14px;align-items:flex-start;z-index:2}.sheethead h2{margin:0}.close{margin-left:auto;border:1px solid var(--line);background:var(--panel);border-radius:999px;width:38px;height:38px}.sheetbody{padding:20px}.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:18px}.fact{background:var(--bg);border-radius:13px;padding:11px;font-size:12px}.fact b{display:block;font-size:14px}.narration{display:grid;gap:12px}.narration.dual{grid-template-columns:1fr 1fr}.narration article{background:var(--bg);border-radius:16px;padding:16px}.narration h4{margin:0 0 10px;color:var(--brand)}.narration p{margin:0 0 13px}.note{min-height:110px;resize:vertical;margin-top:8px}.planner{display:grid;grid-template-columns:1fr 1fr;gap:14px}.checklist{display:grid;gap:8px;max-height:380px;overflow:auto}.check{display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:12px;padding:10px}.toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);opacity:0;background:var(--ink);color:var(--panel);padding:10px 16px;border-radius:999px;z-index:80;transition:.2s}.toast.show{opacity:1;transform:translateX(-50%)}.mobiletabs{display:none}.source{font-size:12px;color:var(--muted);margin:25px 0 80px}.hidden{display:none!important}@media(max-width:960px){.layout{grid-template-columns:1fr;padding:15px}.side{display:none}.grid{grid-template-columns:repeat(2,1fr)}.topin{padding:11px 15px}.mobiletabs{display:grid;grid-template-columns:repeat(4,1fr);position:fixed;z-index:30;bottom:0;left:0;right:0;background:var(--panel);border-top:1px solid var(--line);padding:7px env(safe-area-inset-right) calc(7px + env(safe-area-inset-bottom)) env(safe-area-inset-left)}.mobiletabs .tab{font-size:12px;padding:9px 4px}.source{margin-bottom:110px}}@media(max-width:620px){.hero{min-height:360px;padding:28px 22px}.stats{grid-template-columns:1fr 1fr}.toolbar{grid-template-columns:1fr}.grid{grid-template-columns:1fr}.facts,.planner,.narration.dual{grid-template-columns:1fr}.lang button{padding:7px 9px}.brand small{display:none}.route{grid-template-columns:1fr}}
    @media print{.top,.side,.mobiletabs,.heroactions,.toolbar,.chips,.mark,.toast,.source button{display:none!important}.layout{display:block;padding:0}.panel,.card{break-inside:avoid}.modal{position:static;background:none;padding:0}.sheet{max-height:none;box-shadow:none;width:100%}}
  </style>
</head>
<body>
<div class="shell">
  <header class="top"><div class="topin"><div class="brand">SHENYOU <small>深圳中韩双语导览</small></div><div class="lang"><button data-lang="zh" class="on">中文</button><button data-lang="ko">한국어</button><button data-lang="dual">双语</button></div></div></header>
  <div class="layout">
    <aside class="side"><button class="tab on" data-view="explore">01 导览 · 관광</button><button class="tab" data-view="routes">02 路线 · 코스</button><button class="tab" data-view="plan">03 行程 · 일정</button><button class="tab" data-view="saved">04 收藏 · 저장</button><div class="sidefoot">单文件离线版<br>数据仅保存在本机浏览器</div></aside>
    <main>
      <section id="view-explore">
        <div class="hero"><div class="eyebrow">SHENZHEN · 深圳 · 선전</div><h1 data-i18n="hero">一份能真正开口讲解的深圳指南</h1><p data-i18n="heroSub">来自你提供的资料，完整保留 18 个景点的中文与韩文讲解，支持离线阅读、语音播放与行程规划。</p><div class="heroactions"><button class="primary" id="randomBtn">随机推荐 · 추천</button><button class="ghost" data-view-jump="plan">规划行程 · 일정 만들기</button></div></div>
        <div class="stats"><div class="stat"><b>18</b><span>深圳资料景点</span></div><div class="stat"><b id="koCount">18</b><span>韩文完整讲解</span></div><div class="stat"><b id="visitedCount">0</b><span>已到访</span></div><div class="stat"><b id="savedCount">0</b><span>已收藏</span></div></div>
        <div class="toolbar"><input id="search" class="field" placeholder="搜索中文、한국어、区域或正文"><select id="district" class="field"><option value="">全部区域 · 전체 지역</option></select><button class="ghost" id="clearSearch">清除</button></div>
        <div class="chips" id="chips"></div>
        <div class="sectionhead"><div><h2 data-i18n="places">深圳景点</h2><p id="resultText"></p></div></div><div class="grid" id="placeGrid"></div>
      </section>
      <section id="view-routes" class="hidden"><div class="sectionhead"><div><h2 data-i18n="routes">主题路线</h2><p data-i18n="routesSub">按区域与时间成本组织，访问进度自动保存。</p></div></div><div id="routeList"></div></section>
      <section id="view-plan" class="hidden"><div class="sectionhead"><div><h2 data-i18n="plan">我的行程</h2><p data-i18n="planSub">自定义景点顺序、记录笔记、打印或导出备份。</p></div></div><div class="planner"><div class="panel"><h3>选择景点 · 장소 선택</h3><div class="checklist" id="plannerList"></div></div><div class="panel"><h3>行程顺序 · 일정 순서</h3><div id="planStops"></div><div class="row" style="margin-top:16px"><button class="primary" id="printBtn">打印行程</button><button class="ghost" id="exportBtn">导出数据</button><label class="ghost" style="cursor:pointer">导入数据<input id="importInput" type="file" accept="application/json" hidden></label></div></div></div></section>
      <section id="view-saved" class="hidden"><div class="sectionhead"><div><h2 data-i18n="saved">收藏与足迹</h2><p data-i18n="savedSub">收藏、最近浏览和已到访记录都只保存在本机。</p></div><button class="ghost" id="resetBtn">清除本机数据</button></div><div id="savedContent"></div></section>
      <div class="source">资料来源：用户提供的《관광지 해설 자료.docx》。本文件为本地单文件应用，不会上传浏览记录、收藏、笔记或行程。</div>
    </main>
  </div>
</div>
<nav class="mobiletabs"><button class="tab on" data-view="explore">导览</button><button class="tab" data-view="routes">路线</button><button class="tab" data-view="plan">行程</button><button class="tab" data-view="saved">收藏</button></nav>
<div class="modal" id="modal"><div class="sheet"><div class="sheethead"><div><div class="eyebrow" id="detailEyebrow"></div><h2 id="detailTitle"></h2><div id="detailKo" class="ko"></div></div><button class="close" id="closeModal">×</button></div><div class="sheetbody"><div class="facts" id="detailFacts"></div><div class="row" style="margin-bottom:18px"><button class="primary" id="speakBtn">播放讲解</button><button class="ghost" id="favBtn">收藏</button><button class="ghost" id="visitBtn">标记到访</button><button class="ghost" id="planBtn">加入行程</button><a class="ghost" id="mapBtn" target="_blank" rel="noreferrer">地图导航</a></div><div class="narration" id="narration"></div><div class="panel" style="margin-top:18px"><b>我的笔记 · 내 메모</b><textarea id="note" class="field note" placeholder="记录集合点、讲解重点或个人感受"></textarea></div></div></div></div>
<div class="toast" id="toast"></div>
<script>
const PLACES=__PLACES__;
const ROUTES=__ROUTES__;
const KEY='shenyou-offline-v3';
const ui={zh:{hero:'一份能真正开口讲解的深圳指南',heroSub:'来自你提供的资料，完整保留 18 个景点的中文与韩文讲解，支持离线阅读、语音播放与行程规划。',places:'深圳景点',routes:'主题路线',routesSub:'按区域与时间成本组织，访问进度自动保存。',plan:'我的行程',planSub:'自定义景点顺序、记录笔记、打印或导出备份。',saved:'收藏与足迹',savedSub:'收藏、最近浏览和已到访记录都只保存在本机。'},ko:{hero:'실제로 들을 수 있는 선전 여행 가이드',heroSub:'제공하신 자료를 바탕으로 18개 명소의 중국어와 한국어 해설을 모두 담았습니다. 오프라인 읽기, 음성 재생, 일정 계획을 지원합니다.',places:'선전 명소',routes:'테마 코스',routesSub:'지역과 이동 시간을 고려한 추천 코스이며 방문 기록은 자동 저장됩니다.',plan:'나의 일정',planSub:'명소 순서를 정하고 메모를 남기며 인쇄하거나 백업할 수 있습니다.',saved:'저장과 방문 기록',savedSub:'즐겨찾기, 최근 본 장소와 방문 기록은 이 기기에만 저장됩니다.'}};
let state={lang:'zh',saved:[],visited:[],recent:[],plan:[],notes:{}};
try{state={...state,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){}
let category='全部',activeId=null,view='explore';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const persist=()=>{localStorage.setItem(KEY,JSON.stringify(state));renderStats()};
const t=(z,k)=>state.lang==='ko'?k:z;
function toast(msg){const e=$('#toast');e.textContent=msg;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
function renderI18n(){const dict=state.lang==='ko'?ui.ko:ui.zh;$$('[data-i18n]').forEach(e=>e.textContent=dict[e.dataset.i18n]||e.textContent);$$('[data-lang]').forEach(b=>b.classList.toggle('on',b.dataset.lang===state.lang));document.documentElement.lang=state.lang==='ko'?'ko':'zh-CN'}
function renderStats(){$('#savedCount').textContent=state.saved.length;$('#visitedCount').textContent=state.visited.length}
function setupFilters(){const cats=['全部',...new Set(PLACES.map(p=>p.categoryZh))];$('#chips').innerHTML=cats.map(c=>`<button class="chip ${c===category?'on':''}" data-cat="${c}">${c}${c==='全部'?' · 전체':` · ${PLACES.find(p=>p.categoryZh===c).categoryKo}`}</button>`).join('');const ds=[...new Set(PLACES.map(p=>p.districtZh))];$('#district').innerHTML='<option value="">全部区域 · 전체 지역</option>'+ds.map(d=>`<option value="${d}">${d} · ${PLACES.find(p=>p.districtZh===d).districtKo}</option>`).join('')}
function card(p){const fav=state.saved.includes(p.id);return `<article class="card" data-open="${p.id}"><button class="mark" data-fav="${p.id}" aria-label="favorite">${fav?'★':'☆'}</button><div class="num">NO. ${String(p.id).padStart(2,'0')} · ${p.districtZh}/${p.districtKo}</div><h3>${t(p.titleZh,p.titleKo)}</h3><div class="ko">${state.lang==='ko'?p.titleZh:p.titleKo}</div><p>${t(p.tagZh,p.tagKo)}</p><div class="tags"><span class="tag">${t(p.categoryZh,p.categoryKo)}</span><span class="tag">${p.duration}</span>${state.visited.includes(p.id)?'<span class="tag">✓ 已到访</span>':''}</div></article>`}
function renderPlaces(){const q=$('#search').value.trim().toLowerCase(),d=$('#district').value;const list=PLACES.filter(p=>(category==='全部'||p.categoryZh===category)&&(!d||p.districtZh===d)&&(!q||p.search.includes(q)));$('#placeGrid').innerHTML=list.length?list.map(card).join(''):'<div class="empty">没有匹配内容 · 검색 결과가 없습니다</div>';$('#resultText').textContent=`${list.length} / ${PLACES.length} 个景点 · 명소`;bindCards()}
function bindCards(){$$('[data-open]').forEach(e=>e.onclick=ev=>{if(ev.target.closest('[data-fav]'))return;openPlace(+e.dataset.open)});$$('[data-fav]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();toggle('saved',+b.dataset.fav);renderAll()})}
function toggle(key,id){state[key]=state[key].includes(id)?state[key].filter(x=>x!==id):[...state[key],id];persist()}
function openPlace(id){activeId=id;const p=PLACES.find(x=>x.id===id);state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,8);persist();$('#detailEyebrow').textContent=`${p.categoryZh} · ${p.categoryKo} / ${p.districtZh} · ${p.districtKo}`;$('#detailTitle').textContent=t(p.titleZh,p.titleKo);$('#detailKo').textContent=state.lang==='ko'?p.titleZh:p.titleKo;$('#detailFacts').innerHTML=`<div class="fact">建议时长<b>${p.duration}</b></div><div class="fact">交通建议<b>${p.transport}</b></div><div class="fact">资料段落<b>${p.zh.length} 中 / ${p.ko.length} 한</b></div>`;renderNarration(p);$('#note').value=state.notes[id]||'';syncDetailButtons();$('#mapBtn').href='https://uri.amap.com/search?keyword='+encodeURIComponent(p.titleZh+' 深圳');$('#modal').classList.add('open');document.body.style.overflow='hidden'}
function renderNarration(p){const zh=`<article><h4>中文讲解</h4>${p.zh.map(x=>`<p>${x}</p>`).join('')}</article>`,ko=`<article><h4>한국어 해설</h4>${p.ko.map(x=>`<p>${x}</p>`).join('')}</article>`;$('#narration').className='narration '+(state.lang==='dual'?'dual':'');$('#narration').innerHTML=state.lang==='zh'?zh:state.lang==='ko'?ko:zh+ko}
function syncDetailButtons(){if(!activeId)return;$('#favBtn').textContent=state.saved.includes(activeId)?'取消收藏 · 저장 취소':'收藏 · 저장';$('#visitBtn').textContent=state.visited.includes(activeId)?'取消到访 · 방문 취소':'标记到访 · 방문 완료';$('#planBtn').textContent=state.plan.includes(activeId)?'移出行程 · 일정에서 삭제':'加入行程 · 일정 추가'}
function closeModal(){speechSynthesis.cancel();$('#modal').classList.remove('open');document.body.style.overflow=''}
function renderRoutes(){$('#routeList').innerHTML=ROUTES.map(r=>{const done=r.ids.filter(id=>state.visited.includes(id)).length;return `<article class="panel route"><div><div class="eyebrow">${done}/${r.ids.length} VISITED</div><h3>${t(r.zh,r.ko)}</h3><p>${t(r.descZh,r.descKo)}</p><div class="stops">${r.ids.map((id,i)=>{const p=PLACES.find(x=>x.id===id);return `<button class="stop ${state.visited.includes(id)?'done':''}" data-open="${id}">${i+1}. ${t(p.titleZh,p.titleKo)}</button>`}).join('')}</div></div><button class="ghost" data-add-route="${r.id}">加入行程</button></article>`}).join('');bindCards();$$('[data-add-route]').forEach(b=>b.onclick=()=>{const r=ROUTES.find(x=>x.id===b.dataset.addRoute);state.plan=[...new Set([...state.plan,...r.ids])];persist();renderAll();toast('路线已加入 · 코스가 추가되었습니다')})}
function renderPlanner(){const set=new Set(state.plan);$('#plannerList').innerHTML=PLACES.map(p=>`<label class="check"><input type="checkbox" data-plan-check="${p.id}" ${set.has(p.id)?'checked':''}><span>${p.titleZh}<br><small>${p.titleKo}</small></span></label>`).join('');$('#planStops').innerHTML=state.plan.length?state.plan.map((id,i)=>{const p=PLACES.find(x=>x.id===id);return `<div class="check"><b>${i+1}</b><span style="flex:1">${t(p.titleZh,p.titleKo)}<br><small>${p.districtZh} · ${p.duration}</small></span><button class="ghost" data-up="${id}">↑</button><button class="ghost" data-down="${id}">↓</button><button class="ghost" data-remove="${id}">×</button></div>`}).join(''):'<div class="empty">从左侧选择景点 · 왼쪽에서 장소를 선택하세요</div>';$$('[data-plan-check]').forEach(c=>c.onchange=()=>{togglePlan(+c.dataset.planCheck);renderPlanner()});$$('[data-remove]').forEach(b=>b.onclick=()=>{state.plan=state.plan.filter(x=>x!==+b.dataset.remove);persist();renderPlanner()});$$('[data-up]').forEach(b=>b.onclick=()=>movePlan(+b.dataset.up,-1));$$('[data-down]').forEach(b=>b.onclick=()=>movePlan(+b.dataset.down,1))}
function togglePlan(id){state.plan=state.plan.includes(id)?state.plan.filter(x=>x!==id):[...state.plan,id];persist()}
function movePlan(id,delta){const i=state.plan.indexOf(id),j=i+delta;if(j<0||j>=state.plan.length)return;[state.plan[i],state.plan[j]]=[state.plan[j],state.plan[i]];persist();renderPlanner()}
function renderSaved(){const fav=PLACES.filter(p=>state.saved.includes(p.id)),recent=state.recent.map(id=>PLACES.find(p=>p.id===id)).filter(Boolean),visited=PLACES.filter(p=>state.visited.includes(p.id));const block=(title,list)=>`<div class="sectionhead"><div><h2>${title}</h2></div></div>${list.length?`<div class="grid">${list.map(card).join('')}</div>`:'<div class="empty">暂无记录 · 기록 없음</div>'}`;$('#savedContent').innerHTML=block('收藏 · 저장',fav)+block('最近浏览 · 최근 본 장소',recent)+block('已到访 · 방문 완료',visited);bindCards()}
function setView(next){view=next;$$('[id^="view-"]').forEach(e=>e.classList.toggle('hidden',e.id!==`view-${next}`));$$('[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view===next));if(next==='routes')renderRoutes();if(next==='plan')renderPlanner();if(next==='saved')renderSaved();scrollTo({top:0,behavior:'smooth'})}
function renderAll(){renderI18n();setupFilters();renderPlaces();renderRoutes();renderPlanner();renderSaved();renderStats();if(activeId&&$('#modal').classList.contains('open'))openPlace(activeId)}
$$('[data-lang]').forEach(b=>b.onclick=()=>{state.lang=b.dataset.lang;persist();renderAll()});$$('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$$('[data-view-jump]').forEach(b=>b.onclick=()=>setView(b.dataset.viewJump));$('#chips').onclick=e=>{const b=e.target.closest('[data-cat]');if(!b)return;category=b.dataset.cat;setupFilters();renderPlaces()};$('#search').oninput=renderPlaces;$('#district').onchange=renderPlaces;$('#clearSearch').onclick=()=>{$('#search').value='';$('#district').value='';category='全部';setupFilters();renderPlaces()};$('#randomBtn').onclick=()=>openPlace(PLACES[Math.floor(Math.random()*PLACES.length)].id);$('#closeModal').onclick=closeModal;$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});$('#favBtn').onclick=()=>{toggle('saved',activeId);syncDetailButtons();renderAll()};$('#visitBtn').onclick=()=>{toggle('visited',activeId);syncDetailButtons();renderAll()};$('#planBtn').onclick=()=>{togglePlan(activeId);syncDetailButtons();renderAll()};$('#note').oninput=e=>{state.notes[activeId]=e.target.value;persist()};
$('#speakBtn').onclick=()=>{if(speechSynthesis.speaking){speechSynthesis.cancel();$('#speakBtn').textContent='播放讲解';return}const p=PLACES.find(x=>x.id===activeId),lang=state.lang==='ko'?'ko':'zh',u=new SpeechSynthesisUtterance(p[lang].join(' '));u.lang=lang==='ko'?'ko-KR':'zh-CN';u.rate=.92;u.onend=()=>$('#speakBtn').textContent='播放讲解';speechSynthesis.speak(u);$('#speakBtn').textContent='停止播放'};
$('#printBtn').onclick=()=>print();$('#exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify({version:3,exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='shenyou-backup.json';a.click();URL.revokeObjectURL(a.href)};$('#importInput').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);state={...state,...x.state};persist();renderAll();toast('导入成功 · 가져오기 완료')}catch(err){toast('文件格式错误')}};r.readAsText(f)};$('#resetBtn').onclick=()=>{if(!confirm('确认清除收藏、到访、笔记和行程？'))return;localStorage.removeItem(KEY);state={lang:'zh',saved:[],visited:[],recent:[],plan:[],notes:{}};renderAll()};
renderAll();setView('explore');
</script>
</body></html>'''


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: build_offline.py SOURCE.docx OUTPUT.html")
    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    places = extract(source)
    html = HTML.replace("__PLACES__", json.dumps(places, ensure_ascii=False, separators=(",", ":")))
    html = html.replace("__ROUTES__", json.dumps(ROUTES, ensure_ascii=False, separators=(",", ":")))
    output.write_text(html, encoding="utf-8")
    print(json.dumps({
        "output": str(output),
        "bytes": output.stat().st_size,
        "places": len(places),
        "zh_paragraphs": sum(len(p["zh"]) for p in places),
        "ko_paragraphs": sum(len(p["ko"]) for p in places),
        "generated_at": datetime.now().isoformat(timespec="seconds"),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
