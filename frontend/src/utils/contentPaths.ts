import type { Category } from "../domain";

export function titleDetailPath(category: Category, id: number): string {
  return `/${category}/${id}`;
}

export function titleReaderPath(category: Category, id: number): string {
  return `/${category}/${id}/read`;
}

export function listPath(category?: Category): string {
  if (!category) return "/";
  return `/?category=${category}`;
}
