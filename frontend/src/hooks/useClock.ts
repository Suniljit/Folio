import { useEffect, useState } from "react";

export function useClockTick(): Date {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return now;
}

export function zoneTime(now: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);
}

export function zoneDate(now: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(now);
}

export function nyseOpen(now: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now);
  const map: Record<string, string> = {};
  parts.forEach((p) => (map[p.type] = p.value));
  const isWeekday = !["Sat", "Sun"].includes(map.weekday);
  const minutes = parseInt(map.hour, 10) * 60 + parseInt(map.minute, 10);
  return isWeekday && minutes >= 9 * 60 + 30 && minutes < 16 * 60;
}
