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

