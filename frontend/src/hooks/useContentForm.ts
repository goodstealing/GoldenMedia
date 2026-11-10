import { useEffect, useState } from "react";
import {
  normalizeStatusForCategory,
  type Category,
  type ContentItem,
  type Status,
} from "../domain";
import {
  getYearFormValue,
  usesSeasonYearField,
  usesYearOnlyField,
} from "../utils/categoryLabels";
import {
  formatDateShort,
  formatTime,
  parseDateShortToIso,
  parseDurationToSeconds,
  parseYearToIso,
} from "../utils/time";
import { getApiBase } from "../utils/api";

const API_BASE = getApiBase();

type CoverMode = "file" | "url";

export interface UseContentFormArgs {
  category: Category;
  onReload: () => void;
}

export interface UseContentFormResult {
  formOpen: boolean;
  formMode: "create" | "edit";
  editingItem: ContentItem | null;
  formTitle: string;
  setFormTitle: (value: string) => void;
  formOriginalTitle: string;
  setFormOriginalTitle: (value: string) => void;
  formStatus: Status | "";
  handleStatusChange: (value: Status | "") => void;
  formRating: string;
  setFormRating: (value: string) => void;
  formEpisodesTotal: string;
  setFormEpisodesTotal: (value: string) => void;
  formEpisodesWatched: string;
  setFormEpisodesWatched: (value: string) => void;
  formSeason: string;
  setFormSeason: (value: string) => void;
  formGenres: string;
  setFormGenres: (value: string) => void;
  formStudio: string;
  setFormStudio: (value: string) => void;
  formReleaseDate: string;
  setFormReleaseDate: (value: string) => void;
  formViewStartDate: string;
  setFormViewStartDate: (value: string) => void;
  formViewEndDate: string;
  setFormViewEndDate: (value: string) => void;
  coverMode: CoverMode;
  switchCoverMode: (mode: CoverMode) => void;
  formCoverPath: string;
  setFormCoverPath: (value: string) => void;
  formCoverFile: File | null;
  setFormCoverFile: (file: File | null) => void;
  filePreviewUrl: string | null;
  formDurationTotal: string;
  setFormDurationTotal: (value: string) => void;
  formDurationWatched: string;
  setFormDurationWatched: (value: string) => void;
  formAnimeDurationText: string;
  setFormAnimeDurationText: (value: string) => void;
  formDescription: string;
  setFormDescription: (value: string) => void;
  openCreateForm: () => void;
  openEditForm: (item: ContentItem) => void;
  closeForm: () => void;
  handleDelete: (item: ContentItem) => Promise<void>;
  handleFormSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useContentForm(
  args: UseContentFormArgs
): UseContentFormResult {
  const { category, onReload } = args;

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] =
    useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] =
    useState<ContentItem | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formOriginalTitle, setFormOriginalTitle] = useState("");
  const [formStatus, setFormStatus] =
    useState<Status | "">("");
  const [formRating, setFormRating] = useState<string>("");
  const [formEpisodesTotal, setFormEpisodesTotal] =
    useState<string>("");
  const [formEpisodesWatched, setFormEpisodesWatched] =
    useState<string>("");
  const [formSeason, setFormSeason] = useState("");
  const [formGenres, setFormGenres] = useState("");
  const [formStudio, setFormStudio] = useState("");
  const [formReleaseDate, setFormReleaseDate] = useState("");
  const [formViewStartDate, setFormViewStartDate] = useState("");
  const [formViewEndDate, setFormViewEndDate] = useState("");
  const [formCoverPath, setFormCoverPath] = useState("");

  const [formCoverFile, setFormCoverFile] = useState<File | null>(null);
  const [coverMode, setCoverMode] =
    useState<CoverMode>("url");
  const [filePreviewUrl, setFilePreviewUrl] =
    useState<string | null>(null);
  const [formDurationTotal, setFormDurationTotal] = useState("");
  const [formDurationWatched, setFormDurationWatched] =
    useState("");
  const [formAnimeDurationText, setFormAnimeDurationText] =
    useState("");
  const [formDescription, setFormDescription] = useState("");

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

  const handleStatusChange = (value: Status | "") => {
    setFormStatus(value);
    if (category === "movies" && value === "Просмотрено") {
      setFormDurationWatched("");
    }
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
    setFormDescription("");
    setFormOpen(true);
  };

  const openEditForm = (item: ContentItem) => {
    setFormMode("edit");
    setEditingItem(item);
    setFormTitle(item.title);
    setFormOriginalTitle(item.original_title ?? "");
    setFormStatus(normalizeStatusForCategory(category, item.status) ?? "");
    setFormRating(item.rating != null ? String(item.rating) : "");
    setFormEpisodesTotal(
      item.episodes_total != null ? String(item.episodes_total) : ""
    );
    setFormEpisodesWatched(
      item.episodes_watched != null
        ? String(item.episodes_watched)
        : ""
    );
    if (usesSeasonYearField(category)) {
      setFormSeason(item.season ?? "");
      setFormReleaseDate("");
    } else if (category === "movies") {
      setFormSeason("");
      setFormReleaseDate(
        item.release_date ? formatDateShort(item.release_date) ?? "" : "",
      );
    } else {
      setFormSeason("");
      setFormReleaseDate(getYearFormValue(item, category));
    }
    setFormGenres(item.genres ?? "");
    setFormStudio(item.studio ?? "");
    setFormViewStartDate(
      item.view_start_date
        ? formatDateShort(item.view_start_date) ?? ""
        : ""
    );
    setFormViewEndDate(
      item.view_end_date
        ? formatDateShort(item.view_end_date) ?? ""
        : ""
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
    setFormDescription(item.description ?? "");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
  };

  const switchCoverMode = (mode: CoverMode) => {
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
      onReload();
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
    if (coverMode === "file" && formCoverFile && !formOriginalTitle.trim()) {
      alert("Для загрузки обложки сначала заполните оригинальное название");
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
        ? formAnimeDurationText.trim() || "23 мин."
        : null;

    let releaseDateIso: string | null = null;
    let seasonValue: string | null = null;

    if (category === "movies") {
      releaseDateIso = parseDateShortToIso(formReleaseDate) ?? null;
    } else if (usesYearOnlyField(category)) {
      releaseDateIso =
        parseYearToIso(formReleaseDate) ??
        parseDateShortToIso(formReleaseDate) ??
        null;
    } else if (usesSeasonYearField(category)) {
      seasonValue = formSeason.trim() || null;
    }

    const viewStartIso =
      parseDateShortToIso(formViewStartDate) ?? null;
    const viewEndIso =
      parseDateShortToIso(formViewEndDate) ?? null;

    const payload: Record<string, unknown> = {
      title: formTitle.trim(),
      original_title: formOriginalTitle.trim() || null,
      status: formStatus || null,
      rating: formRating ? Number(formRating) : null,
      episodes_total: episodesTotalValue,
      episodes_watched: episodesWatchedValue,
      season: seasonValue,
      genres: formGenres || null,
      studio: formStudio || null,
      release_date: releaseDateIso,
      duration_text: finalAnimeDurationText,
      description: formDescription.trim() || null
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
      onReload();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return {
    formOpen,
    formMode,
    editingItem,
    formTitle,
    setFormTitle,
    formOriginalTitle,
    setFormOriginalTitle,
    formStatus,
    handleStatusChange,
    formRating,
    setFormRating,
    formEpisodesTotal,
    setFormEpisodesTotal,
    formEpisodesWatched,
    setFormEpisodesWatched,
    formSeason,
    setFormSeason,
    formGenres,
    setFormGenres,
    formStudio,
    setFormStudio,
    formReleaseDate,
    setFormReleaseDate,
    formViewStartDate,
    setFormViewStartDate,
    formViewEndDate,
    setFormViewEndDate,
    coverMode,
    switchCoverMode,
    formCoverPath,
    setFormCoverPath,
    formCoverFile,
    setFormCoverFile,
    filePreviewUrl,
    formDurationTotal,
    setFormDurationTotal,
    formDurationWatched,
    setFormDurationWatched,
    formAnimeDurationText,
    setFormAnimeDurationText,
    formDescription,
    setFormDescription,
    openCreateForm,
    openEditForm,
    closeForm,
    handleDelete,
    handleFormSubmit
  };
}

