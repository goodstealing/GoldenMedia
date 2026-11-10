import type { FormEvent } from "react";
import type { Category } from "../../domain";

type CoverSize = "small" | "medium" | "large";

type InterfaceSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
  category: Category;
  coverSize: CoverSize;
  onCoverSizeChange: (size: CoverSize) => void;
  showOriginalTitle: boolean;
  onShowOriginalTitleChange: (value: boolean) => void;
  importInputRef: React.RefObject<HTMLInputElement | null>;
  onShikimoriImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
};

const COVER_SIZE_OPTIONS: { id: CoverSize; label: string }[] = [
  { id: "small", label: "Мелкий" },
  { id: "medium", label: "Средний" },
  { id: "large", label: "Большой" },
];

export function InterfaceSettingsDialog({
  open,
  onClose,
  category,
  coverSize,
  onCoverSizeChange,
  showOriginalTitle,
  onShowOriginalTitleChange,
  importInputRef,
  onShikimoriImport,
  onSubmit,
}: InterfaceSettingsDialogProps) {
  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">Настройки интерфейса</h2>
          <button
            type="button"
            className="dialog-close"
            aria-label="Закрыть"
            onClick={onClose}
          />
        </div>
        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="dialog-grid dialog-grid-single">
            <label>
              <span>Размер обложек</span>
              <div className="cover-size-options">
                {COVER_SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`chip ${
                      coverSize === option.id ? "chip-active" : ""
                    }`}
                    onClick={() => onCoverSizeChange(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </label>

            {category === "anime" && (
              <label>
                <span>Импорт данных</span>
                <input
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  ref={importInputRef}
                  onChange={onShikimoriImport}
                />
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => importInputRef.current?.click()}
                >
                  Импорт из Shikimori JSON
                </button>
              </label>
            )}

            <label>
              <span>Отображение названий</span>
              <div className="cover-size-options">
                <button
                  type="button"
                  className={`chip ${!showOriginalTitle ? "chip-active" : ""}`}
                  onClick={() => onShowOriginalTitleChange(false)}
                >
                  Русские названия
                </button>
                <button
                  type="button"
                  className={`chip ${showOriginalTitle ? "chip-active" : ""}`}
                  onClick={() => onShowOriginalTitleChange(true)}
                >
                  Оригинальные названия
                </button>
              </div>
            </label>
          </div>

          <div className="dialog-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
            >
              Отменить
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


