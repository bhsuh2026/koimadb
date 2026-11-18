import { createFileRoute } from "@tanstack/react-router";
import { ImportersDirectory } from "@/components/ImportersDirectory";

const CA = [
  { kr: "카자흐스탄", flag: "🇰🇿", items: "우라늄·광물, 원유·석유제품, 밀·곡물, 구리·철합금" },
  { kr: "우즈베키스탄", flag: "🇺🇿", items: "면화·섬유제품, 금, 구리, 말린 과일(살구·건포도), 신선 과일·채소" },
  { kr: "키르기스스탄", flag: "🇰🇬", items: "금, 꿀, 말린 과일·견과류, 모직·펠트 제품" },
  { kr: "타지키스탄", flag: "🇹🇯", items: "면화, 알루미늄, 말린 과일, 꿀" },
  { kr: "투르크멘", flag: "🇹🇲", items: "천연가스, 석유화학 제품, 면화·섬유", label: "투르크메니스탄" },
];

export const Route = createFileRoute("/central-asia")({
  component: CentralAsiaPage,
  head: () => ({
    meta: [
      { title: "Central Asia · Korean Importers Directory | KOIMA · 중앙아시아 거래 한국 수입업체" },
      { name: "description", content: "Korean importers trading with Kazakhstan, Uzbekistan, Kyrgyzstan, Tajikistan and Turkmenistan." },
      { property: "og:title", content: "Central Asia · Korean Importers Directory | KOIMA" },
      { property: "og:description", content: "Korean importers sourcing from the 5 Central Asian countries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function CentralAsiaPage() {
  return (
    <>
      <ImportersDirectory
        title="중앙아시아 거래 한국 수입업체 디렉토리"
        lockedCountries={CA.map((c) => c.kr)}
        lockedLabel="🌏 중앙아시아"
      />
    </>
  );
}
