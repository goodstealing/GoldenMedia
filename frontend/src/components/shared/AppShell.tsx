import { Link } from "react-router-dom";

type AppShellProps = {
  children: React.ReactNode;
  onOpenSettings?: () => void;
};

export function AppShell({ children, onOpenSettings }: AppShellProps) {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-title-block">
          <Link to="/" className="app-title-link">
            <h1 className="app-title">Golden Media</h1>
          </Link>
          <p className="app-subtitle">
            Учёт сериалов, фильмов, аниме, манги и книг
          </p>
        </div>
        <div className="app-header-actions">
          {onOpenSettings && (
            <button
              type="button"
              className="icon-btn"
              aria-label="Настройки интерфейса"
              onClick={onOpenSettings}
            >
              <span className="icon-gear">⚙</span>
            </button>
          )}
        </div>
      </header>

      <main className="app-main">{children}</main>
    </div>
  );
}
