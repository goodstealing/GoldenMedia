import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Category = "anime" | "movies" | "series" | "manga" | "books";

type Status =
  | "Запланировано"
  | "Смотрю"
  | "Просмотрено"
  | "Отложено"
  | "Брошено"
  | "Любимое";

type ContentItem = {
  id: number;
  title: string;
  original_title: string | null;
  cover_path: string | null;
  status: Status | null;
  rating: number | null;
  episodes_total: number | null;
  episodes_watched: number | null;
  season: string | null;
  genres: string | null;
  studio: string | null;
  release_date: string | null;
  duration_text: string | null;
};

const API_BASE = "http://localhost:4000";

function buildCoverUrl(path: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/")) {
    return `${API_BASE}${path}`;
  }
  return `${API_BASE}/${path}`;
}

const STATUSES: Status[] = [
  "Запланировано",
  "Смотрю",
  "Просмотрено",
  "Отложено",
  "Брошено",
  "Любимое"
];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "series", label: "Сериалы" },
  { id: "movies", label: "Фильмы" },
  { id: "anime", label: "Аниме" },
  { id: "manga", label: "Манга" },
  { id: "books", label: "Книги" }
];

type SortBy = "title" | "rating" | "episodes" | "season" | "studio" | "progress" | "";

function getStatusClassName(status: Status): string {
  switch (status) {
    case "Запланировано":
      return "status-planned";
    case "Смотрю":
      return "status-watching";
    case "Просмотрено":
      return "status-completed";
    case "Отложено":
      return "status-on-hold";
    case "Брошено":
      return "status-dropped";
    case "Любимое":
      return "status-favorite";
    default:
      return "";
  }
}

