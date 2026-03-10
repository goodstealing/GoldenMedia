import type { Category } from "../../domain";

type ToolbarProps = {
  category: Category;
  onCreate: () => void;
  showOriginalTitle: boolean;
  onToggleOriginalTitle: () => void;
  importInputRef: React.RefObject<HTMLInputElement>;
  onShikimoriImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function Toolbar({
  category,
  onCreate,
  showOriginalTitle,
  onToggleOriginalTitle,
  importInputRef,
  onShikimoriImport,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <button className="primary-btn" onClick={onCreate}>
        Добавить запись
      </button>
      <button
        className="secondary-btn title-toggle"
        type="button"
        onClick={onToggleOriginalTitle}
      >
        {showOriginalTitle
          ? "Показывать русские названия"
          : "Показывать оригинальные названия"}
      </button>
      {category === "anime" && (
        <>
          <input
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            ref={importInputRef}
            onChange={onShikimoriImport}
          />
          <button
            className="secondary-btn"
            type="button"
            onClick={() => importInputRef.current?.click()}
          >
            Импорт из Shikimori JSON
          </button>
        </>
      )}
    </div>
  );
}

