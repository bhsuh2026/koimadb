import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import readline from "readline";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(url, key, { auth: { persistSession: false } });

function parsePgArray(s: string): string[] {
  if (!s || s === "{}") return [];
  // Strip braces
  const inner = s.slice(1, -1);
  if (!inner) return [];
  const out: string[] = [];
  let cur = "", inQ = false, esc = false;
  for (const ch of inner) {
    if (esc) { cur += ch; esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.filter(Boolean);
}

const file = "/tmp/imp_out.tsv";
const rl = readline.createInterface({ input: fs.createReadStream(file) });

const BATCH = 500;
let batch: any[] = [];
let total = 0;

async function flush() {
  if (!batch.length) return;
  const { error } = await sb.from("importers").insert(batch);
  if (error) { console.error("ERR", error.message); process.exit(1); }
  total += batch.length;
  if (total % 5000 === 0) console.log("inserted", total);
  batch = [];
}

for await (const line of rl) {
  if (!line) continue;
  const c = line.split("\t");
  if (c.length < 14) continue;
  const intOrNull = (v: string) => (v === "\\N" || v === "" ? null : parseInt(v, 10));
  batch.push({
    rank_import: intOrNull(c[0]),
    rank_sales: intOrNull(c[1]),
    biz_no: c[2] === "\\N" ? null : c[2],
    name_kr: c[3],
    name_en: c[4],
    email: c[5],
    email_extra: c[6],
    phone: c[7],
    phone_extra: c[8],
    countries: parsePgArray(c[9]),
    scale_label: c[10],
    items_kr: c[11],
    items_en: c[12],
    hs_codes: parsePgArray(c[13]),
  });
  if (batch.length >= BATCH) await flush();
}
await flush();
console.log("DONE total=", total);
