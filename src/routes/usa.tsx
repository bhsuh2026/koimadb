import { createFileRoute } from "@tanstack/react-router";
import { ImportersDirectory } from "@/components/ImportersDirectory";

export const Route = createFileRoute("/usa")({
  component: UsaPage,
  head: () => ({
    meta: [
      { title: "USA · Korean Importers Directory | KOIMA · 미국 거래 한국 수입업체" },
      {
        name: "description",
        content:
          "Korean importers sourcing from the United States. Browse by import scale and contact.",
      },
      { property: "og:title", content: "USA · Korean Importers Directory | KOIMA" },
      {
        property: "og:description",
        content: "Korean importers actively trading with the USA.",
      },
    ],
  }),
});

function UsaPage() {
  return (
    <ImportersDirectory
      title="미국 거래 한국 수입업체 디렉토리"
      lockedCountries={["미국"]}
      lockedLabel="🇺🇸 미국 · USA"
    />
  );
}
