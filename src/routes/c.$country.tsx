import { createFileRoute } from "@tanstack/react-router";
import { ImportersDirectory } from "@/components/ImportersDirectory";
import { displayCountry, flagOf } from "@/lib/koima-types";

export const Route = createFileRoute("/c/$country")({
  component: CountryPage,
  head: ({ params }) => {
    const country = decodeURIComponent(params.country);
    const en = displayCountry(country, "en");
    return {
      meta: [
        { title: `${en} · Korean Importers Directory | KOIMA · ${country} 거래 한국 수입업체` },
        {
          name: "description",
          content: `Korean importers actively trading with ${en}. Filter by scale, items and contact.`,
        },
        { property: "og:title", content: `${en} · Korean Importers Directory | KOIMA` },
        { property: "og:description", content: `Korean importers sourcing from ${en}.` },
      ],
    };
  },
});

function CountryPage() {
  const { country } = Route.useParams();
  const decoded = decodeURIComponent(country);
  const flag = flagOf(decoded);
  return (
    <ImportersDirectory
      title={`${decoded} 거래 한국 수입업체 디렉토리`}
      lockedCountries={[decoded]}
      lockedLabel={`${flag} ${decoded}`}
    />
  );
}
