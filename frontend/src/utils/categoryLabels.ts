import type { Category, ContentItem } from "../domain";
import { formatYear } from "./time";

/** Фильтр по сезону (Зима/Весна/…) — только для аниме */
export function usesSeasonFilter(category: Category): boolean {
  return category === "anime";
}

/** Поиск по режиссёру / автору (поле studio в БД) */
export function usesPersonStudioFilter(category: Category): boolean {
  return (
    category === "movies" ||
    category === "series" ||
    category === "manga" ||
    category === "books"
  );
}

/** Поле «Год» через release_date (без сезона) */
export function usesYearOnlyField(category: Category): boolean {
  return (
    category === "movies" ||
    category === "series" ||
    category === "manga" ||
    category === "books"
  );
}

/** Поле «Сезон / год» через season */
export function usesSeasonYearField(category: Category): boolean {
  return category === "anime";
}

export function getPersonStudioFilterLabel(category: Category): string {
  switch (category) {
    case "movies":
    case "series":
      return "Поиск по режиссёрам";
    case "manga":
    case "books":
      return "Поиск по авторам";
    default:
      return "";
  }
}

export function getPersonStudioFilterPlaceholder(category: Category): string {
  switch (category) {
    case "movies":
    case "series":
      return "Напр. Кристофер Нолан";
    case "manga":
    case "books":
      return "Напр. Харуки Мураками";
    default:
      return "";
  }
}

export function getYearColumnLabel(category: Category): string {
  switch (category) {
    case "movies":
      return "Год выхода";
    case "anime":
      return "Сезон / Год";
    case "series":
    case "manga":
    case "books":
      return "Год";
    default:
      return "Год";
  }
}

export function getStudioColumnLabel(category: Category): string {
  switch (category) {
    case "movies":
    case "series":
      return "Режиссёр";
    case "manga":
    case "books":
      return "Автор";
    case "anime":
      return "Студия";
    default:
      return "Студия";
  }
}

export function getEpisodesColumnLabel(category: Category): string {
  switch (category) {
    case "movies":
      return "Продолжительность";
    case "manga":
      return "Главы";
    case "books":
      return "Страницы";
    default:
      return "Эпизоды";
  }
}

export function getEpisodesTotalFormLabel(category: Category): string {
  switch (category) {
    case "manga":
      return "Всего глав";
    case "books":
      return "Всего страниц";
    default:
      return "Всего эпизодов";
  }
}

export function getEpisodesWatchedFormLabel(category: Category): string {
  switch (category) {
    case "manga":
      return "Прочитано глав";
    case "books":
      return "Прочитано страниц";
    default:
      return "Просмотрено эпизодов";
  }
}

export function getYearFormLabel(category: Category): string {
  if (category === "movies") return "Год выхода";
  if (usesYearOnlyField(category)) return "Год";
  return "Сезон / год";
}

export function getYearFormPlaceholder(category: Category): string {
  if (category === "movies") return "ДД.ММ.ГГГГ";
  if (usesYearOnlyField(category)) return "Напр. 2014";
  return "Лето 2014";
}

/** Значение для отображения в таблице / на странице тайтла */
export function displayYearOrSeason(
  item: ContentItem,
  category: Category,
): string {
  if (usesSeasonYearField(category)) {
    return item.season ?? "—";
  }

  const year = formatYear(item.release_date);
  if (year) return year;

  if (item.season) {
    const legacy = item.season.match(/\b(19|20)\d{2}\b/);
    if (legacy) return legacy[0];
  }

  return "—";
}

/** Значение для поля года в форме редактирования */
export function getYearFormValue(
  item: ContentItem,
  category: Category,
): string {
  if (usesSeasonYearField(category)) {
    return item.season ?? "";
  }

  if (item.release_date) {
    return formatYear(item.release_date) ?? "";
  }

  if (item.season) {
    const legacy = item.season.match(/\b(19|20)\d{2}\b/);
    if (legacy) return legacy[0];
  }

  return "";
}
