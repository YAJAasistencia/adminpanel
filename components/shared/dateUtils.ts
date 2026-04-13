type DateFormatKind = "datetime" | "date" | "time" | "short" | "shortdatetime" | "daymonth" | "relative";

let cachedTimezone = "America/Mexico_City";

export function setSystemTimezone(timezone: string) {
  if (timezone) {
    cachedTimezone = timezone;
  }

  if (typeof window !== "undefined" && timezone) {
    localStorage.setItem("system-timezone", timezone);
  }
}

export function getSystemTimezone(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("system-timezone") || cachedTimezone;
  }

  return cachedTimezone;
}

function getTZ() {
  return getSystemTimezone();
}

export function formatDateWithTimezone(date: Date | string, timezone?: string): string {
  if (!date) return "";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleString("es-MX", {
    timeZone: timezone || getTZ(),
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatCDMX(date: Date | string, format: DateFormatKind = "datetime", tz?: string): string {
  if (!date) return "";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";

  const options = { timeZone: tz || getTZ() };

  switch (format) {
    case "date":
      return parsedDate.toLocaleDateString("es-MX", { ...options, day: "2-digit", month: "2-digit", year: "numeric" });
    case "time":
      return parsedDate.toLocaleTimeString("es-MX", { ...options, hour: "2-digit", minute: "2-digit" });
    case "datetime":
      return parsedDate.toLocaleString("es-MX", { ...options, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    case "short":
      return parsedDate.toLocaleDateString("es-MX", { ...options, day: "2-digit", month: "2-digit", year: "2-digit" });
    case "shortdatetime":
      return parsedDate.toLocaleString("es-MX", { ...options, day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
    case "daymonth":
      return parsedDate.toLocaleDateString("es-MX", { ...options, day: "2-digit", month: "2-digit" });
    case "relative": {
      const now = Date.now();
      const diff = now - parsedDate.getTime();

      if (diff < 60000) return "Ahora";
      if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
      if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
      if (diff < 604800000) return `Hace ${Math.floor(diff / 86400000)} días`;
      return formatCDMX(date, "date", tz);
    }
    default:
      return parsedDate.toLocaleString("es-MX", { ...options, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
}

export function nowCDMX() {
  return new Date().toISOString();
}

export function formatStoredLocal(date: Date | string, format: DateFormatKind = "datetime") {
  if (!date) return "";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";

  const correctedDate = new Date(parsedDate.getTime() + 6 * 3600 * 1000);
  return formatCDMX(correctedDate, format);
}

export function todayCDMX() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: getTZ(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value || "0000";
  const month = parts.find((part) => part.type === "month")?.value || "00";
  const day = parts.find((part) => part.type === "day")?.value || "00";

  return `${year}-${month}-${day}`;
}

export function startOfDayCDMX(dateStr: string) {
  return localDateTimeToUTC(dateStr, "00:00:00", getTZ());
}

export function endOfDayCDMX(dateStr: string) {
  return localDateTimeToUTC(dateStr, "23:59:59", getTZ());
}

function localDateTimeToUTC(dateStr: string, timeStr: string, timezone: string) {
  const utcNaive = new Date(`${dateStr}T${timeStr}Z`);
  const timezoneOffsetMs = getTimezoneOffsetMs(timezone, utcNaive);
  return new Date(utcNaive.getTime() - timezoneOffsetMs);
}

function getTimezoneOffsetMs(timezone: string, referenceDate: Date) {
  try {
    const utcString = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(referenceDate);

    const timezoneString = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(referenceDate);

    const parseFormattedString = (value: string) => {
      const cleaned = value.replace(",", "");
      return new Date(cleaned.replace(" ", "T") + "Z").getTime();
    };

    return parseFormattedString(timezoneString) - parseFormattedString(utcString);
  } catch {
    return -6 * 3600 * 1000;
  }
}

export function isInDayCDMX(date: Date | string, dateStr: string) {
  const parsedDate = new Date(date);
  return parsedDate >= startOfDayCDMX(dateStr) && parsedDate <= endOfDayCDMX(dateStr);
}