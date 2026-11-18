import { createFileRoute } from "@tanstack/react-router";
import { ImportersDirectory } from "@/components/ImportersDirectory";

type SearchParams = { q?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: SearchPage,
  head: ({ match }) => {
    const q = (match.search as SearchParams)?.q ?? "";
    const title = q
      ? `"${q}" 검색 결과 — 한국 수입업체 디렉토리`
      : "한국 수입업체 검색 — 2025 관세청 기준";
    return {
      meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
        { title },
        {
          name: "description",
          content:
            "2025 관세청 기준 한국 수입업체 11.8만 곳을 업체명·사업자번호·품목으로 검색하세요.",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: "KOIMA 한국 바이어 기업정보 검색 결과." },
      ],
    };
  },
});

function SearchPage() {
  const { q } = Route.useSearch();
  return <ImportersDirectory title="한국 수입업체 검색" initialQuery={q ?? ""} />;
}
