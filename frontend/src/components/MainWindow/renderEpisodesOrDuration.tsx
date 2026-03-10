import type { Category } from "../../domain";
import { formatTime } from "../../utils/time";

export function renderEpisodesOrDuration(
  watched: number | null,
  total: number | null,
  category: Category,
) {
  if (watched == null || total == null || total === 0) {
    return "—";
  }

  if (category === "movies" || category === "anime") {
    return `${formatTime(watched)} из ${formatTime(total)}`;
  }

  return `${watched} из ${total}`;
}

