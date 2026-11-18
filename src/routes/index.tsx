import { createFileRoute } from "@tanstack/react-router";
import { ImportersDirectory } from "@/components/ImportersDirectory";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({ meta: [
    { title: "바이어 기업정보 | KOIMA" },
    { name: "description", content: "한국 바이어 기업의 수입국가, 취급 품목, 수입규모와 기업 상세정보를 검색하세요." },
    { property: "og:title", content: "바이어 기업정보 | KOIMA" },
    { property: "og:description", content: "한국 수입 바이어 기업정보 검색 및 상세조회." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

function HomePage() {
  return <ImportersDirectory title="바이어 기업정보" />;
}
