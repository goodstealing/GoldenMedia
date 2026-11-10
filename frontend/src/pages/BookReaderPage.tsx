import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ePub from "epubjs";
import { Document, Page, pdfjs } from "react-pdf";
import type { ReadingBookmark } from "../domain";
import { CATEGORIES } from "../domain";
import { buildCoverUrl } from "../utils/api";
import { listPath, titleDetailPath } from "../utils/contentPaths";
import { ReaderErrorBoundary } from "../components/shared/ReaderErrorBoundary";
import {
  createBookmark,
  deleteBookmark,
  fetchBookReaderData,
  saveBookProgress,
  uploadBookFile
} from "../utils/bookReaderApi";
import { loadTextPages } from "../reader/services/bookContent";
import type { BookFormat } from "../reader/types";
import { useReaderFullscreen } from "../reader/hooks/useReaderFullscreen";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export function BookReaderPage() {
  const params = useParams();
  const id = Number(params.id);
  const routeCategory = params.category ?? "books";
  const category = routeCategory === "books" || routeCategory === "manga" ? routeCategory : "books";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [book, setBook] = useState<any>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formatLoading, setFormatLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<ReadingBookmark[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [pageInputError, setPageInputError] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [textPages, setTextPages] = useState<string[]>([]);
  const [pdfPages, setPdfPages] = useState(0);
  const [pdfWidth, setPdfWidth] = useState(900);
  const [epubReady, setEpubReady] = useState(false);
  const [pageIndicatorVisible, setPageIndicatorVisible] = useState(false);
  const epubContainerRef = useRef<HTMLDivElement | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const pageViewRef = useRef<HTMLDivElement | null>(null);
  const renditionRef = useRef<any>(null);
  const epubBookRef = useRef<any>(null);
  const epubLocationCountRef = useRef(1);
  const isEpubReadyRef = useRef(false);
  const pendingEpubPageRef = useRef<number | null>(null);
  const suppressEpubRelocatedRef = useRef(false);
  const initialLocationRef = useRef<string | null>(null);
  const relocateRafRef = useRef<number | null>(null);
  const readTimer = useRef<number | null>(null);
  const pageIndicatorTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const readerStageRef = useRef<HTMLDivElement | null>(null);
  const wheelLockRef = useRef(0);
  const isFullscreenRef = useRef(false);
  const { isFullscreen, toggleFullscreen } = useReaderFullscreen(readerStageRef);

  const format = (book?.book_file_format as BookFormat | null) ?? null;
  const isScrollableFormat = format === "pdf" || format === "txt" || format === "fb2";
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentPage / Math.max(1, totalPages)) * 100)
  );

  const categoryLabel =
    CATEGORIES.find((c) => c.id === category)?.label ?? category;
  const bookFileUrl = useMemo(() => {
    if (!book?.book_file_path) return null;
    return buildCoverUrl(book.book_file_path) ?? null;
  }, [book?.book_file_path]);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchBookReaderData(category, id);
        setBook(data.book);
        setBookmarks(data.bookmarks);
        setCurrentPage(data.progress?.current_page ?? 1);
        setPageInput(String(data.progress?.current_page ?? 1));
        setTotalPages(data.progress?.total_pages ?? 1);
        setLocation(data.progress?.location ?? null);
        initialLocationRef.current = data.progress?.location ?? null;
        setFontSize(data.progress?.font_size ?? 18);
        setTheme(data.progress?.theme ?? "dark");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, category]);

  useEffect(() => {
    if (!bookFileUrl || !format) return;
    if (format !== "txt" && format !== "fb2") return;
    let canceled = false;

    setFormatLoading(true);
    loadTextPages(bookFileUrl, format, fontSize)
      .then((result) => {
        if (canceled) return;
        setTextPages(result.pages);
        setTotalPages(result.totalPages);
        setCurrentPage((prev) => Math.min(Math.max(1, prev), result.totalPages));
      })
      .catch(() => {
        if (!canceled) setError("Не удалось обработать текст книги");
      })
      .finally(() => {
        if (!canceled) setFormatLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [bookFileUrl, format, fontSize]);

  useEffect(() => {
    if (format === "pdf") {
      setFormatLoading(true);
    }
  }, [format]);

  useEffect(() => {
    setError(null);
    if (!bookFileUrl || format !== "epub" || !epubContainerRef.current) return;
    let disposed = false;
    setFormatLoading(true);
    setEpubReady(false);

    const disposeCurrent = () => {
      try {
        if (renditionRef.current) {
          renditionRef.current.destroy();
        }
      } catch {
        // noop
      }
      try {
        if (epubBookRef.current) {
          epubBookRef.current.destroy();
        }
      } catch {
        // noop
      }
      renditionRef.current = null;
      epubBookRef.current = null;
      isEpubReadyRef.current = false;
      pendingEpubPageRef.current = null;
      suppressEpubRelocatedRef.current = false;
    };

    disposeCurrent();
    const mountPoint = epubContainerRef.current;
    mountPoint.replaceChildren();

    try {
      const url = bookFileUrl;
      const bookInstance = ePub(url);
      const rendition = bookInstance.renderTo(mountPoint, {
        width: "100%",
        height: "100%",
        flow: "paginated",
        spread: "none",
        allowScriptedContent: true
      });
      epubBookRef.current = bookInstance;
      renditionRef.current = rendition;

      const onRelocated = (loc: any) => {
        if (disposed) return;
        if (!isEpubReadyRef.current) return;
        if (suppressEpubRelocatedRef.current) {
          suppressEpubRelocatedRef.current = false;
          return;
        }
        const cfi = loc?.start?.cfi ?? null;
        if (!cfi) return;

        const percentage = bookInstance.locations.percentageFromCfi(cfi);
        const total = Math.max(1, epubLocationCountRef.current);
        const nextPage = Math.max(1, Math.min(total, Math.floor(percentage * total) + 1));
        if (relocateRafRef.current != null) {
          cancelAnimationFrame(relocateRafRef.current);
        }
        relocateRafRef.current = requestAnimationFrame(() => {
          if (disposed) return;
          setLocation(cfi);
          setCurrentPage(nextPage);
        });
      };
      rendition.on("relocated", onRelocated);

      bookInstance.ready
        .then(async () => {
          if (disposed) return;
          await bookInstance.locations.generate(2000);
          if (disposed) return;
          const locationsCount = Math.max(1, bookInstance.locations.length());
          epubLocationCountRef.current = locationsCount;
          isEpubReadyRef.current = true;
          setTotalPages(locationsCount);
          setEpubReady(true);
          setFormatLoading(false);

          const pendingPage = pendingEpubPageRef.current;
          if (pendingPage != null) {
            const safePage = Math.min(Math.max(1, pendingPage), locationsCount);
            const ratio = (safePage - 1) / Math.max(1, locationsCount);
            const cfi = bookInstance.locations.cfiFromPercentage(ratio);
            if (cfi) {
              suppressEpubRelocatedRef.current = true;
              rendition.display(cfi);
            } else {
              rendition.display();
            }
            pendingEpubPageRef.current = null;
            return;
          }

          if (initialLocationRef.current) {
            rendition.display(initialLocationRef.current);
            return;
          }
          rendition.display();
        })
        .catch((epubError) => {
          if (disposed) return;
          setError(`Не удалось открыть EPUB: ${String(epubError)}`);
          setFormatLoading(false);
        });
    } catch (epubInitError) {
      setError(`Ошибка инициализации EPUB: ${String(epubInitError)}`);
      setFormatLoading(false);
    }

    return () => {
      disposed = true;
      try {
        if (renditionRef.current) {
          renditionRef.current.destroy();
        }
      } catch {
        // noop
      }
      try {
        if (epubBookRef.current) {
          epubBookRef.current.destroy();
        }
      } catch {
        // noop
      }
      renditionRef.current = null;
      epubBookRef.current = null;
      isEpubReadyRef.current = false;
      pendingEpubPageRef.current = null;
      suppressEpubRelocatedRef.current = false;
      if (relocateRafRef.current != null) {
        cancelAnimationFrame(relocateRafRef.current);
      }
    };
  }, [bookFileUrl, format]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    if (!pdfContainerRef.current) return;
    const element = pdfContainerRef.current;
    const updateWidth = () => {
      const nextWidth = Math.max(280, Math.floor(element.clientWidth - 24));
      setPdfWidth(nextWidth);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (format !== "epub" || !renditionRef.current) return;
    try {
      renditionRef.current.themes.default({
        body: {
          "font-size": `${fontSize}px !important`,
          "line-height": "1.6 !important"
        },
        p: {
          "font-size": `${fontSize}px !important`,
          "line-height": "1.7 !important"
        }
      });
      renditionRef.current.themes.fontSize(`${fontSize}px`);
    } catch {
      // ignore theme update errors for edge-case EPUBs
    }
  }, [fontSize, format]);

  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  useEffect(() => {
    const hasFile = Boolean(book?.book_file_path);
    if (pageIndicatorTimerRef.current != null) {
      window.clearTimeout(pageIndicatorTimerRef.current);
    }
    if (!isFullscreen || !hasFile) {
      setPageIndicatorVisible(false);
      return;
    }
    setPageIndicatorVisible(true);
    pageIndicatorTimerRef.current = window.setTimeout(() => {
      setPageIndicatorVisible(false);
    }, 850);
    return () => {
      if (pageIndicatorTimerRef.current != null) {
        window.clearTimeout(pageIndicatorTimerRef.current);
      }
    };
  }, [currentPage, isFullscreen, book?.book_file_path]);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0 || !book?.book_file_path) return;
    if (readTimer.current != null) window.clearTimeout(readTimer.current);
    readTimer.current = window.setTimeout(() => {
      saveBookProgress(category, id, {
        current_page: currentPage,
        total_pages: totalPages,
        location,
        progress_percent: progressPercent,
        font_size: fontSize,
        theme
      }).catch(() => {
        // keep local state if network failed
      });
    }, 600);
    return () => {
      if (readTimer.current != null) window.clearTimeout(readTimer.current);
    };
  }, [id, category, currentPage, totalPages, location, progressPercent, fontSize, theme, book?.book_file_path]);

  const hasBookFile = Boolean(book?.book_file_path);

  const goPrev = useCallback(() => {
    if (format === "epub" && renditionRef.current) {
      if (!isEpubReadyRef.current) return;
      renditionRef.current.prev();
      return;
    }
    if (isScrollableFormat) {
      const targetPage = Math.max(1, currentPage - 1);
      setCurrentPage(targetPage);
      if (pageViewRef.current) pageViewRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setCurrentPage((p) => Math.max(1, p - 1));
  }, [format, isScrollableFormat, currentPage]);

  const goNext = useCallback(() => {
    if (format === "epub" && renditionRef.current) {
      if (!isEpubReadyRef.current) return;
      renditionRef.current.next();
      return;
    }
    if (isScrollableFormat) {
      const targetPage = Math.min(totalPages, currentPage + 1);
      setCurrentPage(targetPage);
      if (pageViewRef.current) pageViewRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  }, [format, totalPages, isScrollableFormat, currentPage]);

  const jumpToPage = useCallback(
    (targetPage: number) => {
      const safePage = Math.min(Math.max(1, targetPage), totalPages);
      if (format === "epub" && renditionRef.current) {
        if (!isEpubReadyRef.current) {
          pendingEpubPageRef.current = safePage;
          return;
        }
        const ratio = (safePage - 1) / Math.max(1, totalPages);
        const cfi = renditionRef.current.book.locations.cfiFromPercentage(ratio);
        if (!cfi) return;
        suppressEpubRelocatedRef.current = true;
        renditionRef.current.display(cfi);
        return;
      }
      if (isScrollableFormat) {
        setCurrentPage(safePage);
        if (pageViewRef.current) pageViewRef.current.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setCurrentPage(safePage);
    },
    [format, totalPages, isScrollableFormat]
  );

  const commitPageInput = useCallback(() => {
    const trimmed = pageInput.trim();
    if (!trimmed) {
      setPageInput(String(currentPage));
      setPageInputError(null);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > totalPages) {
      setPageInputError(`Введите значение от 1 до ${totalPages}`);
      return;
    }
    setPageInputError(null);
    if (parsed !== currentPage) {
      jumpToPage(parsed);
      return;
    }
    setPageInput(String(currentPage));
  }, [pageInput, currentPage, totalPages, jumpToPage]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!hasBookFile) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "PageDown") {
        if (!isScrollableFormat || !pageViewRef.current) return;
        event.preventDefault();
        pageViewRef.current.scrollBy({ top: pageViewRef.current.clientHeight * 0.85, behavior: "smooth" });
      } else if (event.key === "PageUp") {
        if (!isScrollableFormat || !pageViewRef.current) return;
        event.preventDefault();
        pageViewRef.current.scrollBy({ top: -pageViewRef.current.clientHeight * 0.85, behavior: "smooth" });
      } else if (event.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          // noop
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, hasBookFile, isScrollableFormat]);

  useEffect(() => {
    const stage = readerStageRef.current;
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      if (format !== "epub") return;
      if (!hasBookFile || !isFullscreenRef.current) return;
      event.preventDefault();
      const now = Date.now();
      if (now - wheelLockRef.current < 260) return;
      wheelLockRef.current = now;
      if (event.deltaY < 0) {
        goNext();
      } else if (event.deltaY > 0) {
        goPrev();
      }
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [goNext, goPrev, hasBookFile, format]);

  const handleUpload = async (selectedFile: File) => {
    try {
      setUploading(true);
      const updated = await uploadBookFile(category, id, selectedFile);
      setBook(updated);
      setCurrentPage(1);
      setPageInput("1");
      setTotalPages(1);
      setLocation(null);
      initialLocationRef.current = null;
      setTextPages([]);
      setPdfPages(0);
      setBookmarks([]);
      setFileModalOpen(false);
      setPendingFile(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFilePicked = (file: File | null) => {
    if (!file) return;
    setPendingFile(file);
    setFileModalOpen(true);
  };

  const handleAddBookmark = async () => {
    if (!Number.isFinite(id) || id <= 0) return;
    const created = await createBookmark(category, id, {
      page: currentPage,
      location,
      label: `Страница ${currentPage}`
    });
    setBookmarks((prev) => [created, ...prev]);
  };

  const handleDeleteBookmark = async (bookmarkId: number) => {
    await deleteBookmark(category, id, bookmarkId);
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
  };

  const jumpToBookmark = (bookmark: ReadingBookmark) => {
    if (format === "epub" && bookmark.location && renditionRef.current) {
      renditionRef.current.display(bookmark.location);
      return;
    }
    jumpToPage(bookmark.page);
  };

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <div className="reader-page">
        <div className="info error">Некорректный адрес страницы чтения.</div>
        <Link className="btn btn-secondary" to="/">
          К списку
        </Link>
      </div>
    );
  }

  return (
    <div className={`reader-page reader-theme-${theme}`}>
      <div className="reader-toolbar">
        <Link className="btn btn-secondary" to={titleDetailPath(category, id)}>
          ← К странице тайтла
        </Link>
        <Link className="btn btn-secondary" to={listPath(category)}>
          К списку ({categoryLabel})
        </Link>
      </div>

      {loading && <div className="info">Загрузка...</div>}
      {error && <div className="info error">Ошибка: {error}</div>}

      {!loading && !error && book && (
        <section className="card reader-card">
          <header className="reader-header">
            <h1 className="reader-title">{book.title}</h1>
            <p className="reader-subtitle">
              Формат: {format ? format.toUpperCase() : "не загружен"} · Прогресс:{" "}
              {progressPercent.toFixed(1)}%
            </p>
          </header>

          {!hasBookFile && (
            <div className="reader-upload">
              <p>Загрузите файл книги в формате EPUB, PDF, TXT или FB2.</p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={uploading}
                onClick={openFilePicker}
              >
                {uploading ? "Загрузка..." : "Выбрать файл"}
              </button>
            </div>
          )}

          {hasBookFile && (
            <>
              <div className="reader-top-controls">
                <div className="reader-controls">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={currentPage <= 1 && format !== "epub"}
                    onClick={goPrev}
                  >
                    ← Предыдущая
                  </button>
                  <span className="reader-page-indicator">
                    Текущая страница {currentPage} из {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={currentPage >= totalPages && format !== "epub"}
                    onClick={goNext}
                  >
                    Следующая →
                  </button>
                  <div className="reader-page-jump">
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, totalPages)}
                      value={pageInput}
                      className={pageInputError ? "reader-input-error" : ""}
                      onChange={(e) => setPageInput(e.target.value)}
                      onBlur={commitPageInput}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitPageInput();
                        }
                      }}
                    />
                    {pageInputError && <span className="reader-inline-error">{pageInputError}</span>}
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={Math.max(1, totalPages)}
                    value={currentPage}
                    className="reader-page-slider"
                    onChange={(e) => jumpToPage(Number(e.target.value))}
                  />
                </div>
                <div className="reader-settings">
                  <label>
                    Размер шрифта
                    <input
                      type="range"
                      min={14}
                      max={30}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                  >
                    Тема: {theme === "dark" ? "Тёмная" : "Светлая"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddBookmark}
                  >
                    Добавить закладку
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={openFilePicker}
                  >
                    Заменить файл книги
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={toggleFullscreen}>
                    {isFullscreen ? "⤢ Выйти" : "⤢ Fullscreen"}
                  </button>
                </div>
              </div>

              <ReaderErrorBoundary fallbackTitle="Ошибка отображения книги">
                <div
                  ref={readerStageRef}
                  className="reader-stage"
                >
                {isFullscreen && (
                  <div
                    className={`reader-page-indicator-float ${pageIndicatorVisible ? "visible" : ""}`}
                    aria-live="polite"
                  >
                    Страница {currentPage} из {totalPages}
                  </div>
                )}
                <div
                  ref={pageViewRef}
                  className={`reader-page-view reader-format-${format ?? "none"}`}
                  style={{ fontSize }}
                >
                {formatLoading && (
                  <div className="reader-loader">
                    <div className="reader-skeleton" />
                    <div className="reader-skeleton" />
                    <div className="reader-skeleton short" />
                  </div>
                )}

                {format === "txt" || format === "fb2" ? (
                  <article className="reader-text reader-text-page">{textPages[currentPage - 1] ?? ""}</article>
                ) : null}

                {format === "pdf" && bookFileUrl ? (
                  <div ref={pdfContainerRef} className="reader-pdf-wrapper">
                    <Document
                      file={bookFileUrl}
                      onLoadSuccess={({ numPages }) => {
                        setPdfPages(numPages);
                        setTotalPages(numPages);
                        setFormatLoading(false);
                      }}
                      onLoadError={(pdfError) => {
                        setError(`Не удалось открыть PDF: ${String(pdfError)}`);
                        setFormatLoading(false);
                      }}
                    >
                      {Array.from({ length: pdfPages }, (_, index) => {
                        const page = index + 1;
                        if (page !== Math.min(currentPage, pdfPages || 1)) return null;
                        return (
                          <div key={page} className="reader-pdf-page">
                            <Page
                              pageNumber={page}
                              width={pdfWidth}
                              scale={Math.max(0.7, fontSize / 18)}
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                            />
                          </div>
                        );
                      })}
                    </Document>
                  </div>
                ) : null}

                {format === "epub" ? (
                  <div ref={epubContainerRef} className="reader-epub-container" />
                ) : null}
                </div>
                <button
                  type="button"
                  className="reader-nav-hotzone reader-nav-hotzone-left"
                  aria-label="Предыдущая страница"
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                />
                <button
                  type="button"
                  className="reader-nav-hotzone reader-nav-hotzone-right"
                  aria-label="Следующая страница"
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                />
                </div>
              {format === "epub" && !epubReady && (
                <div className="info">Подготовка EPUB...</div>
              )}
              </ReaderErrorBoundary>

              <section className="reader-bookmarks">
                <h3>Закладки</h3>
                {bookmarks.length === 0 ? (
                  <p className="reader-subtitle">Пока нет закладок</p>
                ) : (
                  <div className="reader-bookmarks-list">
                    {bookmarks.map((bookmark) => (
                      <div key={bookmark.id} className="reader-bookmark-item">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => jumpToBookmark(bookmark)}
                        >
                          {bookmark.label ?? `Страница ${bookmark.page}`}
                        </button>
                        <button
                          type="button"
                          className="row-btn row-btn-danger"
                          onClick={() => handleDeleteBookmark(bookmark.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </section>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="reader-hidden-input"
        accept=".epub,.pdf,.txt,.fb2,application/epub+zip,application/pdf,text/plain,text/xml,application/xml"
        onChange={(e) => {
          handleFilePicked(e.target.files?.[0] ?? null);
          e.currentTarget.value = "";
        }}
      />

      {fileModalOpen && pendingFile && (
        <div className="dialog-backdrop reader-file-dialog-backdrop" onClick={() => setFileModalOpen(false)}>
          <div className="dialog reader-file-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Подтвердите замену файла</h3>
            <p><strong>Имя:</strong> {pendingFile.name}</p>
            <p><strong>Формат:</strong> {(pendingFile.name.split(".").pop() ?? "unknown").toUpperCase()}</p>
            <p><strong>Размер:</strong> {(pendingFile.size / 1024 / 1024).toFixed(2)} MB</p>
            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setFileModalOpen(false)}>
                Отмена
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={uploading}
                onClick={() => handleUpload(pendingFile)}
              >
                {uploading ? "Применение..." : "Применить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
