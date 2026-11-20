import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { centralAsiaImporters, centralAsiaFacets, queryCentralAsia, usesCentralAsiaDataset } from "./central-asia-data";

const filters = { countries: [], scales: [], hs: "", hasEmail: false, exact: false, sort: "rank_import_asc", page: 1, pageSize: 50 };

describe("Central Asia uploaded records", () => {
  test("only the Central Asia page opts into the uploaded dataset", () => {
    assert.equal(usesCentralAsiaDataset("central-asia"), true);
    for (const scope of [undefined, "default", "eu", "cis", "vietnam"]) assert.equal(usesCentralAsiaDataset(scope), false);
  });
  test("all 249 uploaded companies remain distinct", () => {
    assert.equal(centralAsiaImporters.length, 249);
    assert.equal(new Set(centralAsiaImporters.map((r) => r.id)).size, 249);
    assert.equal(queryCentralAsia(filters, [], []).total, 249);
  });
  test("188 inferred product records retain provenance", () => {
    assert.equal(centralAsiaImporters.filter((r) => r.product_source === "AI추정").length, 188);
  });
  test("country filters use uploaded counts and normalize Turkmenistan", () => {
    assert.deepEqual(centralAsiaFacets().countries, { "카자흐스탄": 114, "우즈베키스탄": 119, "키르기스스탄": 26, "타지키스탄": 3, "투르크멘": 1 });
    assert.equal(queryCentralAsia({ ...filters, countries: ["투르크멘"] }, [], []).total, 1);
  });
  test("real company search reads uploaded industry and website", () => {
    const row = queryCentralAsia(filters, ["삼성전자"], []).rows[0];
    assert.equal(row?.industry_kr, "이동전화기 제조업");
    assert.equal(row?.website, "https://www.samsung.com/sec");
  });
  test("pagination and email availability are applied without fabricated contacts", () => {
    assert.equal(queryCentralAsia({ ...filters, page: 5 }, [], []).rows.length, 49);
    const result = queryCentralAsia({ ...filters, hasEmail: true }, [], []);
    assert.equal(result.total, centralAsiaImporters.filter((r) => r.has_email).length);
    assert.equal(result.rows.every((r) => r.email === ""), true);
  });
});