import type { Category } from "../../domain";
import { CATEGORIES } from "../../domain";

type CategoryTabsProps = {
  value: Category;
  onChange: (category: Category) => void;
};

export function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  return (
    <div className="tabs">
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          className={`tab category-tab category-${c.id} ${
            value === c.id ? "tab-active" : ""
          }`}
          onClick={() => onChange(c.id)}
        >
          <span className="category-tab-content">
            <span className="category-tab-title">{c.label}</span>
            <span className="category-tab-subtitle">
              {c.id === "anime" && "Онгоинги и завершённые тайтлы"}
              {c.id === "movies" && "Полнометражные фильмы"}
              {c.id === "series" && "Сериалы и шоу"}
              {c.id === "manga" && "Манга и комиксы"}
              {c.id === "books" && "Книги и ранобэ"}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

