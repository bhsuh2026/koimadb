import { describe, expect, test } from "bun:test";
import { centralAsiaImporters, centralAsiaFacets, queryCentralAsia, usesCentralAsiaDataset } from "./central-asia-data";

const filters = { countries: [], scales: [], hs: "", hasEmail: false, exact: false, sort: "rank_import_asc", page: 1, pageSize: 50 };

describe("Central Asia uploaded records", () => {
  test("only the Central Asia page opts into the uploaded dataset", () => {
    expect(usesCentralAsiaDataset("central-asia")).toBe(true);
    for (const scope of [undefined, "default", "eu", "cis", "vietnam"]) expect(usesCentralAsiaDataset(scope)).toBe(false);
  });
  test("all 249 uploaded companies remain distinct", () => {
    expect(centralAsiaImporters).toHaveLength(249);
    expect(new Set(centralAsiaImporters.map((r) => r.id)).size).toBe(249);
    expect(queryCentralAsia(filters, [], []).total).toBe(249);
  });
  test("188 inferred product records retain provenance", () => {
    expect(centralAsiaImporters.filter((r) => r.product_source === "AI추정")).toHaveLength(188);
  });
  test("country filters use uploaded counts and normalize Turkmenistan", () => {
    expect(centralAsiaFacets().countries).toEqual({ "카자흐스탄": 114, "우즈베키스탄": 119, "키르기스스탄": 26, "타지키스탄": 3, "투르크멘": 1 });
    expect(queryCentralAsia({ ...filters, countries: ["투르크멘"] }, [], []).total).toBe(1);
  });
  test("real company search reads uploaded industry and website", () => {
    const row = queryCentralAsia(filters, ["삼성전자"], []).rows[0];
    expect(row?.industry_kr).toBe("이동전화기 제조업");
    expect(row?.website).toBe("https://www.samsung.com/sec");
  });
  test("pagination and email availability are applied without fabricated contacts", () => {
    expect(queryCentralAsia({ ...filters, page: 5 }, [], []).rows).toHaveLength(49);
    const result = queryCentralAsia({ ...filters, hasEmail: true }, [], []);
    expect(result.total).toBe(centralAsiaImporters.filter((r) => r.has_email).length);
    expect(result.rows.every((r) => r.email === "")).toBe(true);
  });
});