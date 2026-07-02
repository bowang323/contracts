import { translations, interpolate, type Locale } from "./i18n";

/** Compact modified time for document lists (uses last edit, not last save). */
export function formatModifiedAt(
  modifiedAt: number,
  locale: Locale = "en",
  now = Date.now(),
): string {
  const t = translations[locale];
  const diffMs = Math.max(0, now - modifiedAt);
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return t.modifiedJustNow;
  if (diffMin < 60) {
    return diffMin === 1 ? t.modifiedOneMin : interpolate(t.modifiedMins, { n: diffMin });
  }
  if (diffHour < 24) {
    return diffHour === 1
      ? t.modifiedOneHour
      : interpolate(t.modifiedHours, { n: diffHour });
  }
  if (diffDay < 7) {
    return diffDay === 1 ? t.modifiedOneDay : interpolate(t.modifiedDays, { n: diffDay });
  }

  const date = new Date(modifiedAt);
  if (locale === "zh") {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  }
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}
