"use client";

type QuickStatsProps = {
  totalItems: number;
  availableCount: number;
  reservedCount: number;
  fundedCount: number;
  totalFundedCents: number;
  totalTargetCents: number;
  currency: string;
};

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function QuickStats({
  totalItems,
  availableCount,
  reservedCount,
  fundedCount,
  totalFundedCents,
  totalTargetCents,
  currency,
}: QuickStatsProps): React.ReactElement {
  const fundingPct =
    totalTargetCents > 0
      ? Math.min(100, Math.round((totalFundedCents / totalTargetCents) * 100))
      : 0;

  return (
    <div className="glass-2 rounded-2xl px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        {/* Total items */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-slate-400" />
          <span className="text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-[#343338] dark:text-white">
              {totalItems}
            </span>{" "}
            {totalItems === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Available */}
        {availableCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-[#343338] dark:text-white">
                {availableCount}
              </span>{" "}
              available
            </span>
          </div>
        )}

        {/* Reserved */}
        {reservedCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-[#343338] dark:text-white">
                {reservedCount}
              </span>{" "}
              reserved
            </span>
          </div>
        )}

        {/* Funded */}
        {fundedCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-violet-500" />
            <span className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-[#343338] dark:text-white">
                {fundedCount}
              </span>{" "}
              funded
            </span>
          </div>
        )}

        {/* Funding progress */}
        {totalTargetCents > 0 && (
          <>
            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-600" />
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-[#343338] dark:text-white">
                  {formatCurrency(totalFundedCents, currency)}
                </span>{" "}
                of {formatCurrency(totalTargetCents, currency)}
              </span>
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="h-1.5 w-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-rose-500 transition-all duration-500"
                    style={{ width: `${fundingPct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {fundingPct}%
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
