export type QuizQuestion = {
  id: string;
  placeId: number;
  questionZh: string;
  questionKo: string;
  optionsZh: string[];
  optionsKo: string[];
  answer: number;
  explainZh: string;
  explainKo: string;
};

export const guideSkills = [
  { id: "facts", zh: "城市知识", ko: "도시 지식", noteZh: "历史、地标与城市脉络", noteKo: "역사, 랜드마크와 도시 맥락" },
  { id: "language", zh: "双语表达", ko: "이중언어 표현", noteZh: "中文要点与韩文讲解", noteKo: "중국어 핵심과 한국어 해설" },
  { id: "route", zh: "线路组织", ko: "코스 구성", noteZh: "集合、转场与时间控制", noteKo: "집합, 이동과 시간 관리" },
  { id: "service", zh: "带团实务", ko: "인솔 실무", noteZh: "交通、提示与现场应对", noteKo: "교통, 안내와 현장 대응" },
] as const;

export const quizQuestions: QuizQuestion[] = [
  {
    id: "nantou-history",
    placeId: 1,
    questionZh: "讲解南头古城时，最适合作为开场的核心定位是什么？",
    questionKo: "난터우 고성을 설명할 때 가장 적절한 핵심 도입은 무엇인가요?",
    optionsZh: ["深圳城市之根", "深圳最高建筑", "滨海候鸟保护区", "大型民俗主题公园"],
    optionsKo: ["선전 도시의 뿌리", "선전 최고층 건물", "해안 철새 보호구역", "대형 민속 테마파크"],
    answer: 0,
    explainZh: "南头古城拥有 1700 余年建城史，是讲述深圳早期城市历史的重要入口。",
    explainKo: "난터우 고성은 1,700년이 넘는 도시 역사를 지닌 선전 초기 역사의 중요한 출발점입니다.",
  },
  {
    id: "huaqiangbei-theme",
    placeId: 5,
    questionZh: "华强北讲解最适合连接深圳的哪条城市发展主线？",
    questionKo: "화창베이 해설은 선전의 어떤 발전 흐름과 연결하기 좋나요?",
    optionsZh: ["电子产业与创业", "客家古村保护", "滨海生态修复", "传统渔业生产"],
    optionsKo: ["전자 산업과 창업", "객가 고촌 보존", "해안 생태 복원", "전통 어업"],
    answer: 0,
    explainZh: "华强北从一米柜台发展为重要电子元器件集散中心，能代表深圳的创业与科创速度。",
    explainKo: "화창베이는 작은 판매대에서 세계적인 전자 부품 유통 중심지로 성장해 선전의 창업과 혁신 속도를 보여 줍니다.",
  },
  {
    id: "bay-ecology",
    placeId: 2,
    questionZh: "深圳湾北湾鹭港讲解中，应重点提醒游客观察什么？",
    questionKo: "선전만 베이완 루강에서 중점적으로 관찰할 대상은 무엇인가요?",
    optionsZh: ["候鸟、湿地与天际线", "仿生建筑", "客家围屋", "电子市场"],
    optionsKo: ["철새, 습지와 스카이라인", "생체모방 건축", "객가 가옥", "전자 시장"],
    answer: 0,
    explainZh: "这里连接人才公园与红树林海滨生态空间，适合从生态与现代城市并置切入。",
    explainKo: "이곳은 인재공원과 맹그로브 해안 생태 공간을 이어 생태와 현대 도시를 함께 설명하기 좋습니다.",
  },
  {
    id: "sea-world-symbol",
    placeId: 14,
    questionZh: "海上世界最具代表性的核心地标是什么？",
    questionKo: "씨월드의 가장 대표적인 핵심 랜드마크는 무엇인가요?",
    optionsZh: ["明华轮", "湾区之光摩天轮", "平安金融中心", "二十四史书院"],
    optionsKo: ["밍화호", "베이 에어리어 라이트 대관람차", "핑안 금융센터", "이십사사 서원"],
    answer: 0,
    explainZh: "明华轮是蛇口海上世界的核心地标，可用于串联改革开放、港口与国际化记忆。",
    explainKo: "밍화호는 서커우 씨월드의 핵심 상징으로 개혁개방, 항구와 국제화의 기억을 연결합니다.",
  },
  {
    id: "futian-axis",
    placeId: 4,
    questionZh: "福田城市中轴线路最适合从哪里俯瞰开场？",
    questionKo: "푸톈 도시 중심축 코스는 어디에서 내려다보며 시작하기 좋나요?",
    optionsZh: ["莲花山公园", "东门夜市", "甘坑古镇", "杨梅坑"],
    optionsKo: ["롄화산 공원", "둥먼 야시장", "간컹 고진", "양메이컹"],
    answer: 0,
    explainZh: "莲花山山势平缓，山顶可俯瞰市民中心与福田天际线，是建立城市空间关系的好位置。",
    explainKo: "롄화산 정상에서는 시민중심과 푸톈 스카이라인을 내려다볼 수 있어 도시 공간 관계를 설명하기 좋습니다.",
  },
  {
    id: "oh-bay-landmark",
    placeId: 16,
    questionZh: "欢乐港湾讲解中，最容易被游客识别的视觉地标是？",
    questionKo: "OH BAY 해설에서 관광객이 가장 쉽게 알아보는 시각적 랜드마크는 무엇인가요?",
    optionsZh: ["湾区之光摩天轮", "明华轮", "莲花山雕像", "电子大楼"],
    optionsKo: ["베이 에어리어 라이트 대관람차", "밍화호", "롄화산 동상", "전자상가"],
    answer: 0,
    explainZh: "欢乐港湾以滨海公园和湾区之光摩天轮形成鲜明识别，也适合延伸到宝安西部城市发展。",
    explainKo: "OH BAY는 해안공원과 대관람차가 뚜렷한 상징을 이루며 바오안 서부의 도시 발전까지 연결해 설명할 수 있습니다.",
  },
];

export function learningGoals(placeId: number) {
  const goals: Record<number, { zh: string[]; ko: string[] }> = {
    1: { zh: ["说出 1700 余年建城史", "解释“深圳城市之根”", "完成 60 秒双语开场"], ko: ["1,700년 이상의 역사를 설명하기", "선전 도시의 뿌리를 설명하기", "60초 이중언어 도입 완성하기"] },
    5: { zh: ["说明一米柜台的产业故事", "连接创业与科创主题", "准备游客常见购物提示"], ko: ["작은 판매대에서 시작한 산업 이야기", "창업과 혁신 주제 연결하기", "쇼핑 시 주의사항 준비하기"] },
    14: { zh: ["识别明华轮核心地标", "串联蛇口开放历史", "设计夜游收尾话术"], ko: ["밍화호 핵심 상징 파악하기", "서커우 개방 역사 연결하기", "야간 투어 마무리 멘트 만들기"] },
  };
  return goals[placeId] ?? {
    zh: ["记住 3 个核心事实", "掌握中文名称与韩文表达", "完成 60 秒现场讲解"],
    ko: ["핵심 사실 3개 기억하기", "중국어 명칭과 한국어 표현 익히기", "60초 현장 해설 완성하기"],
  };
}
