import { createFileRoute } from "@tanstack/react-router";
import { ImportersDirectory } from "@/components/ImportersDirectory";

export const Route = createFileRoute("/china")({
  component: ChinaPage,
  head: () => ({
    meta: [
      { title: "China · Korean Importers Directory | KOIMA · 中国 · 韩国进口商" },
      {
        name: "description",
        content:
          "Korean importers actively trading with China — 中国相关韩国进口商名录 · 중국 거래 한국 수입업체 디렉토리.",
      },
      { property: "og:title", content: "China · Korean Importers Directory | KOIMA" },
      {
        property: "og:description",
        content:
          "Korean importers sourcing from China. Browse by import scale and contact.",
      },
    ],
  }),
});

function ChinaPage() {
  return (
    <ImportersDirectory
      title="중국 거래 한국 수입업체 디렉토리"
      lockedCountries={["중국"]}
      lockedLabel="🇨🇳 중국 · China"
    />
  );
}
