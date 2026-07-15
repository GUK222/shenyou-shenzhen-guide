import source from "./bilingual-data.json";

export type Language = "zh" | "ko" | "dual";

export type GuidePlace = {
  id: number;
  titleZh: string;
  titleKo: string;
  categoryZh: string;
  categoryKo: string;
  districtZh: string;
  districtKo: string;
  tagZh: string;
  tagKo: string;
  duration: string;
  transport: string;
  zh: string[];
  ko: string[];
  search: string;
};

export const guidePlaces = source.places as GuidePlace[];

export const routeKorean: Record<string, { title: string; subtitle: string; description: string }> = {
  "futian-axis": {
    title: "푸톈 도시 중심축",
    subtitle: "산 정상에서 도시의 거실까지",
    description: "롄화산 전망에서 시작해 시민광장과 핑안 금융센터를 지나 줘웨 센터의 야경으로 마무리합니다.",
  },
  "shenzhen-bay": {
    title: "선전만 해안 코스",
    subtitle: "습지, 디자인과 서커우 야경",
    description: "철새 습지, 해안 문화, 도시 휴양과 서커우의 개방적인 분위기를 하루에 연결합니다.",
  },
  "gankeng-culture": {
    title: "간컹 객가 문화 코스",
    subtitle: "고촌과 동양식 서원",
    description: "간컹 고진과 이십사사 서원을 여유롭게 둘러보는 반일 문화 코스입니다.",
  },
  "dapeng-coast": {
    title: "다펑 산과 바다 코스",
    subtitle: "계곡, 해변과 절벽 풍경",
    description: "양메이컹과 윈하이 천사만을 연결해 선전 동부의 산과 바다를 하루 동안 경험합니다.",
  },
};

export function guideFor(id: number) {
  return guidePlaces.find((place) => place.id === id);
}

export function pick(language: Language, zh: string, ko: string) {
  return language === "ko" ? ko : zh;
}
