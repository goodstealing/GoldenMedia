import type { Category, ContentItem, Status } from "../../domain";
import { getStatusClassName } from "../../domain";
import { buildCoverUrl } from "../../utils/api";
import ProgressBar from "../UI/ProgressBar";
import { renderEpisodesOrDuration } from "./renderEpisodesOrDuration";

type SortBy = "title" | "rating" | "episodes" | "season" | "studio" | "progress" | "";

type ContentTableProps = {
  category: Category;
  items: ContentItem[];
  loading: boolean;
  error: string | null;
  sortBy: SortBy;
  sortDir: "asc" | "desc";
  onSortChange: (column: SortBy) => void;
  showOriginalTitle: boolean;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
};

export function ContentTable({
  category,
  items,
  loading,
  error,
  sortBy,
  sortDir,
  onSortChange,
  showOriginalTitle,
  onEdit,
  onDelete,
}: ContentTableProps) {
  return (
    <div className="table-wrapper">
      {loading && <div className="info">Загрузка...</div>}
      {error && <div className="info error">Ошибка: {error}</div>}

      {!loading && !error && (
        <table className="content-table">
          <thead>
            <tr>
              <th>Обложка</th>
              <th onClick={() => onSortChange("title")}>
                Название{" "}
                {sortBy === "title" && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
              </th>
              <th>Статус</th>
              <th className="th-numeric" onClick={() => onSortChange("rating")}>
                Оценка{" "}
                {sortBy === "rating" && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
              </th>
              <th onClick={() => onSortChange("episodes")}>
                Эпизоды{" "}
                {sortBy === "episodes" && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
              </th>
              <th onClick={() => onSortChange("season")}>
                Сезон / Год{" "}
                {sortBy === "season" && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
              </th>
              <th>Жанры</th>
              <th onClick={() => onSortChange("studio")}>
                Студия{" "}
                {sortBy === "studio" && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
              </th>
              <th onClick={() => onSortChange("progress")}>
                Прогресс{" "}
                {sortBy === "progress" && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="empty">
                  Пока нет записей в этой категории.
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="cover-thumb">
                    {item.cover_path ? (
                      <img
                        src={buildCoverUrl(item.cover_path)}
                        alt={item.title}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.broken) {
                            target.dataset.broken = "true";
                            target.src = "/covers/placeholder-cover.jpg";
                          }
                        }}
                      />
                    ) : (
                      <span className="cover-thumb-text">Нет обложки</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="title-cell-main">
                    {showOriginalTitle && item.original_title
                      ? item.original_title
                      : item.title}
                  </div>
                  {item.original_title && (
                    <div className="title-cell-alt">
                      {showOriginalTitle ? item.title : item.original_title}
                    </div>
                  )}
                </td>
                <td>
                  <span
                    className={`status-badge ${getStatusClassName(
                      (item.status as Status) ?? "Запланировано",
                    )}`}
                  >
                    {item.status ?? "Запланировано"}
                  </span>
                </td>
                <td className="td-numeric">
                  {item.rating != null ? item.rating : "n/a"}
                </td>
                <td>
                  {category === "anime" ? (
                    <>
                      <div>
                        {item.episodes_watched != null &&
                        item.episodes_total != null &&
                        item.episodes_total !== 0
                          ? `${item.episodes_watched} из ${item.episodes_total}`
                          : "—"}
                      </div>
                      {item.duration_text && (
                        <div className="duration-text">{item.duration_text}</div>
                      )}
                    </>
                  ) : (
                    renderEpisodesOrDuration(
                      item.episodes_watched,
                      item.episodes_total,
                      category,
                    )
                  )}
                </td>
                <td>{item.season ?? item.release_date ?? "—"}</td>
                <td>{item.genres ?? "—"}</td>
                <td>{item.studio ?? "—"}</td>
                <td>
                  <ProgressBar
                    watched={item.episodes_watched}
                    total={item.episodes_total}
                  />
                  <div className="row-actions">
                    <button
                      type="button"
                      className="row-btn"
                      onClick={() => onEdit(item)}
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      className="row-btn row-btn-danger"
                      onClick={() => onDelete(item)}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

