import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "ko" | "en" | "zh";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** 2-arg translate: ko / en. For zh, falls back to en. */
  t: (ko: string, en: string) => string;
  /** 3-arg translate: ko / en / zh. Use on the China page. */
  tt: (ko: string, en: string, zh: string) => string;
};

const LangCtx = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  // Always default to English on load; user can toggle per session.
  const [lang, setLangState] = useState<Lang>("en");

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("koima.lang", l);
    } catch {}
  };

  const t = (ko: string, en: string) => (lang === "ko" ? ko : en);
  const tt = (ko: string, en: string, zh: string) =>
    lang === "ko" ? ko : lang === "zh" ? zh : en;

  return <LangCtx.Provider value={{ lang, setLang, t, tt }}>{children}</LangCtx.Provider>;
}

export function useLang(): Ctx {
  const v = useContext(LangCtx);
  if (!v) {
    return {
      lang: "ko",
      setLang: () => {},
      t: (ko: string) => ko,
      tt: (ko: string) => ko,
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
      <span className={lang !== "ko" ? "text-primary" : "text-muted-foreground"}>EN</span>
    </button>
  );
}

/** 3-way language toggle: KO · EN · 中文. Use on the China page. */
export function LangToggle3({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  const Btn = ({ code, label }: { code: Lang; label: string }) => (
    <button
      onClick={() => setLang(code)}
      className={`rounded px-1.5 py-0.5 transition ${
        lang === code ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div
      aria-label="Language"
      className={
        className ||
        "inline-flex items-center gap-0.5 rounded-md border bg-card px-1 py-1 text-[11px] font-bold shadow-sm"
      }
    >
      <Btn code="ko" label="KO" />
      <span className="text-muted-foreground/40">·</span>
      <Btn code="en" label="EN" />
      <span className="text-muted-foreground/40">·</span>
      <Btn code="zh" label="中文" />
    </div>
  );
}
