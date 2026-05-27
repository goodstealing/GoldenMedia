import { Link, useParams } from "react-router-dom";
import { useContentItem } from "../hooks/useContentItem";
import { useReadingProgress } from "../hooks/useReadingProgress";
import { CATEGORIES, isCategory } from "../domain";
import { listPath, titleDetailPath } from "../utils/contentPaths";

export function BookReaderPage() {
  const params = useParams();
  const categoryParam = params.category ?? "";
  const idParam = Number(params.id);
  const category = isCategory(categoryParam) ? categoryParam : null;

  const { item, loading, error } = useContentItem(
    category ?? "books",
    Number.isFinite(idParam) ? idParam : 0,
  );

  const { page, totalPages, goToPage, setTotalPages } = useReadingProgress(
    category ?? "books",
    Number.isFinite(idParam) ? idParam : 0,
  );

  if (!category || !Number.isFinite(idParam) || idParam <= 0) {
    return (
      <div className="reader-page">
        <div className="info error">Некорректный адрес страницы чтения.</div>
        <Link className="btn btn-secondary" to="/">
          К списку
        </Link>
      </div>
    );
  }

  const categoryLabel =
    CATEGORIES.find((c) => c.id === category)?.label ?? category;

  return (
    <div className="reader-page">
      <div className="reader-toolbar">
        <Link className="btn btn-secondary" to={titleDetailPath(category, idParam)}>
          ← К странице тайтла
        </Link>
        <Link className="btn btn-secondary" to={listPath(category)}>
          К списку ({categoryLabel})
        </Link>
      </div>

      {loading && <div className="info">Загрузка...</div>}
      {error && <div className="info error">Ошибка: {error}</div>}

      {!loading && !error && item && (
        <section className="card reader-card">
          <header className="reader-header">
            <h1 className="reader-title">{item.title}</h1>
            <p className="reader-subtitle">
              Режим чтения (предварительная версия). Место остановки сохраняется
              локально в браузере.
            </p>
          </header>

          <div className="reader-page-view">
            <p className="reader-placeholder-text">
              Здесь будет текст произведения. Страница {page} из {totalPages}.
            </p>
            <p className="reader-placeholder-hint">
              В будущем здесь появится полноценный просмотр файлов книг и манги
              с перелистыванием страниц.
            </p>
          </div>

          <div className="reader-controls">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              ← Предыдущая
            </button>
            <span className="reader-page-indicator">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Следующая →
            </button>
          </div>

          <label className="reader-total-pages">
            <span>Всего страниц (для демо)</span>
            <input
              type="number"
              min={1}
              value={totalPages}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (Number.isFinite(value) && value > 0) {
                  setTotalPages(value);
                }
              }}
            />
          </label>
        </section>
      )}
    </div>
  );
}
