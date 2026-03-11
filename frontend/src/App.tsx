import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import type {
  Category,
  ContentItem,
  SortBy,
  Status,
  PaginatedContentResponse,
} from "./domain";
import { getApiBase } from "./utils/api";
import {
  formatDateShort,
  formatTime,
  parseDateShortToIso,
  parseDurationToSeconds,
} from "./utils/time";
import { CategoryTabs } from "./components/MainWindow/CategoryTabs";
import { Toolbar } from "./components/MainWindow/Toolbar";
import { FiltersPanel } from "./components/MainWindow/FiltersPanel";
import { ContentTable } from "./components/MainWindow/ContentTable";
import { Pagination } from "./components/MainWindow/Pagination";
import { ContentFormDialog } from "./components/MainWindow/ContentFormDialog";
import { InterfaceSettingsDialog } from "./components/Settings/InterfaceSettingsDialog";

const API_BASE = getApiBase();

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
  const [directorQuery, setDirectorQuery] = useState("");

  const [sortBy, setSortBy] = useState<SortBy>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("goldenmedia_pageSize");
      const n = stored ? Number(stored) : NaN;
      if (n === 20 || n === 50 || n === 100) {
        return n;
      }
    }
    return 50;
  });
  const [totalItems, setTotalItems] = useState<number>(0);

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
  const [formViewStartDate, setFormViewStartDate] = useState("");
  const [formViewEndDate, setFormViewEndDate] = useState("");
  const [formCoverPath, setFormCoverPath] = useState("");

  const [changeToken, setChangeToken] = useState(0);
  const [showOriginalTitle, setShowOriginalTitle] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("goldenmedia_showOriginalTitle");
      if (stored === "true") return true;
      if (stored === "false") return false;
    }
    return false;
  });
  const [formCoverFile, setFormCoverFile] = useState<File | null>(null);
  const [formDurationTotal, setFormDurationTotal] = useState("");
  const [formDurationWatched, setFormDurationWatched] = useState("");
  const [formAnimeDurationText, setFormAnimeDurationText] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [coverMode, setCoverMode] = useState<"file" | "url">("url");
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [coverSize, setCoverSize] = useState<"small" | "medium" | "large">(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("goldenmedia_coverSize");
      if (stored === "small" || stored === "medium" || stored === "large") {
        return stored;
      }
    }
    return "small";
  });

  const handleShikimoriImport = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch(
        `${API_BASE}/api/content/import/shikimori/anime`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        }
      );
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Не удалось импортировать данные");
      }
      const info = await res.json();
      alert(
        `Импорт завершён. Добавлено: ${info.imported}, пропущено: ${info.skipped}, всего: ${info.total}.`
      );
      setChangeToken((t) => t + 1);
    } catch (err) {
      alert(
        `Ошибка импорта: ${(err as Error).message || "проверьте формат JSON"}`
      );
    } finally {
      e.target.value = "";
    }
  };

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
        if (category !== "movies" && seasonFilter !== "Все") {
          params.set("season", seasonFilter);
        }
        if (yearFilter.trim()) {
          params.set("year", yearFilter.trim());
        }
        if (directorQuery.trim()) {
          params.set("studio", directorQuery.trim());
        }
        if (sortBy) {
          params.set("sortBy", sortBy);
          params.set("sortDir", sortDir);
        }
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));

        const url = `${API_BASE}/api/content/${category}?${params.toString()}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Ошибка загрузки: ${res.status}`);
        }
        const data: PaginatedContentResponse = await res.json();
        setItems(data.items);
        setTotalItems(data.total);
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
    directorQuery,
    sortBy,
    sortDir,
    page,
    pageSize,
    changeToken
  ]);

  const toggleStatus = (status: Status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? [] : [status]
    );
  };

  useEffect(() => {
    if (!formCoverFile) {
      setFilePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(formCoverFile);
    setFilePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [formCoverFile]);

  const handleSortClick = (column: SortBy) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  const visibleItems = useMemo(() => items, [items]);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("goldenmedia_pageSize", String(nextPageSize));
    }
  };

  const handleCoverSizeChange = (size: "small" | "medium" | "large") => {
    setCoverSize(size);
  };

  const handleSettingsSave = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("goldenmedia_coverSize", coverSize);
      window.localStorage.setItem(
        "goldenmedia_showOriginalTitle",
        String(showOriginalTitle)
      );
    }
    setSettingsOpen(false);
  };

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
    setFormViewStartDate("");
    setFormViewEndDate("");
    setFormCoverPath("");
    setFormCoverFile(null);
    setCoverMode("url");
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
    setFormReleaseDate(
      item.release_date ? formatDateShort(item.release_date) ?? "" : "",
    );
    setFormViewStartDate(
      item.view_start_date ? formatDateShort(item.view_start_date) ?? "" : "",
    );
    setFormViewEndDate(
      item.view_end_date ? formatDateShort(item.view_end_date) ?? "" : "",
    );
    setFormCoverPath(item.cover_path ?? "");
    setFormCoverFile(null);
    const isUrlCover =
      typeof item.cover_path === "string" &&
      (item.cover_path.startsWith("http://") ||
        item.cover_path.startsWith("https://"));
    setCoverMode(isUrlCover ? "url" : "file");
    if (category === "movies") {
      setFormDurationTotal(
        item.episodes_total != null ? formatTime(item.episodes_total) : ""
      );
      const isCompleted = item.status === "Просмотрено";
      setFormDurationWatched(
        isCompleted || item.episodes_watched == null
          ? ""
          : formatTime(item.episodes_watched)
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

  const switchCoverMode = (mode: "file" | "url") => {
    setCoverMode(mode);
    if (mode === "file") {
      setFormCoverPath("");
    } else {
      setFormCoverFile(null);
    }
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

    const releaseDateIso = parseDateShortToIso(formReleaseDate) ?? null;
    const viewStartIso = parseDateShortToIso(formViewStartDate) ?? null;
    const viewEndIso = parseDateShortToIso(formViewEndDate) ?? null;

    const payload: Record<string, unknown> = {
      title: formTitle.trim(),
      original_title: formOriginalTitle.trim() || null,
      status: formStatus || null,
      rating: formRating ? Number(formRating) : null,
      episodes_total: episodesTotalValue,
      episodes_watched: episodesWatchedValue,
      season: formSeason || null,
      genres: formGenres || null,
      studio: formStudio || null,
      release_date: releaseDateIso,
      duration_text: finalAnimeDurationText
    };

    if (coverMode === "url" && formCoverPath.trim()) {
      payload.cover_path = formCoverPath.trim();
    }

    try {
      const urlBase = `${API_BASE}/api/content/${category}`;
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      if (viewStartIso) {
        formData.append("view_start_date", viewStartIso);
      }
      if (viewEndIso) {
        formData.append("view_end_date", viewEndIso);
      }
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
    <div className={`app-root cover-size-${coverSize}`}>
      <header className="app-header">
        <div className="app-title-block">
          <h1 className="app-title">Golden Media</h1>
          <p className="app-subtitle">
            Учёт сериалов, фильмов, аниме, манги и книг
          </p>
        </div>
        <div className="app-header-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label="Настройки интерфейса"
            onClick={() => setSettingsOpen(true)}
          >
            <span className="icon-gear">⚙</span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="card">
          <CategoryTabs value={category} onChange={setCategory} />

          <Toolbar category={category} onCreate={openCreateForm} />

          <FiltersPanel
            category={category}
            selectedStatuses={selectedStatuses}
            onToggleStatus={toggleStatus}
            onResetStatuses={() => setSelectedStatuses([])}
            titleQuery={titleQuery}
            onTitleQueryChange={setTitleQuery}
            genresQuery={genresQuery}
            onGenresQueryChange={setGenresQuery}
            seasonFilter={seasonFilter}
            onSeasonFilterChange={setSeasonFilter}
            yearFilter={yearFilter}
            onYearFilterChange={setYearFilter}
            directorQuery={directorQuery}
            onDirectorQueryChange={setDirectorQuery}
          />

          <ContentTable
            category={category}
            items={visibleItems}
            loading={loading}
            error={error}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={handleSortClick}
            showOriginalTitle={showOriginalTitle}
            onEdit={openEditForm}
            onDelete={handleDelete}
          />

          <Pagination
            page={page}
            pageSize={pageSize}
            total={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </section>
      </main>

      <ContentFormDialog
        category={category}
        mode={formMode}
        open={formOpen}
        onClose={closeForm}
        formTitle={formTitle}
        onFormTitleChange={setFormTitle}
        formOriginalTitle={formOriginalTitle}
        onFormOriginalTitleChange={setFormOriginalTitle}
        formStatus={formStatus}
        onFormStatusChange={(value) => {
          setFormStatus(value);
          if (category === "movies" && value === "Просмотрено") {
            setFormDurationWatched("");
          }
        }}
        formRating={formRating}
        onFormRatingChange={setFormRating}
        formEpisodesTotal={formEpisodesTotal}
        onFormEpisodesTotalChange={setFormEpisodesTotal}
        formEpisodesWatched={formEpisodesWatched}
        onFormEpisodesWatchedChange={setFormEpisodesWatched}
        formSeason={formSeason}
        onFormSeasonChange={setFormSeason}
        formGenres={formGenres}
        onFormGenresChange={setFormGenres}
        formStudio={formStudio}
        onFormStudioChange={setFormStudio}
        formReleaseDate={formReleaseDate}
        onFormReleaseDateChange={setFormReleaseDate}
        formViewStartDate={formViewStartDate}
        onFormViewStartDateChange={setFormViewStartDate}
        formViewEndDate={formViewEndDate}
        onFormViewEndDateChange={setFormViewEndDate}
        coverMode={coverMode}
        onCoverModeChange={switchCoverMode}
        formCoverPath={formCoverPath}
        onFormCoverPathChange={setFormCoverPath}
        formCoverFileName={formCoverFile ? formCoverFile.name : null}
        filePreviewUrl={filePreviewUrl}
        onCoverFileChange={setFormCoverFile}
        formDurationTotal={formDurationTotal}
        onFormDurationTotalChange={setFormDurationTotal}
        formDurationWatched={formDurationWatched}
        onFormDurationWatchedChange={setFormDurationWatched}
        formAnimeDurationText={formAnimeDurationText}
        onFormAnimeDurationTextChange={setFormAnimeDurationText}
        onSubmit={handleFormSubmit}
      />

      <InterfaceSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        category={category}
        coverSize={coverSize}
        onCoverSizeChange={handleCoverSizeChange}
        showOriginalTitle={showOriginalTitle}
        onShowOriginalTitleChange={setShowOriginalTitle}
        importInputRef={importInputRef}
        onShikimoriImport={handleShikimoriImport}
        onSubmit={handleSettingsSave}
      />
    </div>
  );
}

export default App;
