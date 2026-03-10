import type { FormEvent } from "react";
import type { Category, Status } from "../../domain";
import { STATUSES } from "../../domain";
import { buildCoverUrl } from "../../utils/api";

type CoverMode = "file" | "url";

type ContentFormDialogProps = {
  category: Category;
  mode: "create" | "edit";
  open: boolean;
  onClose: () => void;
  formTitle: string;
  onFormTitleChange: (value: string) => void;
  formOriginalTitle: string;
  onFormOriginalTitleChange: (value: string) => void;
  formStatus: Status | "";
  onFormStatusChange: (value: Status | "") => void;
  formRating: string;
  onFormRatingChange: (value: string) => void;
  formEpisodesTotal: string;
  onFormEpisodesTotalChange: (value: string) => void;
  formEpisodesWatched: string;
  onFormEpisodesWatchedChange: (value: string) => void;
  formSeason: string;
  onFormSeasonChange: (value: string) => void;
  formGenres: string;
  onFormGenresChange: (value: string) => void;
  formStudio: string;
  onFormStudioChange: (value: string) => void;
  formReleaseDate: string;
  onFormReleaseDateChange: (value: string) => void;
  coverMode: CoverMode;
  onCoverModeChange: (mode: CoverMode) => void;
  formCoverPath: string;
  onFormCoverPathChange: (value: string) => void;
  /** Текущее выбранное имя файла (если есть) */
  formCoverFileName: string | null;
  /** URL для предпросмотра файла, создаётся в App */
  filePreviewUrl: string | null;
  /** Передаёт выбранный файл наверх, чтобы App мог сохранить File и создать preview URL */
  onCoverFileChange: (file: File | null) => void;
  formDurationTotal: string;
  onFormDurationTotalChange: (value: string) => void;
  formDurationWatched: string;
  onFormDurationWatchedChange: (value: string) => void;
  formAnimeDurationText: string;
  onFormAnimeDurationTextChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
};

