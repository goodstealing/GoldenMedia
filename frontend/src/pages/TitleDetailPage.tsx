import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import {
  CATEGORIES,
  STATUSES,
  getConsumeActionLabel,
  getStatusClassName,
  isCategory,
  type Category,
  type Status,
} from "../domain";
import { useContentItem } from "../hooks/useContentItem";
import { useContentForm } from "../hooks/useContentForm";
import {
  deleteContentItem,
  updateContentStatus,
} from "../utils/contentApi";
import { buildCoverUrl } from "../utils/api";
import {
  displayYearOrSeason,
  getEpisodesColumnLabel,
  getStudioColumnLabel,
  getYearColumnLabel,
} from "../utils/categoryLabels";
import { listPath, titleReaderPath } from "../utils/contentPaths";
import { ContentFormDialog } from "../components/MainWindow/ContentFormDialog";
import ProgressBar from "../components/UI/ProgressBar";
import { renderEpisodesOrDuration } from "../components/MainWindow/renderEpisodesOrDuration";
import {
  formatHoursMinutes,
  formatViewPeriodInline,
} from "../utils/time";

function isReadableCategory(category: Category): boolean {
  return category === "books" || category === "manga";
}

export function TitleDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const categoryParam = params.category ?? "";
  const idParam = Number(params.id);

  const category = isCategory(categoryParam) ? categoryParam : null;
  const categoryLabel =
    CATEGORIES.find((c) => c.id === category)?.label ?? category ?? "";

  const { item, setItem, loading, error, reload } = useContentItem(
    category ?? "anime",
    Number.isFinite(idParam) ? idParam : 0,
  );

  const form = useContentForm({
    category: category ?? "anime",
    onReload: reload,
  });

  const [statusUpdating, setStatusUpdating] = useState(false);

  if (!category || !Number.isFinite(idParam) || idParam <= 0) {
    return (
      <div className="title-detail-page">
        <div className="info error">Некорректный адрес страницы.</div>
        <Link className="btn btn-secondary" to="/">
          К списку
        </Link>
      </div>
    );
  }

  const handleStatusChange = async (status: Status) => {
    if (!item) return;
    setStatusUpdating(true);
    try {
      const updated = await updateContentStatus(category, item, status);
      setItem(updated);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (!item) return;

    if (isReadableCategory(category)) {
      if (item.status !== "Смотрю") {
        try {
          const updated = await updateContentStatus(category, item, "Смотрю");
          setItem(updated);
        } catch (e) {
          alert((e as Error).message);
          return;
        }
      }
      navigate(titleReaderPath(category, item.id));
      return;
    }

    if (item.status !== "Смотрю") {
      await handleStatusChange("Смотрю");
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!window.confirm(`Удалить "${item.title}"?`)) return;
    try {
      await deleteContentItem(category, item.id);
      navigate(listPath(category));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const openDetailFromForm = () => {
    if (!item) return;
    form.closeForm();
    navigate(`/${category}/${item.id}`);
  };

  return (
    <div className="title-detail-page">
      <div className="title-detail-nav">
        <Link className="btn btn-secondary" to={listPath(category)}>
          ← К списку ({categoryLabel})
        </Link>
      </div>

      {loading && <div className="info">Загрузка...</div>}
      {error && (
        <div className="info error">
          Ошибка: {error}{" "}
          <button type="button" className="row-btn" onClick={reload}>
            Повторить
          </button>
        </div>
      )}

      {!loading && !error && item && (
        <section className="card title-detail-card">
          <div className="title-detail-layout">
            <div className="title-detail-cover">
              {item.cover_path ? (
                <img
                  src={buildCoverUrl(item.cover_path)}
                  alt={item.title}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.broken) {
                      target.dataset.broken = "true";
                      target.src = "/covers/placeholder-cover.jpg";
                    }
                  }}
                />
              ) : (
                <div className="title-detail-cover-placeholder">Нет обложки</div>
              )}
            </div>

            <div className="title-detail-main">
              <div className="title-detail-head">
                <div>
                  <h1 className="title-detail-name">{item.title}</h1>
                  {item.original_title && item.original_title !== item.title && (
                    <p className="title-detail-alt">{item.original_title}</p>
                  )}
                </div>
                <span
                  className={`status-badge ${getStatusClassName(
                    item.status ?? "Запланировано",
                  )}`}
                >
                  {item.status ?? "Запланировано"}
                </span>
              </div>

              <div className="title-detail-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePrimaryAction}
                >
                  {getConsumeActionLabel(category)}
                </button>
                {isReadableCategory(category) && (
                  <Link
                    className="btn btn-secondary"
                    to={titleReaderPath(category, item.id)}
                  >
                    Режим чтения
                  </Link>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => form.openEditForm(item)}
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Удалить
                </button>
              </div>

              <div className="title-detail-status-row">
                <span className="title-detail-label">Статус:</span>
                <div className="title-detail-statuses">
                  {STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`chip ${
                        item.status === status ? "chip-active" : ""
                      }`}
                      disabled={statusUpdating}
                      onClick={() => handleStatusChange(status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="title-detail-progress">
                <span className="title-detail-label">Прогресс</span>
                <ProgressBar
                  watched={
                    category === "movies" && item.status === "Просмотрено"
                      ? item.episodes_total
                      : item.episodes_watched
                  }
                  total={item.episodes_total}
                />
              </div>

              <div className="title-detail-meta">
                <div className="title-detail-meta-item">
                  <span className="title-detail-label">Оценка</span>
                  <span>{item.rating != null ? item.rating : "—"}</span>
                </div>
                <div className="title-detail-meta-item">
                  <span className="title-detail-label">
                    {getEpisodesColumnLabel(category)}
                  </span>
                  <span>
                    {category === "anime" ? (
                      <>
                        {renderEpisodesOrDuration(
                          item.episodes_watched,
                          item.episodes_total,
                          category,
                        )}
                        {item.duration_text ? ` · ${item.duration_text}` : ""}
                      </>
                    ) : category === "movies" ? (
                      <>
                        {item.status === "Просмотрено" &&
                        item.episodes_total != null &&
                        item.episodes_total > 0
                          ? formatHoursMinutes(item.episodes_total)
                          : renderEpisodesOrDuration(
                              item.episodes_watched,
                              item.episodes_total,
                              category,
                            )}
                        {formatViewPeriodInline(
                          item.view_start_date,
                          item.view_end_date,
                        )
                          ? ` · ${formatViewPeriodInline(
                              item.view_start_date,
                              item.view_end_date,
                            )}`
                          : ""}
                      </>
                    ) : (
                      renderEpisodesOrDuration(
                        item.episodes_watched,
                        item.episodes_total,
                        category,
                      )
                    )}
                  </span>
                </div>
                <div className="title-detail-meta-item">
                  <span className="title-detail-label">
                    {getYearColumnLabel(category)}
                  </span>
                  <span>{displayYearOrSeason(item, category)}</span>
                </div>
                <div className="title-detail-meta-item">
                  <span className="title-detail-label">Жанры</span>
                  <span>{item.genres ?? "—"}</span>
                </div>
                <div className="title-detail-meta-item">
                  <span className="title-detail-label">
                    {getStudioColumnLabel(category)}
                  </span>
                  <span>{item.studio ?? "—"}</span>
                </div>
                {(item.view_start_date || item.view_end_date) && (
                  <div className="title-detail-meta-item">
                    <span className="title-detail-label">Период просмотра</span>
                    <span>
                      {formatViewPeriodInline(
                        item.view_start_date,
                        item.view_end_date,
                      ) ?? "—"}
                    </span>
                  </div>
                )}
              </div>

              <div className="title-detail-description">
                <h2 className="title-detail-section-title">Описание</h2>
                <p>
                  {item.description?.trim()
                    ? item.description
                    : "Описание пока не добавлено. Вы можете указать его при редактировании записи."}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

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
        onOpenDetail={form.formMode === "edit" ? openDetailFromForm : undefined}
      />
    </div>
  );
}
