import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import { useLanguage } from "@/providers/LanguageProvider";

const options: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
];

export function IntroLanguageBar() {
  const { locale, hasChosenLocale, setLocale, t } = useLanguage();

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-3 sm:items-end",
        !hasChosenLocale && "sm:items-center",
      )}
    >
      {!hasChosenLocale ? (
        <div className="text-center sm:text-right">
          <p className="text-sm font-medium text-foreground">
            {t("chooseLanguage")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("chooseLanguageHint")}
          </p>
        </div>
      ) : null}

      <div
        role="radiogroup"
        aria-label={t("language")}
        className={cn(
          "inline-flex rounded-xl border border-white/25 bg-white/10 p-1 shadow-sm backdrop-blur-md [-webkit-backdrop-filter:blur(12px)]",
          !hasChosenLocale &&
            "ring-2 ring-primary/40 ring-offset-2 ring-offset-orange-950/80",
        )}
      >
        {options.map((option) => {
          const selected = locale === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setLocale(option.value)}
              className={cn(
                "min-w-[5.5rem] rounded-lg px-4 py-2 text-sm font-medium transition-all [-webkit-appearance:none] [appearance:none]",
                selected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
