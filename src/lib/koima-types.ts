export type Company = {
  id: string;
  biz_no: string | null;
  name_kr: string;
  name_en: string;
  email: string;
  phone: string;
  scale_code: number;
  asean_countries: string[];
  other_countries: string[];
};

export type CompanyInput = Omit<Company, "id">;

export const ASEAN: { kr: string; en: string; flag: string }[] = [
  { kr: "베트남", en: "Vietnam", flag: "🇻🇳" },
  { kr: "태국", en: "Thailand", flag: "🇹🇭" },
  { kr: "말레이시아", en: "Malaysia", flag: "🇲🇾" },
  { kr: "인도네시아", en: "Indonesia", flag: "🇮🇩" },
  { kr: "싱가포르", en: "Singapore", flag: "🇸🇬" },
  { kr: "필리핀", en: "Philippines", flag: "🇵🇭" },
  { kr: "캄보디아", en: "Cambodia", flag: "🇰🇭" },
  { kr: "미얀마", en: "Myanmar", flag: "🇲🇲" },
  { kr: "라오스", en: "Laos", flag: "🇱🇦" },
  { kr: "브루나이", en: "Brunei", flag: "🇧🇳" },
];

export const ASEAN_FLAG = "🌏";

// Korean country name -> flag emoji. Covers ASEAN + the most common
// non-ASEAN sourcing markets that appear in KOIMA data.
const COUNTRY_FLAGS: Record<string, string> = {
  베트남: "🇻🇳", 태국: "🇹🇭", 말레이시아: "🇲🇾", 인도네시아: "🇮🇩",
  싱가포르: "🇸🇬", 필리핀: "🇵🇭", 캄보디아: "🇰🇭", 미얀마: "🇲🇲",
  라오스: "🇱🇦", 브루나이: "🇧🇳",
  중국: "🇨🇳", 일본: "🇯🇵", 미국: "🇺🇸", 대만: "🇹🇼", 홍콩: "🇭🇰",
  인도: "🇮🇳", 독일: "🇩🇪", 영국: "🇬🇧", 프랑스: "🇫🇷", 이탈리아: "🇮🇹",
  스페인: "🇪🇸", 네덜란드: "🇳🇱", 벨기에: "🇧🇪", 스위스: "🇨🇭",
  러시아: "🇷🇺", 캐나다: "🇨🇦", 멕시코: "🇲🇽", 브라질: "🇧🇷",
  호주: "🇦🇺", 뉴질랜드: "🇳🇿", 터키: "🇹🇷", 튀르키예: "🇹🇷",
  사우디아라비아: "🇸🇦", 아랍에미리트: "🇦🇪", 이스라엘: "🇮🇱",
  이집트: "🇪🇬", 남아프리카공화국: "🇿🇦", 파키스탄: "🇵🇰", 방글라데시: "🇧🇩",
  스리랑카: "🇱🇰", 네팔: "🇳🇵", 몽골: "🇲🇳", 카자흐스탄: "🇰🇿",
  우즈베키스탄: "🇺🇿", 폴란드: "🇵🇱", 체코: "🇨🇿", 오스트리아: "🇦🇹",
  스웨덴: "🇸🇪", 노르웨이: "🇳🇴", 핀란드: "🇫🇮", 덴마크: "🇩🇰",
  아일랜드: "🇮🇪", 포르투갈: "🇵🇹", 그리스: "🇬🇷", 헝가리: "🇭🇺",
  루마니아: "🇷🇴", 우크라이나: "🇺🇦", 칠레: "🇨🇱", 아르헨티나: "🇦🇷",
  페루: "🇵🇪", 콜롬비아: "🇨🇴", 이란: "🇮🇷", 이라크: "🇮🇶",
  카타르: "🇶🇦", 쿠웨이트: "🇰🇼", 오만: "🇴🇲", 요르단: "🇯🇴",
  케냐: "🇰🇪", 나이지리아: "🇳🇬", 모로코: "🇲🇦", 알제리: "🇩🇿",
};

export const flagOf = (country: string): string =>
  COUNTRY_FLAGS[country.trim()] ?? "🏳️";

export const SCALE: Record<number, [string, string]> = {
  6: ["50만불 미만", "Under USD 0.5M"],
  7: ["50만~100만불", "USD 0.5–1M"],
  8: ["100만~300만불", "USD 1–3M"],
  9: ["300만~500만불", "USD 3–5M"],
  10: ["500만~700만불", "USD 5–7M"],
  11: ["700만~1,000만불", "USD 7–10M"],
  12: ["1,000만~3,000만불", "USD 10–30M"],
  13: ["3,000만~5,000만불", "USD 30–50M"],
  14: ["5,000만~1억불", "USD 50–100M"],
  15: ["1억불 초과", "Over USD 100M"],
};

export const SCOLOR: Record<number, [string, string]> = {
  6: ["#6D6E70", "#ececec"],
  7: ["#5a6a3a", "#eef0e4"],
  8: ["#4a6a4a", "#e6f0e8"],
  9: ["#3a6a6a", "#e2f0f0"],
  10: ["#3a5a8a", "#e4eaf4"],
  11: ["#1A2B5E", "#e6e9f2"],
  12: ["#5a3a8a", "#ebe4f2"],
  13: ["#8a3a6a", "#f2e4ec"],
  14: ["#a83a3a", "#f4e4e4"],
  15: ["#D0001B", "#fae2e4"],
};
