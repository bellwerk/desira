interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  className?: string;
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
}: ProgressBarProps): React.ReactElement {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-700/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-300"
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










