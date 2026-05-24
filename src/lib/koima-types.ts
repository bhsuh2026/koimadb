export type AseanCountry = { kr: string; en: string; n: number };
export type ScaleMap = Record<string, [string, string]>;
// rec tuple: [biz, nameKr, nameEn, email, phone, scaleCode, aseanIdx[], otherCountries[]]
export type Record8 = [
  string,
  string,
  string,
  string,
  string,
  number,
  number[],
  string[],
];
export type KoimaData = {
  updated: string;
  total: number;
  scale: ScaleMap;
  asean: AseanCountry[];
  records: Record8[];
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
