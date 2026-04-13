/**
 * Utilidades de fecha/hora con zona horaria configurable.
 * La zona horaria se lee de AppSettings (campo timezone), con fallback a America/Mexico_City.
 */

let _cachedTZ = "America/Mexico_City";

export function setSystemTimezone(tz: string | undefined) {
  if (tz) _cachedTZ = tz;
}

function getTZ() {
  return _cachedTZ;
}

function addHours(d: Date, h: number) {
  return new Date(d.getTime() + h * 3600 * 1000);
}

export function formatCDMX(date: string | Date | null | undefined, format: string = "datetime", tz?: string) {
  if (!date) return "";
  const d = new Date(date as any);
  if (isNaN(d.getTime())) return "";

  const opts: any = { timeZone: tz || getTZ() };

  switch (format) {
    case "date":
      return d.toLocaleDateString("es-MX", { ...opts, day: "2-digit", month: "2-digit", year: "numeric" });
    case "time":
      return d.toLocaleTimeString("es-MX", { ...opts, hour: "2-digit", minute: "2-digit" });
    case "datetime":
      return d.toLocaleString("es-MX", { ...opts, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    case "short":
      return d.toLocaleDateString("es-MX", { ...opts, day: "2-digit", month: "2-digit", year: "2-digit" });
    case "shortdatetime":
      return d.toLocaleString("es-MX", { ...opts, day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
    case "daymonth":
      return d.toLocaleDateString("es-MX", { ...opts, day: "2-digit", month: "2-digit" });
    case "relative": {
      const now = Date.now();
      const diff = now - d.getTime();
      if (diff < 60000) return "Ahora";
      if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
      if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
      if (diff < 604800000) return `Hace ${Math.floor(diff / 86400000)} días`;
      return formatCDMX(date, "date");
    }
    default:
      return d.toLocaleString("es-MX", { ...opts, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
}

export function nowCDMX() {
  return new Date().toISOString();
}

export function formatStoredLocal(date: string | Date | null | undefined, format: string = "datetime") {
  if (!date) return "";
  const d = new Date(date as any);
  if (isNaN(d.getTime())) return "";
  const corrected = addHours(d, 6);
  return formatCDMX(corrected, format);
}

export function todayCDMX() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: getTZ(), year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now);
  const y = parts.find(p => p.type === "year")?.value || "0000";
  const m = parts.find(p => p.type === "month")?.value || "01";
  const dy = parts.find(p => p.type === "day")?.value || "01";
  return `${y}-${m}-${dy}`;
}

export function startOfDayCDMX(dateStr: string) {
  const tz = getTZ();
  return _localMidnightToUTC(dateStr, "00:00:00", tz);
}

export function endOfDayCDMX(dateStr: string) {
  const tz = getTZ();
  return _localMidnightToUTC(dateStr, "23:59:59", tz);
}

function _localMidnightToUTC(dateStr: string, timeStr: string, tz: string) {
  const utcNaive = new Date(`${dateStr}T${timeStr}Z`);
  const tzOffsetMs = _getTZOffsetMs(tz, utcNaive);
  return new Date(utcNaive.getTime() - tzOffsetMs);
}

function _getTZOffsetMs(tz: string, refDate: Date) {
  try {
    const utcStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).format(refDate);
    const tzStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).format(refDate);
    const parse = (s: string) => {
      const clean = s.replace(",", "");
      return new Date(clean.replace(" ", "T") + "Z").getTime();
    };
    return parse(tzStr) - parse(utcStr);
  } catch {
    return -6 * 3600 * 1000;
  }
}

function getTimezoneOffsetStr(tz: string, refDate: Date) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, timeZoneName: "shortOffset"
    }).formatToParts(refDate);
    const tzPart = parts.find(p => p.type === "timeZoneName")?.value || "GMT-6";
    const match = tzPart.match(/GMT([+-]\d+)(?::(\d+))?/);
    if (!match) return "-06:00";
    const h = parseInt(match[1]);
    const m = parseInt(match[2] || "0");
    const sign = h >= 0 ? "+" : "-";
    return `${sign}${String(Math.abs(h)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  } catch {
    return "-06:00";
  }
}

export function isInDayCDMX(date: string | Date, dateStr: string) {
  const d = new Date(date as any);
  return d >= startOfDayCDMX(dateStr) && d <= endOfDayCDMX(dateStr);
}
