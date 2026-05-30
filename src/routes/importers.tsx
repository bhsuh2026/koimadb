import { createFileRoute } from "@tanstack/react-router";
import { ImportersDirectory } from "@/components/ImportersDirectory";
import { ASEAN } from "@/lib/koima-types";

const ASEAN_NAMES = ASEAN.map((a) => a.kr);

export const Route = createFileRoute("/importers")({
  component: ImportersPage,
  head: () => ({
    meta: [
      { title: "ASEAN · Korean Importers Directory | KOIMA · 아세안 거래 한국 수입업체" },
      {
        name: "description",
        content:
          "Korean importers actively trading with the 10 ASEAN member states. Filter by country, scale and contact.",
      },
      { property: "og:title", content: "ASEAN · Korean Importers Directory | KOIMA" },
      {
        property: "og:description",
        content: "Korean importers sourcing from ASEAN.",
      },
    ],
  }),
});

function ImportersPage() {
  return (
    <ImportersDirectory
      title="아세안 거래 한국 수입업체 디렉토리"
      lockedCountries={ASEAN_NAMES}
      lockedLabel="🌏 ASEAN 10"
      regionKey="asean"
    />

  );
}
