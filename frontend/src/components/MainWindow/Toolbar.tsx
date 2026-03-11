import type { Category } from "../../domain";

type ToolbarProps = {
  category: Category;
  onCreate: () => void;
};

export function Toolbar({ category, onCreate }: ToolbarProps) {
  return (
    <div className="toolbar">
      <button className="primary-btn" onClick={onCreate}>
        Добавить запись
      </button>
    </div>
  );
}

