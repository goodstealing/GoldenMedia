import type { Status } from "../../domain";

type SeasonFilter = "Все" | "Зима" | "Весна" | "Лето" | "Осень";

type FiltersPanelProps = {
  selectedStatuses: Status[];
  onToggleStatus: (status: Status) => void;
  onResetStatuses: () => void;
  titleQuery: string;
  onTitleQueryChange: (value: string) => void;
  genresQuery: string;
  onGenresQueryChange: (value: string) => void;
  seasonFilter: SeasonFilter;
  onSeasonFilterChange: (value: SeasonFilter) => void;
  yearFilter: string;
  onYearFilterChange: (value: string) => void;
};

export function FiltersPanel({
  selectedStatuses,
  onToggleStatus,
  onResetStatuses,
  titleQuery,
  onTitleQueryChange,
  genresQuery,
  onGenresQueryChange,
  seasonFilter,
  onSeasonFilterChange,
  yearFilter,
  onYearFilterChange,
}: FiltersPanelProps) {
  return (
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
              onClick={onResetStatuses}
            >
              Все
            </button>
            {["Запланировано", "Смотрю", "Просмотрено", "Отложено", "Брошено", "Любимое"].map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  className={`chip ${
                    selectedStatuses.includes(s as Status) ? "chip-active" : ""
                  }`}
                  onClick={() => onToggleStatus(s as Status)}
                >
                  {s}
                </button>
              ),
            )}
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
            onChange={(e) => onTitleQueryChange(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Поиск по жанрам</label>
          <input
            type="text"
            placeholder="Комедия, драма..."
            value={genresQuery}
            onChange={(e) => onGenresQueryChange(e.target.value)}
          />
        </div>
      </div>

      <div className="filters-row">
        <div className="filter-group">
          <label className="filter-label">Сезон</label>
          <select
            value={seasonFilter}
            onChange={(e) =>
              onSeasonFilterChange(
                e.target.value as SeasonFilter,
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
            onChange={(e) => onYearFilterChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

