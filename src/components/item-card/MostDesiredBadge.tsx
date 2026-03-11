type MostDesiredBadgeProps = {
  active: boolean;
  interactive?: boolean;
  className?: string;
};

export function MostDesiredBadge({
  active,
  interactive = false,
  className = "",
}: MostDesiredBadgeProps): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full bg-[#8a5a0b] px-2 py-0.5 text-[8px] font-semibold text-white sm:px-3 sm:py-1 sm:text-[10px] md:text-xs ${className}`}
    >
      <span className="flex h-3 w-3 items-center justify-center rounded-full border-2 border-white bg-[#2b2b2b] sm:h-[14px] sm:w-[14px]">
        {active && <span className="h-1.5 w-1.5 rounded-full bg-white sm:h-2 sm:w-2" />}
      </span>
      {interactive ? (
        <>
          <span className="hidden sm:inline">{active ? "Most Desired" : "Mark as Most Desired"}</span>
          <span className="sm:hidden">Most Desired</span>
        </>
      ) : (
        <span>Most Desired</span>
      )}
    </span>
  );
}
