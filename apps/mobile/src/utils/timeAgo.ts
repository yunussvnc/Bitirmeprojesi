export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s önce`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}dk önce`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}sa önce`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}g önce`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}
