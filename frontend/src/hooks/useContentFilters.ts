import { useState } from "react";
import type { Status } from "../domain";

export type SeasonFilter = "Все" | "Зима" | "Весна" | "Лето" | "Осень";

export interface UseContentFiltersResult {
  selectedStatuses: Status[];
  titleQuery: string;
  genresQuery: string;
  seasonFilter: SeasonFilter;
  yearFilter: string;
  directorQuery: string;
  setTitleQuery: (value: string) => void;
  setGenresQuery: (value: string) => void;
  setSeasonFilter: (value: SeasonFilter) => void;
  setYearFilter: (value: string) => void;
  setDirectorQuery: (value: string) => void;
  toggleStatus: (status: Status) => void;
  resetStatuses: () => void;
}

export function useContentFilters(): UseContentFiltersResult {
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
  const [titleQuery, setTitleQuery] = useState("");
  const [genresQuery, setGenresQuery] = useState("");
  const [seasonFilter, setSeasonFilter] =
    useState<SeasonFilter>("Все");
  const [yearFilter, setYearFilter] = useState("");
  const [directorQuery, setDirectorQuery] = useState("");

  const toggleStatus = (status: Status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? [] : [status]
    );
  };

  const resetStatuses = () => {
    setSelectedStatuses([]);
  };

  return {
    selectedStatuses,
    titleQuery,
    genresQuery,
    seasonFilter,
    yearFilter,
    directorQuery,
    setTitleQuery,
    setGenresQuery,
    setSeasonFilter,
    setYearFilter,
    setDirectorQuery,
    toggleStatus,
    resetStatuses
  };
}

