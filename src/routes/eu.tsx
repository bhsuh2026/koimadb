import { createFileRoute } from "@tanstack/react-router";
import { ImportersDirectory } from "@/components/ImportersDirectory";
import { EU_NAMES } from "@/lib/koima-types";

export const Route = createFileRoute("/eu")({
  component: EuPage,
  head: () => ({
    meta: [
      { title: "EU · Korean Importers Directory | KOIMA · 유럽연합 거래 한국 수입업체" },
      {
        name: "description",
        content:
          "Korean importers actively trading with the 27 EU member states. Filter by country, scale and contact.",
      },
      { property: "og:title", content: "EU · Korean Importers Directory | KOIMA" },
      {
        property: "og:description",
        content: "Korean importers sourcing from the European Union.",
      },
    ],
  }),
});

function EuPage() {
  return (
    <ImportersDirectory
      title="EU 거래 한국 수입업체 디렉토리"
      lockedCountries={EU_NAMES}
      lockedLabel="🇪🇺 EU 27"
    />
  );
}
