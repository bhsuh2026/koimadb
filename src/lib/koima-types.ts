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

export const ASEAN: { kr: string; en: string }[] = [
  { kr: "베트남", en: "Vietnam" },
  { kr: "태국", en: "Thailand" },
  { kr: "말레이시아", en: "Malaysia" },
  { kr: "인도네시아", en: "Indonesia" },
  { kr: "싱가포르", en: "Singapore" },
  { kr: "필리핀", en: "Philippines" },
  { kr: "캄보디아", en: "Cambodia" },
  { kr: "미얀마", en: "Myanmar" },
  { kr: "라오스", en: "Laos" },
  { kr: "브루나이", en: "Brunei" },
];

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
