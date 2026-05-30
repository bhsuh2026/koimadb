import { createFileRoute } from "@tanstack/react-router";
import { ImportersDirectory } from "@/components/ImportersDirectory";
import { CIS_NAMES } from "@/lib/koima-types";

export const Route = createFileRoute("/cis")({
  component: CisPage,
  head: () => ({
    meta: [
      { title: "CIS · Korean Importers Directory | KOIMA · 독립국가연합 거래 한국 수입업체" },
      {
        name: "description",
        content:
          "Korean importers actively trading with the 12 CIS nations. Filter by country, scale and contact.",
      },
      { property: "og:title", content: "CIS · Korean Importers Directory | KOIMA" },
      {
        property: "og:description",
        content: "Korean importers sourcing from the Commonwealth of Independent States.",
      },
    ],
  }),
});

function CisPage() {
  return (
    <ImportersDirectory
      title="CIS 거래 한국 수입업체 디렉토리"
      lockedCountries={CIS_NAMES}
      lockedLabel="🌍 CIS 12"
    />
  );
}
