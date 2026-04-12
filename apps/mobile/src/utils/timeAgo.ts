import i18n from "@/src/i18n";

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return i18n.t("time_ago.just_now");
  const min = Math.floor(sec / 60);
  if (min < 60) return i18n.t("time_ago.minutes_ago", { val: min });
  const h = Math.floor(min / 60);
  if (h < 24) return i18n.t("time_ago.hours_ago", { val: h });
  const day = Math.floor(h / 24);
  if (day < 7) return i18n.t("time_ago.days_ago", { val: day });
  
  const currentLang = i18n.language === "tr" ? "tr-TR" : "en-US";
  return d.toLocaleDateString(currentLang, { day: "numeric", month: "short" });
}
