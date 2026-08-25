// SQLite's datetime('now') returns "YYYY-MM-DD HH:MM:SS" in UTC, with no timezone
// marker — turn that into something Date() parses reliably, then format it locally.
export function formatDateTime(sqliteDate: string | null | undefined): string {
  if (!sqliteDate) return "—";
  const iso = sqliteDate.includes("T") ? sqliteDate : `${sqliteDate.replace(" ", "T")}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return sqliteDate;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
