export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = [
    h.toString(),
    m.toString().padStart(2, "0"),
    s.toString().padStart(2, "0"),
  ];
  return parts.join(":");
}

export function parseDurationToSeconds(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":").map((p) => p.trim());
  if (parts.some((p) => p === "" || Number.isNaN(Number(p)))) {
    return null;
  }
  let seconds = 0;
  if (parts.length === 3) {
    const [h, m, s] = parts.map((p) => Number(p));
    seconds = h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    const [m, s] = parts.map((p) => Number(p));
    seconds = m * 60 + s;
  } else if (parts.length === 1) {
    seconds = Number(parts[0]);
  } else {
    return null;
  }
  return seconds >= 0 ? seconds : null;
}

export function formatYear(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const isoMatch = trimmed.match(/^(\d{4})/);
  if (isoMatch) return isoMatch[1];
  const short = formatDateShort(trimmed);
  if (short) {
    const parts = short.split(".");
    return parts[2] ?? null;
  }
  const embedded = trimmed.match(/\b(19|20)\d{2}\b/);
  return embedded ? embedded[0] : null;
}

export function parseYearToIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed}-01-01`;
  }
  return parseDateShortToIso(trimmed);
}

export function formatDateShort(value: string | null | undefined): string | null {
  if (!value) return null;
  const iso = value.trim();
  if (!iso) return null;
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return null;
  return `${day.padStart(2, "0")}.${month.padStart(2, "0")}.${year}`;
}

export function parseDateShortToIso(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return null;
  const [, ddRaw, mmRaw, yyyy] = match;
  const dd = ddRaw.padStart(2, "0");
  const mm = mmRaw.padStart(2, "0");
  const iso = `${yyyy}-${mm}-${dd}`;

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return iso;
}

export function formatViewPeriod(
  start: string | null | undefined,
  end: string | null | undefined
): { rangeLine: string | null; durationLine: string | null } {
  const startStr = start && start.trim() ? start.trim() : null;
  const endStr = end && end.trim() ? end.trim() : null;
  if (!startStr) {
    return { rangeLine: null, durationLine: null };
  }

  const startDate = new Date(startStr);
  const endDate = endStr ? new Date(endStr) : null;
  if (Number.isNaN(startDate.getTime())) {
    return { rangeLine: null, durationLine: null };
  }

  const rangeLine = `${formatDateShort(startStr)} — ${
    endStr ? formatDateShort(endStr) : "…"
  }`;

  if (!endDate || Number.isNaN(endDate.getTime()) || endDate < startDate) {
    return { rangeLine, durationLine: null };
  }

  let startY = startDate.getFullYear();
  let startM = startDate.getMonth();
  let startD = startDate.getDate();
  let endY = endDate.getFullYear();
  let endM = endDate.getMonth();
  let endD = endDate.getDate();

  let years = endY - startY;
  let months = endM - startM;
  let days = endD - startD;

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(endY, endM, 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months;

  const parts: string[] = [];

  if (totalMonths > 0) {
    parts.push(
      totalMonths === 1 ? "1 месяц" : `${totalMonths} месяцев`
    );
  }
  if (days > 0 || parts.length === 0) {
    parts.push(days === 1 ? "1 день" : `${days} дней`);
  }

  const durationLine = parts.join(" ");

  return { rangeLine, durationLine };
}

function pluralizeRu(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = abs % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function formatDurationDaysMonths(
  start: string | null | undefined,
  end: string | null | undefined
): string | null {
  const { durationLine } = formatViewPeriod(start, end);
  if (!durationLine) return null;
  return durationLine;
}

export function formatViewPeriodInline(
  start: string | null | undefined,
  end: string | null | undefined
): string | null {
  const startStr = start && start.trim() ? start.trim() : null;
  const endStr = end && end.trim() ? end.trim() : null;
  if (!startStr || !endStr) return null;

  const startDate = new Date(startStr);
  const endDate = new Date(endStr);
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate < startDate
  ) {
    return null;
  }

  let years = endDate.getFullYear() - startDate.getFullYear();
  let months = endDate.getMonth() - startDate.getMonth();
  let days = endDate.getDate() - startDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months;

  const parts: string[] = [];
  if (totalMonths > 0) {
    parts.push(
      `${totalMonths} ${pluralizeRu(totalMonths, "месяц", "месяца", "месяцев")}`
    );
  }
  parts.push(`${days} ${pluralizeRu(days, "день", "дня", "дней")}`);

  const startShort = formatDateShort(startStr);
  const endShort = formatDateShort(endStr);
  if (!startShort || !endShort) return null;

  return `Период просмотра: ${startShort}-${endShort} (${parts.join(" ")})`;
}

export function formatHoursMinutes(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  if (h <= 0) {
    return `${m} мин.`;
  }
  return `${h} ч. ${m.toString().padStart(2, "0")} мин.`;
}

