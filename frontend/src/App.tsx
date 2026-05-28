import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { AppShell } from "./components/shared/AppShell";
import { ContentListPage } from "./pages/ContentListPage";
import { TitleDetailPage } from "./pages/TitleDetailPage";
import { BookReaderPage } from "./pages/BookReaderPage";

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [coverSize, setCoverSize] = useState<"small" | "medium" | "large">(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("goldenmedia_coverSize");
      if (stored === "small" || stored === "medium" || stored === "large") {
        return stored;
      }
    }
    return "small";
  });
  const [showOriginalTitle, setShowOriginalTitle] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("goldenmedia_showOriginalTitle");
      if (stored === "true") return true;
      if (stored === "false") return false;
    }
    return false;
  });

  const handleSettingsSave = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("goldenmedia_coverSize", coverSize);
      window.localStorage.setItem(
        "goldenmedia_showOriginalTitle",
        String(showOriginalTitle),
      );
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AppShell onOpenSettings={() => setSettingsOpen(true)}>
              <ContentListPage
                settingsOpen={settingsOpen}
                onSettingsClose={() => setSettingsOpen(false)}
                coverSize={coverSize}
                onCoverSizeChange={setCoverSize}
                showOriginalTitle={showOriginalTitle}
                onShowOriginalTitleChange={setShowOriginalTitle}
                onSettingsSave={handleSettingsSave}
              />
            </AppShell>
          }
        />
        <Route
          path="/books/:id/read"
          element={
            <AppShell>
              <BookReaderPage />
            </AppShell>
          }
        />
        <Route
          path="/:category/:id/read"
          element={
            <AppShell>
              <BookReaderPage />
            </AppShell>
          }
        />
        <Route
          path="/:category/:id"
          element={
            <AppShell>
              <TitleDetailPage />
            </AppShell>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
