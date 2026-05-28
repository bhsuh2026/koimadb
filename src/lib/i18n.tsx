import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ko" | "en";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (ko: string, en: string) => string;
};

const LangCtx = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("koima.lang");
      if (saved === "en" || saved === "ko") setLangState(saved);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("koima.lang", l);
    } catch {}
  };

  const t = (ko: string, en: string) => (lang === "en" ? en : ko);

  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export function useLang(): Ctx {
  const v = useContext(LangCtx);
  if (!v) {
    // graceful fallback when used outside provider
    return {
      lang: "ko",
      setLang: () => {},
      t: (ko: string) => ko,
    };
  }
  return v;
}

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === "ko" ? "en" : "ko")}
      title={lang === "ko" ? "Switch to English" : "한국어로 보기"}
      aria-label="Toggle language"
      className={
        className ||
        "inline-flex items-center gap-1 rounded-md border bg-card px-2 py-1.5 text-[11px] font-bold shadow-sm hover:bg-accent"
      }
    >
      <span className={lang === "ko" ? "text-primary" : "text-muted-foreground"}>KO</span>
      <span className="text-muted-foreground/40">·</span>
      <span className={lang === "en" ? "text-primary" : "text-muted-foreground"}>EN</span>
    </button>
  );
}
