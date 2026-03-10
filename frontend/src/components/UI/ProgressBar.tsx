type ProgressBarProps = {
  watched: number | null;
  total: number | null;
};

export default function ProgressBar({ watched, total }: ProgressBarProps) {
  const percent =
    watched != null && total && total > 0
      ? Math.min(100, Math.round((watched / total) * 100))
      : 0;

  return (
    <div className="progress">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="progress-label">{percent}%</span>
    </div>
  );
}