export function ContentFormDialog({
  category,
  mode,
  open,
  onClose,
  formTitle,
  onFormTitleChange,
  formOriginalTitle,
  onFormOriginalTitleChange,
  formStatus,
  onFormStatusChange,
  formRating,
  onFormRatingChange,
  formEpisodesTotal,
  onFormEpisodesTotalChange,
  formEpisodesWatched,
  onFormEpisodesWatchedChange,
  formSeason,
  onFormSeasonChange,
  formGenres,
  onFormGenresChange,
  formStudio,
  onFormStudioChange,
  formReleaseDate,
  onFormReleaseDateChange,
  coverMode,
  onCoverModeChange,
  formCoverPath,
  onFormCoverPathChange,
  formCoverFileName,
  filePreviewUrl,
  onCoverFileChange,
  formDurationTotal,
  onFormDurationTotalChange,
  formDurationWatched,
  onFormDurationWatchedChange,
  formAnimeDurationText,
  onFormAnimeDurationTextChange,
  onSubmit,
}: ContentFormDialogProps) {
  if (!open) return null;

  const currentCoverPreviewSrc = (() => {
    let src: string | null = null;

    if (coverMode === "url") {
      const trimmed = formCoverPath.trim();
      src = trimmed ? buildCoverUrl(trimmed) ?? null : null;
    } else if (filePreviewUrl) {
      src = filePreviewUrl;
    } else if (formCoverPath) {
      src = buildCoverUrl(formCoverPath) ?? null;
    }

    return src;
  })();

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">
            {mode === "create" ? "Добавить запись" : "Редактировать запись"}
          </h2>
          <button
            type="button"
            className="dialog-close"
            aria-label="Закрыть"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form className="dialog-form" onSubmit={onSubmit}>
          <div className="dialog-grid">
            <label>
              <span>Название *</span>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => onFormTitleChange(e.target.value)}
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
                onChange={(e) => onFormOriginalTitleChange(e.target.value)}
              />
            </label>

            <div className="cover-block">
              <div className="cover-block-head">
                <div className="cover-block-title">Обложка</div>
                <div className="cover-mode">
                  <button
                    type="button"
                    className={`chip ${coverMode === "file" ? "chip-active" : ""}`}
                    onClick={() => onCoverModeChange("file")}
                  >
                    Файл
                  </button>
                  <button
                    type="button"
                    className={`chip ${coverMode === "url" ? "chip-active" : ""}`}
                    onClick={() => onCoverModeChange("url")}
                  >
                    Ссылка
                  </button>
                </div>
              </div>

              <div className="cover-block-grid">
                <label>
                  <span>Файл обложки</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={coverMode !== "file"}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      onCoverFileChange(file);
                    }}
                  />
                  <small className="hint">
                    {formCoverFileName
                      ? formCoverFileName
                      : coverMode === "file" && formCoverPath
                      ? `Текущая обложка: ${formCoverPath}`
                      : "Файл не выбран"}
                  </small>
                </label>

                <label>
                  <span>Ссылка на обложку (URL)</span>
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://example.com/cover.webp"
                    disabled={coverMode !== "url"}
                    value={coverMode === "url" ? formCoverPath : ""}
                    onChange={(e) => onFormCoverPathChange(e.target.value)}
                  />
                  <small className="hint">
                    Поддерживаются любые форматы, которые умеет браузер (webp,
                    png, jpeg/jpg и др.).
                  </small>
                </label>

                <div className="cover-preview">
                  <span>Предпросмотр</span>
                  <div className="cover-preview-box">
                    {currentCoverPreviewSrc ? (
                      <img
                        src={currentCoverPreviewSrc}
                        alt="cover preview"
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
                      <div className="cover-preview-placeholder">
                        {coverMode === "file"
                          ? formCoverFileName || "Выберите файл"
                          : "Вставьте ссылку"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <label>
              <span>Статус</span>
              <select
                value={formStatus}
                onChange={(e) => onFormStatusChange(e.target.value as Status | "")}
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
                onChange={(e) => onFormRatingChange(e.target.value)}
              />
            </label>

            {category === "movies" ? (
              <>
                <label>
                  <span>Длительность (чч:мм:сс)</span>
                  <input
                    type="text"
                    placeholder="1:42:54"
                    value={formDurationTotal}
                    onChange={(e) => onFormDurationTotalChange(e.target.value)}
                  />
                </label>
                <label>
                  <span>Просмотрено (чч:мм:сс)</span>
                  <input
                    type="text"
                    placeholder="0:33:12"
                    value={formDurationWatched}
                    onChange={(e) => onFormDurationWatchedChange(e.target.value)}
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
                    onChange={(e) => onFormEpisodesTotalChange(e.target.value)}
                  />
                </label>
                <label>
                  <span>Просмотрено эпизодов/страниц</span>
                  <input
                    type="number"
                    min={0}
                    value={formEpisodesWatched}
                    onChange={(e) => onFormEpisodesWatchedChange(e.target.value)}
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
                        onFormAnimeDurationTextChange(e.target.value)
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
                placeholder={category === "movies" ? "2014" : "Лето 2014"}
                value={formSeason}
                onChange={(e) => onFormSeasonChange(e.target.value)}
              />
            </label>

            <label>
              <span>Жанры (через запятую)</span>
              <input
                type="text"
                value={formGenres}
                onChange={(e) => onFormGenresChange(e.target.value)}
              />
            </label>

            <label>
              <span>Студия</span>
              <input
                type="text"
                value={formStudio}
                onChange={(e) => onFormStudioChange(e.target.value)}
              />
            </label>

            <label>
              <span>Дата выхода (опц.)</span>
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                value={formReleaseDate}
                onChange={(e) => onFormReleaseDateChange(e.target.value)}
              />
            </label>
          </div>

          <div className="dialog-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
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
  );
}

