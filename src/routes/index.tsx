import { createFileRoute } from "@tanstack/react-router";
import { ImportersDirectory } from "@/components/ImportersDirectory";

export const Route = createFileRoute("/")({
  component: ImportersPage,
  head: () => ({
    meta: [
      { title: "한국 수입업체 디렉토리 — 2025 관세청 기준" },
      {
        name: "description",
        content:
          "2025년 관세청 기준 한국 수입업체 11.8만 곳의 사업자정보 · 수입국가 · 품목 · HS코드 · 연락처를 한 곳에서 검색하세요.",
      },
      { property: "og:title", content: "한국 수입업체 디렉토리" },
      {
        property: "og:description",
        content: "2025 관세청 기준 한국 수입업체 11.8만 곳을 검색하세요.",
      },
    ],
  }),
});

function ImportersPage() {
  return <ImportersDirectory title="한국 수입업체 디렉토리" />;
}
