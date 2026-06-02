import { createFileRoute } from "@tanstack/react-router";
import { ImportersDirectory } from "@/components/ImportersDirectory";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/vietnam")({
  component: VietnamPage,
  head: () => ({
    meta: [
      {
        title:
          "Vietnam · Korean Importers Directory | KOIMA · Việt Nam · 베트남 한국 수입업체",
      },
      {
        name: "description",
        content:
          "Korean importers actively trading with Vietnam — Danh bạ nhà nhập khẩu Hàn Quốc giao dịch với Việt Nam · 베트남 거래 한국 수입업체 디렉토리 (VKFTA, AKFTA, RCEP).",
      },
      {
        property: "og:title",
        content: "Vietnam · Korean Importers Directory | KOIMA",
      },
      {
        property: "og:description",
        content:
          "Korean importers sourcing from Vietnam · Nhà nhập khẩu Hàn Quốc từ Việt Nam. Browse by import scale and contact.",
      },
    ],
  }),
});

function VietnamPage() {
  const { t } = useLang();
  return (
    <ImportersDirectory
      title={t(
        "베트남 거래 한국 수입업체 디렉토리",
        "Vietnam Korean Importers Directory",
        "Danh bạ nhà nhập khẩu Hàn Quốc giao dịch với Việt Nam",
      )}
      lockedCountries={["베트남"]}
      lockedLabel="🇻🇳 베트남 · Việt Nam · Vietnam"
    />
  );
}
