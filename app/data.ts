export type Place = {
  id: number;
  slug: string;
  title: string;
  category: string;
  meta: string;
  district: string;
  description: string;
};

export type TourRoute = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  suggestedTime: string;
  transport: string;
  placeIds: number[];
  tone: "bay" | "city" | "heritage" | "coast";
};

export const places: Place[] = [
  { id: 1, slug: "nantou-ancient-city", title: "南头古城", category: "历史", meta: "深圳城市之根 / 新安故城", district: "南山", description: "资料称其为深圳城市之根，拥有 1700 余年建城史，是深圳、香港、东莞一带早期的政治、军事和文化中心。" },
  { id: 2, slug: "shenzhen-bay-egret-harbor", title: "深圳湾北湾鹭港", category: "滨海", meta: "滨海湿地 / 候鸟生态", district: "南山", description: "位于深圳湾北段，衔接人才公园与红树林海滨生态公园，适合观察候鸟、湿地和城市天际线。" },
  { id: 3, slug: "gankeng-ancient-town", title: "甘坑古镇", category: "历史", meta: "客家古村 / 原生街巷", district: "龙岗", description: "甘坑古镇也叫甘坑客家小镇。资料将其列为深圳十大客家古村落之一，重点呈现原址、原貌与客家村落肌理。" },
  { id: 4, slug: "lianhuashan-park", title: "莲花山公园", category: "城市", meta: "城市中轴 / 福田全景", district: "福田", description: "位于福田 CBD 核心，是深圳具有代表性的城市公园。山势平缓，登顶后可以俯瞰福田中心城区。" },
  { id: 5, slug: "huaqiangbei", title: "华强北", category: "科创", meta: "电子第一街 / 创业热土", district: "福田", description: "资料以华强北讲述深圳从边陲小镇到科创都市的变化。这里从一米柜台发展为全球重要的电子元器件集散中心。" },
  { id: 6, slug: "dongmen-night-market", title: "东门夜市", category: "夜游", meta: "老街记忆 / 城市烟火", district: "罗湖", description: "东门老街是深圳老牌商圈，也是资料中的城市商业记忆入口，适合用夜市、美食和街巷讲深圳的烟火气。" },
  { id: 7, slug: "ping-an-finance-center", title: "深圳平安金融中心", category: "城市", meta: "福田地标 / 高空视角", district: "福田", description: "位于福田 CBD 核心。资料把它作为深圳现代天际线的重要地标，适合与市民广场、莲花山串联讲解。" },
  { id: 8, slug: "yangmeikeng", title: "深圳杨梅坑", category: "滨海", meta: "七娘山 / 大亚湾海岸", district: "大鹏", description: "杨梅坑背靠七娘山、面朝大亚湾。资料以溪谷、海岸与电影取景地为线索，呈现深圳东部的山海景观。" },
  { id: 9, slug: "splendid-china", title: "锦绣中华", category: "人文", meta: "文化主题 / 民俗体验", district: "南山", description: "资料将锦绣中华民俗村概括为大型文化主题公园，通过实景与微缩景观集中展示中国历史和民俗文化。" },
  { id: 10, slug: "twenty-four-histories-academy", title: "二十四史书院", category: "人文", meta: "东方园林 / 国风研学", district: "龙岗", description: "书院位于甘坑客家古镇，以《二十四史》为核心主题，适合国风体验、汉服拍摄与文化研学。" },
  { id: 11, slug: "marisfrolg", title: "玛丝菲尔", category: "人文", meta: "仿生建筑 / 深圳时尚", district: "龙华", description: "资料从高迪风格的仿生曲线、回收材料与时装展陈切入，讲述深圳本土时尚产业和先锋建筑。" },
  { id: 12, slug: "shenzhen-bay-culture-square", title: "深圳湾文化广场", category: "人文", meta: "滨海文化 / 设计艺术", district: "南山", description: "坐落在南山后海深圳湾海岸线。资料以白色流线建筑、滨海草坡和主题展厅讲述深圳的设计文化。" },
  { id: 13, slug: "angel-bay", title: "云海天使湾", category: "滨海", meta: "月牙海湾 / 悬崖观景", district: "大鹏", description: "位于大鹏新区，海湾呈月牙形。资料收录了悬崖观景、沙滩、山海栈道等体验，适合滨海度假路线。" },
  { id: 14, slug: "sea-world", title: "海上世界", category: "夜游", meta: "明华轮 / 蛇口记忆", district: "南山", description: "以明华轮为核心的蛇口滨海地标，融合改革开放记忆、公共艺术、环球美食与夜游体验。" },
  { id: 15, slug: "happy-coast", title: "欢乐海岸", category: "夜游", meta: "岭南水乡 / 滨海夜景", district: "南山", description: "资料将岭南水乡、滨海沙滩、生态湿地、光影演艺与潮流商业串在一起，适合城市微度假和夜游。" },
  { id: 16, slug: "oh-bay", title: "欢乐港湾", category: "夜游", meta: "滨海公园 / 湾区之光", district: "宝安", description: "深圳西部滨海文旅地标，资料收录了滨海公园、摩天轮、光影水秀、演艺中心与开放式商业空间。" },
  { id: 17, slug: "civic-square", title: "市民广场", category: "城市", meta: "城市客厅 / 中轴核心", district: "福田", description: "位于福田 CBD 与深圳城市中轴线核心。向北连接莲花山，向南面对平安金融中心和高层建筑群。" },
  { id: 18, slug: "one-avenue", title: "卓悦中心", category: "夜游", meta: "开放街区 / 都市生活", district: "福田", description: "位于福田 CBD 核心，资料将其定位为开放式街区型商业综合体，适合连接城市夜景、餐饮与休闲体验。" },
];

export const categories = ["全部", "历史", "滨海", "人文", "城市", "科创", "夜游"];

export const tourRoutes: TourRoute[] = [
  {
    id: "futian-axis",
    title: "福田城市中轴",
    subtitle: "从山顶看到城市客厅",
    description: "莲花山俯瞰开场，经市民广场进入现代深圳，最后在城市高楼与街区夜色中收尾。",
    suggestedTime: "半日",
    transport: "步行与地铁",
    placeIds: [4, 17, 7, 18],
    tone: "city",
  },
  {
    id: "shenzhen-bay",
    title: "深圳湾滨海线",
    subtitle: "湿地、设计与蛇口夜色",
    description: "把候鸟湿地、滨海文化、城市度假和蛇口开放气质串成一条完整的深圳湾体验。",
    suggestedTime: "一日",
    transport: "地铁与步行",
    placeIds: [2, 12, 15, 14],
    tone: "bay",
  },
  {
    id: "gankeng-culture",
    title: "甘坑客家人文",
    subtitle: "古村与东方书院",
    description: "同一区域内完成客家古村与国风书院体验，移动成本低，适合轻松的文化半日游。",
    suggestedTime: "半日",
    transport: "步行",
    placeIds: [3, 10],
    tone: "heritage",
  },
  {
    id: "dapeng-coast",
    title: "大鹏山海线",
    subtitle: "溪谷、海湾与悬崖风景",
    description: "用完整一天感受深圳东部山海。路线跨度较大，适合提前安排交通并预留返程时间。",
    suggestedTime: "一日",
    transport: "自驾或预约交通",
    placeIds: [8, 13],
    tone: "coast",
  },
];

export function getPlace(id: number) {
  return places.find((place) => place.id === id);
}
