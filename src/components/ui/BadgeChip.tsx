import type { ReactNode } from "react";

type BadgeVariant =
  | "available"
  | "reserved"
  | "funded"
  | "owner"
  | "private"
  | "unlisted"
  | "public"
  | "neutral";

interface BadgeChipProps {
  variant: BadgeVariant;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  available:
    "bg-slate-100/80 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300",
  reserved:
    "bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  funded:
    "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  owner:
    "bg-violet-100/80 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  private:
    "bg-slate-100/80 text-slate-600 dark:bg-slate-700/60 dark:text-slate-400",
  unlisted:
    "bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  public:
    "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  neutral:
    "bg-slate-100/80 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300",
};

/**
 * BadgeChip — status and label chips
 *
 * Variants: available, reserved, funded, owner, private, unlisted, public, neutral
 *
 * Usage:
 * <BadgeChip variant="reserved">Reserved</BadgeChip>
 * <BadgeChip variant="private" icon={<LockIcon />}>Private</BadgeChip>
 */
export function BadgeChip({
  variant,
  children,
  icon,
  className = "",
}: BadgeChipProps): React.ReactElement {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium
        backdrop-blur-sm
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {icon}
      {children}
    </span>
  );
}





