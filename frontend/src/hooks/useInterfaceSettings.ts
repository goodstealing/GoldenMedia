import { useState } from "react";

export type CoverSize = "small" | "medium" | "large";

const COVER_SIZE_STORAGE_KEY = "goldenmedia_coverSize";
const SHOW_ORIGINAL_TITLE_STORAGE_KEY =
  "goldenmedia_showOriginalTitle";

export interface UseInterfaceSettingsResult {
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  coverSize: CoverSize;
  setCoverSize: (size: CoverSize) => void;
  showOriginalTitle: boolean;
  setShowOriginalTitle: (value: boolean) => void;
  handleSettingsSave: () => void;
}

export function useInterfaceSettings(): UseInterfaceSettingsResult {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [coverSize, setCoverSizeState] = useState<CoverSize>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(
        COVER_SIZE_STORAGE_KEY
      );
      if (stored === "small" || stored === "medium" || stored === "large") {
        return stored;
      }
    }
    return "small";
  });

  const [showOriginalTitle, setShowOriginalTitleState] =
    useState<boolean>(() => {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(
          SHOW_ORIGINAL_TITLE_STORAGE_KEY
        );
        if (stored === "true") return true;
        if (stored === "false") return false;
      }
      return false;
    });

  const openSettings = () => setSettingsOpen(true);
  const closeSettings = () => setSettingsOpen(false);

  const setCoverSize = (size: CoverSize) => {
    setCoverSizeState(size);
  };

  const setShowOriginalTitle = (value: boolean) => {
    setShowOriginalTitleState(value);
  };

  const handleSettingsSave = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COVER_SIZE_STORAGE_KEY, coverSize);
      window.localStorage.setItem(
        SHOW_ORIGINAL_TITLE_STORAGE_KEY,
        String(showOriginalTitle)
      );
    }
    setSettingsOpen(false);
  };

  return {
    settingsOpen,
    openSettings,
    closeSettings,
    coverSize,
    setCoverSize,
    showOriginalTitle,
    setShowOriginalTitle,
    handleSettingsSave
  };
}

