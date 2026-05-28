import { getStatusesForCategory, type Category, type Status } from "../../domain";
import {
  getPersonStudioFilterLabel,
  getPersonStudioFilterPlaceholder,
  usesPersonStudioFilter,
  usesSeasonFilter,
} from "../../utils/categoryLabels";

type SeasonFilter = "Все" | "Зима" | "Весна" | "Лето" | "Осень";

type FiltersPanelProps = {
  category: Category;
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
  directorQuery: string;
  onDirectorQueryChange: (value: string) => void;
};

export function FiltersPanel({
  category,
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
  directorQuery,
  onDirectorQueryChange,
}: FiltersPanelProps) {
  const showSeasonFilter = usesSeasonFilter(category);
  const showPersonFilter = usesPersonStudioFilter(category);
  const statuses = getStatusesForCategory(category);

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
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                className={`chip ${
                  selectedStatuses.includes(status as Status) ? "chip-active" : ""
                }`}
                onClick={() => onToggleStatus(status as Status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="filters-row">
        <div className="filter-group">
          <label className="filter-label">
            Поиск по названию (рус / оригинальное)
          </label>
          <input
            type="text"
            placeholder="Русское или оригинальное название..."
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
        {showPersonFilter && (
          <div className="filter-group">
            <label className="filter-label">
              {getPersonStudioFilterLabel(category)}
            </label>
            <input
              type="text"
              placeholder={getPersonStudioFilterPlaceholder(category)}
              value={directorQuery}
              onChange={(e) => onDirectorQueryChange(e.target.value)}
            />
          </div>
        )}

        {showSeasonFilter && (
          <div className="filter-group">
            <label className="filter-label">Сезон</label>
            <select
              value={seasonFilter}
              onChange={(e) =>
                onSeasonFilterChange(e.target.value as SeasonFilter)
              }
            >
              <option value="Все">Все</option>
              <option value="Зима">Зима</option>
              <option value="Весна">Весна</option>
              <option value="Лето">Лето</option>
              <option value="Осень">Осень</option>
            </select>
          </div>
        )}

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
