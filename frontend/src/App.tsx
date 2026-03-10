import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import type {
  Category,
  ContentItem,
  SortBy,
  Status,
} from "./domain";
import { getApiBase } from "./utils/api";
import { formatTime, parseDurationToSeconds } from "./utils/time";
import { CategoryTabs } from "./components/MainWindow/CategoryTabs";
import { Toolbar } from "./components/MainWindow/Toolbar";
import { FiltersPanel } from "./components/MainWindow/FiltersPanel";
import { ContentTable } from "./components/MainWindow/ContentTable";
import { ContentFormDialog } from "./components/MainWindow/ContentFormDialog";

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
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [coverMode, setCoverMode] = useState<"file" | "url">("url");
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

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
    setFormReleaseDate(item.release_date ?? "");
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
      release_date: formReleaseDate || null,
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
          <CategoryTabs value={category} onChange={setCategory} />

          <Toolbar
            category={category}
            onCreate={openCreateForm}
            showOriginalTitle={showOriginalTitle}
            onToggleOriginalTitle={() => setShowOriginalTitle((v) => !v)}
            importInputRef={importInputRef}
            onShikimoriImport={handleShikimoriImport}
          />

          <FiltersPanel
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
        onFormStatusChange={(value) => setFormStatus(value)}
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
    </div>
  );
}

export default App;
