import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { publicImporterResult, publicFacetResult } from "../src/lib/public-importers.server";

describe("Importer contact protection", () => {
  test("public responses accept masked records and discard unrelated fields", () => {
    const result = publicImporterResult.parse({ total: 1, rows: [{
      id: "sample", name_kr: "기업", name_en: "Company", rank_import: null,
      rank_sales: null, biz_no: "12345*****", email: "ab***@***.com",
      email_extra: "", phone: "02123****", phone_extra: "", countries: ["중국"],
      scale_label: "", items_kr: "품목…", items_en: "Items…", hs_codes: ["1234**"],
      internal_note: "not a public field",
    }] });
    assert.equal(result.rows[0]?.phone, "02123****");
    assert.equal("internal_note" in (result.rows[0] ?? {}), false);
    assert.equal(publicImporterResult.safeParse({ total: -1, rows: [] }).success, false);
  });

  test("public facets contain counts rather than contact records", () => {
    const result = publicFacetResult.parse({ total: 10, countries: { "중국": 10 }, scales: {}, phone: "discarded" });
    assert.equal("phone" in result, false);
    assert.equal(publicFacetResult.safeParse({ total: 1, countries: { "중국": "invalid" }, scales: {} }).success, false);
  });

  test("migration denies anonymous raw reads and masks every contact projection", () => {
    const sql = readFileSync(new URL("../drizzle/migrations/0000_protect_importer_contacts.sql", import.meta.url), "utf8");
    assert.match(sql, /DROP POLICY IF EXISTS "Anyone can read importers"/);
    assert.match(sql, /REVOKE SELECT ON public\.importers FROM anon/);
    for (const field of ["phone", "phone_extra", "email", "email_extra", "biz_no"]) {
      assert.match(sql, new RegExp(`public\\.mask_importer_field\\(r\\.${field},`));
    }
    assert.match(sql, /SET search_path = ''/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.search_public_importers.*FROM PUBLIC/);
    assert.match(sql, /format\(' AND r\.countries && %L::text\[\]'/);
  });

  test("administrator reads require the authenticated caller's protected role row", () => {
    const sql = readFileSync(new URL("../drizzle/migrations/0002_scope_importer_reads_to_admin_role_rows.sql", import.meta.url), "utf8");
    assert.match(sql, /WHERE user_id = auth\.uid\(\) AND role = 'admin'/);
    const code = readFileSync(new URL("../src/lib/importers.functions.ts", import.meta.url), "utf8");
    assert.doesNotMatch(code, /import \{ supabase as supabaseAdmin \}/);
    assert.match(code, /const \{ supabase: supabaseAdmin \} = context/);
  });
});