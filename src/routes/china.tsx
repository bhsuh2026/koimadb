import { createFileRoute } from "@tanstack/react-router";
import { ImportersDirectory } from "@/components/ImportersDirectory";

export const Route = createFileRoute("/china")({
  component: ChinaPage,
  head: () => ({
    meta: [
      { title: "중국 거래 한국 수입업체 — 2025 관세청 기준" },
      {
        name: "description",
        content:
          "중국 제품을 수입 중인 한국 기업을 사업자정보 · 품목 · HS코드 · 연락처와 함께 검색하세요.",
      },
      { property: "og:title", content: "중국 거래 한국 수입업체 디렉토리" },
      {
        property: "og:description",
        content: "Korean importers sourcing from China — 2025 Korea Customs data.",
      },
    ],
  }),
});

function ChinaPage() {
  return (
    <ImportersDirectory
      lockedCountry="중국"
      title="중국 거래 한국 수입업체"
      scopeBadge="🇨🇳"
    />
  );
}
