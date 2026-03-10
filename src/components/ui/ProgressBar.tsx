interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  className?: string;
  heightClassName?: string;
  trackClassName?: string;
  barClassName?: string;
}

/**
 * ProgressBar — funding progress display
 *
 * Usage:
 * <ProgressBar value={65} label="$65 of $100" />
 */
export function ProgressBar({
  value,
  label,
  className = "",
  heightClassName = "h-1.5",
  trackClassName = "bg-slate-200/60 dark:bg-slate-700/60",
  barClassName = "bg-gradient-to-r from-rose-500 to-orange-400",
}: ProgressBarProps): React.ReactElement {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      <div className={`${heightClassName} w-full overflow-hidden rounded-full ${trackClassName}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${barClassName}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {label && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {label}
        </p>
      )}
    </div>
  );
}







