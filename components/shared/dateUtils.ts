// Date utilities for timezone management
export function setSystemTimezone(timezone: string) {
  // In browser environment, we can't actually change the system timezone
  // but we can store it for date formatting purposes
  if (typeof window !== 'undefined') {
    localStorage.setItem('system-timezone', timezone);
  }
}

export function getSystemTimezone(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('system-timezone') || 'America/Mexico_City';
  }
  return 'America/Mexico_City';
}

// Format date with system timezone
export function formatDateWithTimezone(date: Date | string, timezone?: string): string {
  const tz = timezone || getSystemTimezone();
  const d = new Date(date);

  return new Intl.DateTimeFormat('es-MX', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(d);
}