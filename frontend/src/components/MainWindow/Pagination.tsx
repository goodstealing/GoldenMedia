type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  const handlePrev = () => {
    if (safePage > 1) {
      onPageChange(safePage - 1);
    }
  };

  const handleNext = () => {
    if (safePage < totalPages) {
      onPageChange(safePage + 1);
    }
  };

  const handlePageClick = (targetPage: number) => {
    if (targetPage !== safePage) {
      onPageChange(targetPage);
    }
  };

  const handlePageSizeClick = (size: number) => {
    if (size !== pageSize) {
      onPageSizeChange(size);
    }
  };

  // Простая генерация номеров страниц с "окном" вокруг текущей
  const pageNumbers: number[] = [];
  const windowSize = 3;
  const start = Math.max(1, safePage - windowSize);
  const end = Math.min(totalPages, safePage + windowSize);
  for (let p = start; p <= end; p += 1) {
    pageNumbers.push(p);
  }

  return (
    <div className="pagination-bar">
      <div className="page-size">
        <span className="page-size-label">На странице:</span>
        <div className="page-size-options">
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              className={`chip ${pageSize === size ? "chip-active" : ""}`}
              onClick={() => handlePageSizeClick(size)}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="page-btn"
          onClick={handlePrev}
          disabled={safePage <= 1}
        >
          &lt;
        </button>

        {start > 1 && (
          <>
            <button
              type="button"
              className={`page-btn ${safePage === 1 ? "page-btn-active" : ""}`}
              onClick={() => handlePageClick(1)}
            >
              1
            </button>
            {start > 2 && <span className="page-ellipsis">…</span>}
          </>
        )}

        {pageNumbers.map((p) => (
          <button
            key={p}
            type="button"
            className={`page-btn ${p === safePage ? "page-btn-active" : ""}`}
            onClick={() => handlePageClick(p)}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="page-ellipsis">…</span>}
            <button
              type="button"
              className={`page-btn ${
                safePage === totalPages ? "page-btn-active" : ""
              }`}
              onClick={() => handlePageClick(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          className="page-btn"
          onClick={handleNext}
          disabled={safePage >= totalPages}
        >
          &gt;
        </button>

        <span className="page-info">
          Страница {safePage} из {totalPages}
        </span>
      </div>
    </div>
  );
}

