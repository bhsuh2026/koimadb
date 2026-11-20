import { describe, expect, test } from "bun:test";
import { centralAsiaImporters, directoryFacets, filterDirectoryRows, safeWebsite, type DirectoryFilters } from "./central-asia-data";

const filters: DirectoryFilters = { q: "", countries: [], scales: [], hs: "", hasEmail: false, exact: false, sort: "rank_import_asc", page: 1, pageSize: 50 };

describe("Central Asia uploaded records", () => {
  test("keeps all 249 companies and stable unique identifiers", () => {
    expect(centralAsiaImporters).toHaveLength(249);
    expect(new Set(centralAsiaImporters.map((r) => r.id)).size).toBe(249);
    expect(filterDirectoryRows(centralAsiaImporters, filters).total).toBe(249);
  });
  test("preserves the 188 estimated product records separately", () => {
    expect(centralAsiaImporters.filter((r) => r.product_source === "AI추정")).toHaveLength(188);
    expect(centralAsiaImporters.filter((r) => r.product_source === "기존값")).toHaveLength(61);
  });
  test("country filters reflect the supplied five-country records", () => {
    expect(directoryFacets(centralAsiaImporters).countries).toEqual({ 카자흐스탄: 114, 우즈베키스탄: 119, 키르기스스탄: 26, 타지키스탄: 3, 투르크멘: 1 });
    expect(filterDirectoryRows(centralAsiaImporters, { ...filters, countries: ["투르크멘"] }).total).toBe(1);
  });
  test("search and pagination use only the explicitly supplied records", () => {
    const samsung = centralAsiaImporters.find((r) => r.name_kr === "삼성전자");
    if (!samsung) throw new Error("Missing Samsung source record");
    expect(filterDirectoryRows([samsung], filters).total).toBe(1);
    expect(filterDirectoryRows(centralAsiaImporters, { ...filters, q: "(주)삼성전자" }).rows.map((r) => r.name_kr)).toEqual(["삼성전자"]);
    expect(filterDirectoryRows(centralAsiaImporters, { ...filters, page: 5 }).rows).toHaveLength(49);
  });
  test("supports HS prefixes and exact product matching without fabricating emails", () => {
    const samsung = centralAsiaImporters.find((r) => r.name_kr === "삼성전자");
    if (!samsung) throw new Error("Missing Samsung source record");
    expect(filterDirectoryRows([samsung], { ...filters, hs: "8486", hasEmail: true }).total).toBe(1);
    expect(filterDirectoryRows([samsung], { ...filters, q: "스마트폰", exact: true }).total).toBe(1);
    expect(filterDirectoryRows([samsung], { ...filters, q: "스마트", exact: true }).total).toBe(0);
    expect(samsung.email).toBe("");
    expect(samsung.biz_no).toBeNull();
  });
  test("website links permit only web addresses", () => {
    expect(safeWebsite("www.samsung.com/sec")).toBe("https://www.samsung.com/sec");
    expect(safeWebsite("javascript:alert(1)")).toBeNull();
    expect(safeWebsite("")).toBeNull();
  });
});