function App() {
  const [category, setCategory] = useState<Category>("anime");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
  const [titleQuery, setTitleQuery] = useState("");
  const [genresQuery, setGenresQuery] = useState("");
  const [seasonFilter, setSeasonFilter] = useState<
    "Все" | "Зима" | "Весна" | "Лето" | "Осень"
  >("Все");
  const [yearFilter, setYearFilter] = useState("");

  const [sortBy, setSortBy] = useState<SortBy>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formOriginalTitle, setFormOriginalTitle] = useState("");
  const [formStatus, setFormStatus] = useState<Status | "">("");
  const [formRating, setFormRating] = useState<string>("");
  const [formEpisodesTotal, setFormEpisodesTotal] = useState<string>("");
  const [formEpisodesWatched, setFormEpisodesWatched] = useState<string>("");
  const [formSeason, setFormSeason] = useState("");
  const [formGenres, setFormGenres] = useState("");
  const [formStudio, setFormStudio] = useState("");
  const [formReleaseDate, setFormReleaseDate] = useState("");
  const [formCoverPath, setFormCoverPath] = useState("");

  const [changeToken, setChangeToken] = useState(0);
  const [showOriginalTitle, setShowOriginalTitle] = useState(false);
  const [formCoverFile, setFormCoverFile] = useState<File | null>(null);
  const [formDurationTotal, setFormDurationTotal] = useState("");
  const [formDurationWatched, setFormDurationWatched] = useState("");
  const [formAnimeDurationText, setFormAnimeDurationText] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (selectedStatuses.length > 0) {
          params.set("status", selectedStatuses.join(","));
        }
        if (titleQuery.trim()) {
          params.set("title", titleQuery.trim());
        }
        if (genresQuery.trim()) {
          params.set("genres", genresQuery.trim());
        }
        if (seasonFilter !== "Все") {
          params.set("season", seasonFilter);
        }
        if (yearFilter.trim()) {
          params.set("year", yearFilter.trim());
        }
        if (sortBy) {
          params.set("sortBy", sortBy);
          params.set("sortDir", sortDir);
        }

        const url = `${API_BASE}/api/content/${category}?${params.toString()}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Ошибка загрузки: ${res.status}`);
        }
        const data: ContentItem[] = await res.json();
        setItems(data);
      } catch (e: unknown) {
        if ((e as any).name === "AbortError") return;
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [
    category,
    selectedStatuses,
    titleQuery,
    genresQuery,
    seasonFilter,
    yearFilter,
    sortBy,
    sortDir,
    changeToken
  ]);

  const toggleStatus = (status: Status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? [] : [status]
    );
  };

  const handleSortClick = (column: SortBy) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  const visibleItems = useMemo(() => items, [items]);

  const openCreateForm = () => {
    setFormMode("create");
    setEditingItem(null);
    setFormTitle("");
    setFormOriginalTitle("");
    setFormStatus("");
    setFormRating("");
    setFormEpisodesTotal("");
    setFormEpisodesWatched("");
    setFormSeason("");
    setFormGenres("");
    setFormStudio("");
    setFormReleaseDate("");
    setFormCoverPath("");
    setFormCoverFile(null);
    setFormDurationTotal("");
    setFormDurationWatched("");
    setFormAnimeDurationText("");
    setFormOpen(true);
  };

  const openEditForm = (item: ContentItem) => {
    setFormMode("edit");
    setEditingItem(item);
    setFormTitle(item.title);
    setFormOriginalTitle(item.original_title ?? "");
    setFormStatus(item.status ?? "");
    setFormRating(item.rating != null ? String(item.rating) : "");
    setFormEpisodesTotal(
      item.episodes_total != null ? String(item.episodes_total) : ""
    );
    setFormEpisodesWatched(
      item.episodes_watched != null ? String(item.episodes_watched) : ""
    );
    setFormSeason(item.season ?? "");
    setFormGenres(item.genres ?? "");
    setFormStudio(item.studio ?? "");
    setFormReleaseDate(item.release_date ?? "");
    setFormCoverPath(item.cover_path ?? "");
    setFormCoverFile(null);
    if (category === "movies") {
      setFormDurationTotal(
        item.episodes_total != null ? formatTime(item.episodes_total) : ""
      );
      setFormDurationWatched(
        item.episodes_watched != null
          ? formatTime(item.episodes_watched)
          : ""
      );
    } else {
      setFormDurationTotal("");
      setFormDurationWatched("");
    }
    if (category === "anime") {
      setFormAnimeDurationText(item.duration_text ?? "");
    } else {
      setFormAnimeDurationText("");
    }
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
  };

  const handleDelete = async (item: ContentItem) => {
    if (!window.confirm(`Удалить "${item.title}"?`)) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/content/${category}/${item.id}`,
        { method: "DELETE" }
      );
      if (!res.ok && res.status !== 204) {
        throw new Error("Не удалось удалить запись");
      }
      setChangeToken((t) => t + 1);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Название обязательно");
      return;
    }

    const parseDurationToSeconds = (value: string): number | null => {
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
    };

    const isTimeCategory = category === "movies";

    const episodesTotalValue =
      isTimeCategory
        ? parseDurationToSeconds(formDurationTotal) ?? null
        : formEpisodesTotal
        ? Number(formEpisodesTotal)
        : null;

    const episodesWatchedValue =
      isTimeCategory
        ? parseDurationToSeconds(formDurationWatched) ?? null
        : formEpisodesWatched
        ? Number(formEpisodesWatched)
        : null;

    const finalAnimeDurationText =
      category === "anime"
        ? (formAnimeDurationText.trim() || "23 мин.")
        : null;

    const payload = {
      title: formTitle.trim(),
      original_title: formOriginalTitle.trim() || null,
      status: formStatus || null,
      rating: formRating ? Number(formRating) : null,
      episodes_total: episodesTotalValue,
      episodes_watched: episodesWatchedValue,
      season: formSeason || null,
      genres: formGenres || null,
      studio: formStudio || null,
      release_date: formReleaseDate || null,
      duration_text: finalAnimeDurationText
    };

    try {
      const urlBase = `${API_BASE}/api/content/${category}`;
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      if (formCoverFile) {
        formData.append("cover", formCoverFile);
      }
      const res =
        formMode === "create"
          ? await fetch(urlBase, {
              method: "POST",
              body: formData
            })
          : await fetch(`${urlBase}/${editingItem?.id}`, {
              method: "PUT",
              body: formData
            });

      if (!res.ok) {
        throw new Error("Не удалось сохранить запись");
      }

      setFormOpen(false);
      setChangeToken((t) => t + 1);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-title-block">
          <h1 className="app-title">Golden Media</h1>
          <p className="app-subtitle">
            Учёт сериалов, фильмов, аниме, манги и книг
          </p>
        </div>
      </header>

      <main className="app-main">
        <section className="card">
          <div className="tabs">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={`tab category-tab category-${c.id} ${
                  category === c.id ? "tab-active" : ""
                }`}
                onClick={() => setCategory(c.id)}
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

          <div className="toolbar">
            <button className="primary-btn" onClick={openCreateForm}>
              Добавить запись
            </button>
            <button
              className="secondary-btn title-toggle"
              type="button"
              onClick={() => setShowOriginalTitle((v) => !v)}
            >
              {showOriginalTitle ? "Показывать русские названия" : "Показывать оригинальные названия"}
            </button>
          </div>

          <div className="filters">
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Статусы</label>
                <div className="statuses">
                  <button
                    type="button"
                    className={`chip chip-all ${
                      selectedStatuses.length === 0 ? "chip-active" : ""
                    }`}
                    onClick={() => setSelectedStatuses([])}
                  >
                    Все
                  </button>
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`chip ${
                        selectedStatuses.includes(s)
                          ? `chip-active ${getStatusClassName(s)}`
                          : ""
                      }`}
                      onClick={() => toggleStatus(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Поиск по названию</label>
                <input
                  type="text"
                  placeholder="Введите название..."
                  value={titleQuery}
                  onChange={(e) => setTitleQuery(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Поиск по жанрам</label>
                <input
                  type="text"
                  placeholder="Комедия, драма..."
                  value={genresQuery}
                  onChange={(e) => setGenresQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Сезон</label>
                <select
                  value={seasonFilter}
                  onChange={(e) =>
                    setSeasonFilter(
                      e.target.value as
                        | "Все"
                        | "Зима"
                        | "Весна"
                        | "Лето"
                        | "Осень"
                    )
                  }
                >
                  <option value="Все">Все</option>
                  <option value="Зима">Зима</option>
                  <option value="Весна">Весна</option>
                  <option value="Лето">Лето</option>
                  <option value="Осень">Осень</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Год выхода</label>
                <input
                  type="number"
                  placeholder="Напр. 2014"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            {loading && <div className="info">Загрузка...</div>}
            {error && <div className="info error">Ошибка: {error}</div>}

            {!loading && !error && (
              <table className="content-table">
                <thead>
                  <tr>
                    <th>Обложка</th>
                    <th onClick={() => handleSortClick("title")}>
                      Название{" "}
                      {sortBy === "title" && (
                        <span>{sortDir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </th>
                    <th>Статус</th>
                    <th
                      className="th-numeric"
                      onClick={() => handleSortClick("rating")}
                    >
                      Оценка{" "}
                      {sortBy === "rating" && (
                        <span>{sortDir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </th>
                    <th onClick={() => handleSortClick("episodes")}>
                      Эпизоды{" "}
                      {sortBy === "episodes" && (
                        <span>{sortDir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </th>
                    <th onClick={() => handleSortClick("season")}>
                      Сезон / Год{" "}
                      {sortBy === "season" && (
                        <span>{sortDir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </th>
                    <th>Жанры</th>
                    <th onClick={() => handleSortClick("studio")}>
                      Студия{" "}
                      {sortBy === "studio" && (
                        <span>{sortDir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </th>
                    <th onClick={() => handleSortClick("progress")}>
                      Прогресс{" "}
                      {sortBy === "progress" && (
                        <span>{sortDir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="empty">
                        Пока нет записей в этой категории.
                      </td>
                    </tr>
                  )}
                  {visibleItems.map((item) => (
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
                            <span className="cover-thumb-text">
                              Нет обложки
                            </span>
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
                            (item.status as Status) ?? "Запланировано"
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
                              <div className="duration-text">
                                {item.duration_text}
                              </div>
                            )}
                          </>
                        ) : (
                          renderEpisodesOrDuration(
                            item.episodes_watched,
                            item.episodes_total,
                            category
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
                            onClick={() => openEditForm(item)}
                          >
                            Редактировать
                          </button>
                          <button
                            type="button"
                            className="row-btn row-btn-danger"
                            onClick={() => handleDelete(item)}
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
        </section>
      </main>

      {formOpen && (
        <div className="dialog-backdrop" onClick={closeForm}>
          <div
            className="dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="dialog-title">
              {formMode === "create"
                ? "Добавить запись"
                : "Редактировать запись"}
            </h2>
            <form className="dialog-form" onSubmit={handleFormSubmit}>
              <div className="dialog-grid">
                <label>
                  <span>Название *</span>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </label>

                <label>
                  <span>
                    Оригинальное название{" "}
                    {category === "anime"
                      ? "(японское)"
                      : category === "movies" || category === "series"
                      ? "(английское)"
                      : ""}
                  </span>
                  <input
                    type="text"
                    value={formOriginalTitle}
                    onChange={(e) =>
                      setFormOriginalTitle(e.target.value)
                    }
                  />
                </label>

                <label>
                  <span>Файл обложки</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormCoverFile(
                        e.target.files && e.target.files[0]
                          ? e.target.files[0]
                          : null
                      )
                    }
                  />
                  {formCoverPath && (
                    <small>
                      Текущая обложка: <code>{formCoverPath}</code>
                    </small>
                  )}
                </label>

                <label>
                  <span>Статус</span>
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as Status | "")
                    }
                  >
                    <option value="">—</option>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Оценка (1–10)</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formRating}
                    onChange={(e) => setFormRating(e.target.value)}
                  />
                </label>

                {category === "movies" ? (
                  <>
                    <label>
                      <span>
                        Длительность&nbsp;
                        {category === "movies"
                          ? "(чч:мм:сс)"
                          : "(общее время, чч:мм:сс)"}
                      </span>
                      <input
                        type="text"
                        placeholder="1:42:54"
                        value={formDurationTotal}
                        onChange={(e) =>
                          setFormDurationTotal(e.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span>Просмотрено (чч:мм:сс)</span>
                      <input
                        type="text"
                        placeholder="0:33:12"
                        value={formDurationWatched}
                        onChange={(e) =>
                          setFormDurationWatched(e.target.value)
                        }
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      <span>Всего эпизодов/страниц</span>
                      <input
                        type="number"
                        min={0}
                        value={formEpisodesTotal}
                        onChange={(e) =>
                          setFormEpisodesTotal(e.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span>Просмотрено эпизодов/страниц</span>
                      <input
                        type="number"
                        min={0}
                        value={formEpisodesWatched}
                        onChange={(e) =>
                          setFormEpisodesWatched(e.target.value)
                        }
                      />
                    </label>
                    {category === "anime" && (
                      <label>
                        <span>Продолжительность</span>
                        <input
                          type="text"
                          placeholder="23 мин."
                          value={formAnimeDurationText}
                          onChange={(e) =>
                            setFormAnimeDurationText(e.target.value)
                          }
                        />
                      </label>
                    )}
                  </>
                )}

                <label>
                  <span>Сезон / год</span>
                  <input
                    type="text"
                    placeholder={
                      category === "movies" ? "2014" : "Лето 2014"
                    }
                    value={formSeason}
                    onChange={(e) => setFormSeason(e.target.value)}
                  />
                </label>

                <label>
                  <span>Жанры (через запятую)</span>
                  <input
                    type="text"
                    value={formGenres}
                    onChange={(e) => setFormGenres(e.target.value)}
                  />
                </label>

                <label>
                  <span>Студия</span>
                  <input
                    type="text"
                    value={formStudio}
                    onChange={(e) => setFormStudio(e.target.value)}
                  />
                </label>

                <label>
                  <span>Дата выхода (опц.)</span>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD"
                    value={formReleaseDate}
                    onChange={(e) =>
                      setFormReleaseDate(e.target.value)
                    }
                  />
                </label>

              </div>

              <div className="dialog-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeForm}
                >
                  Отмена
                </button>
                <button type="submit" className="primary-btn">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function renderEpisodesOrDuration(
  watched: number | null,
  total: number | null,
  category: Category
) {
  if (watched == null || total == null || total === 0) {
    return "—";
  }

  if (category === "movies" || category === "anime") {
    return `${formatTime(watched)} из ${formatTime(total)}`;
  }

  return `${watched} из ${total}`;
}

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = [
    h.toString(),
    m.toString().padStart(2, "0"),
    s.toString().padStart(2, "0")
  ];
  return parts.join(":");
}

type ProgressBarProps = {
  watched: number | null;
  total: number | null;
};

function ProgressBar({ watched, total }: ProgressBarProps) {
  const percent =
    watched != null && total && total > 0
      ? Math.min(100, Math.round((watched / total) * 100))
      : 0;

  return (
    <div className="progress">
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="progress-label">{percent}%</span>
    </div>
  );
}

export default App;
