import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type {
  Category,
  ContentItem,
  SortBy,
  Status,
  PaginatedContentResponse,
} from "../domain";
import { isCategory } from "../domain";
import {
  usesPersonStudioFilter,
  usesSeasonFilter,
} from "../utils/categoryLabels";
import { getApiBase } from "../utils/api";
import { titleDetailPath } from "../utils/contentPaths";
import { useContentForm } from "../hooks/useContentForm";
import { CategoryTabs } from "../components/MainWindow/CategoryTabs";
import { Toolbar } from "../components/MainWindow/Toolbar";
import { FiltersPanel } from "../components/MainWindow/FiltersPanel";
import { ContentTable } from "../components/MainWindow/ContentTable";
import { Pagination } from "../components/MainWindow/Pagination";
import { ContentFormDialog } from "../components/MainWindow/ContentFormDialog";
import { InterfaceSettingsDialog } from "../components/Settings/InterfaceSettingsDialog";

const API_BASE = getApiBase();

function parseCategoryParam(value: string | null): Category {
  if (value && isCategory(value)) return value;
  return "anime";
}

export function ContentListPage({
  settingsOpen,
  onSettingsClose,
  coverSize,
  onCoverSizeChange,
  showOriginalTitle,
  onShowOriginalTitleChange,
  onSettingsSave,
}: {
  settingsOpen: boolean;
  onSettingsClose: () => void;
  coverSize: "small" | "medium" | "large";
  onCoverSizeChange: (size: "small" | "medium" | "large") => void;
  showOriginalTitle: boolean;
  onShowOriginalTitleChange: (value: boolean) => void;
  onSettingsSave: () => void;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = parseCategoryParam(searchParams.get("category"));

  const setCategory = (next: Category) => {
    setSearchParams({ category: next });
    setPage(1);
    setSeasonFilter("Все");
    if (!usesPersonStudioFilter(next)) {
      setDirectorQuery("");
    }
  };

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
  const [changeToken, setChangeToken] = useState(0);

  const reload = () => setChangeToken((t) => t + 1);

  const form = useContentForm({ category, onReload: reload });

  const importInputRef = useRef<HTMLInputElement>(null);

  const handleShikimoriImport = async (
    e: React.ChangeEvent<HTMLInputElement>,
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Не удалось импортировать данные");
      }
      const info = await res.json();
      alert(
        `Импорт завершён. Добавлено: ${info.imported}, пропущено: ${info.skipped}, всего: ${info.total}.`,
      );
      reload();
    } catch (err) {
      alert(
        `Ошибка импорта: ${(err as Error).message || "проверьте формат JSON"}`,
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
        if (titleQuery.trim()) params.set("title", titleQuery.trim());
        if (genresQuery.trim()) params.set("genres", genresQuery.trim());
        if (usesSeasonFilter(category) && seasonFilter !== "Все") {
          params.set("season", seasonFilter);
        }
        if (yearFilter.trim()) params.set("year", yearFilter.trim());
        if (usesPersonStudioFilter(category) && directorQuery.trim()) {
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
        if ((e as Error).name === "AbortError") return;
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
    changeToken,
  ]);

  const toggleStatus = (status: Status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? [] : [status],
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

  const handlePageChange = (nextPage: number) => setPage(nextPage);

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("goldenmedia_pageSize", String(nextPageSize));
    }
  };

  const handleSettingsSaveInternal = () => {
    onSettingsSave();
    onSettingsClose();
  };

  const handleItemOpen = (item: ContentItem) => {
    navigate(titleDetailPath(category, item.id));
  };

  const openDetailFromForm = () => {
    if (!form.editingItem) return;
    form.closeForm();
    navigate(titleDetailPath(category, form.editingItem.id));
  };

  return (
    <div className={`cover-size-${coverSize}`}>
      <section className="card">
        <CategoryTabs value={category} onChange={setCategory} />

        <Toolbar category={category} onCreate={form.openCreateForm} />

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
          onEdit={form.openEditForm}
          onDelete={form.handleDelete}
          onItemOpen={handleItemOpen}
        />

        <Pagination
          page={page}
          pageSize={pageSize}
          total={totalItems}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </section>

      <ContentFormDialog
        category={category}
        mode={form.formMode}
        open={form.formOpen}
        onClose={form.closeForm}
        formTitle={form.formTitle}
        onFormTitleChange={form.setFormTitle}
        formOriginalTitle={form.formOriginalTitle}
        onFormOriginalTitleChange={form.setFormOriginalTitle}
        formDescription={form.formDescription}
        onFormDescriptionChange={form.setFormDescription}
        formStatus={form.formStatus}
        onFormStatusChange={form.handleStatusChange}
        formRating={form.formRating}
        onFormRatingChange={form.setFormRating}
        formEpisodesTotal={form.formEpisodesTotal}
        onFormEpisodesTotalChange={form.setFormEpisodesTotal}
        formEpisodesWatched={form.formEpisodesWatched}
        onFormEpisodesWatchedChange={form.setFormEpisodesWatched}
        formSeason={form.formSeason}
        onFormSeasonChange={form.setFormSeason}
        formGenres={form.formGenres}
        onFormGenresChange={form.setFormGenres}
        formStudio={form.formStudio}
        onFormStudioChange={form.setFormStudio}
        formReleaseDate={form.formReleaseDate}
        onFormReleaseDateChange={form.setFormReleaseDate}
        formViewStartDate={form.formViewStartDate}
        onFormViewStartDateChange={form.setFormViewStartDate}
        formViewEndDate={form.formViewEndDate}
        onFormViewEndDateChange={form.setFormViewEndDate}
        coverMode={form.coverMode}
        onCoverModeChange={form.switchCoverMode}
        formCoverPath={form.formCoverPath}
        onFormCoverPathChange={form.setFormCoverPath}
        formCoverFileName={form.formCoverFile ? form.formCoverFile.name : null}
        filePreviewUrl={form.filePreviewUrl}
        onCoverFileChange={form.setFormCoverFile}
        formDurationTotal={form.formDurationTotal}
        onFormDurationTotalChange={form.setFormDurationTotal}
        formDurationWatched={form.formDurationWatched}
        onFormDurationWatchedChange={form.setFormDurationWatched}
        formAnimeDurationText={form.formAnimeDurationText}
        onFormAnimeDurationTextChange={form.setFormAnimeDurationText}
        onSubmit={form.handleFormSubmit}
        onOpenDetail={
          form.formMode === "edit" ? openDetailFromForm : undefined
        }
      />

      <InterfaceSettingsDialog
        open={settingsOpen}
        onClose={onSettingsClose}
        category={category}
        coverSize={coverSize}
        onCoverSizeChange={onCoverSizeChange}
        showOriginalTitle={showOriginalTitle}
        onShowOriginalTitleChange={onShowOriginalTitleChange}
        importInputRef={importInputRef}
        onShikimoriImport={handleShikimoriImport}
        onSubmit={handleSettingsSaveInternal}
      />
    </div>
  );
}

