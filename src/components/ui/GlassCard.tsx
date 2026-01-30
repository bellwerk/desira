import { forwardRef, type ReactNode, type HTMLAttributes } from "react";

type GlassCardVariant = "default" | "interactive" | "dense";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassCardVariant;
  children: ReactNode;
}

const variantClasses: Record<GlassCardVariant, string> = {
  default: "glass-1 rounded-[30px] p-6",
  interactive:
    "glass-1 rounded-[30px] p-6 cursor-pointer transition-all duration-150 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]",
  dense: "glass-1 rounded-[30px] p-4",
};

/**
 * GlassCard — default container for item/list blocks
 *
 * Variants:
 * - `default` (Glass-1) — standard card
 * - `interactive` — hover/press states for clickable cards
 * - `dense` — compact padding for smaller items
 *
 * All variants include a subtle violet-to-rose gradient overlay for visual depth.
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {/* Subtle gradient overlay for visual depth */}
        <div className="absolute inset-0 rounded-[30px] bg-gradient-to-br from-violet-500/5 via-transparent to-rose-500/5 pointer-events-none" />
        <div className="relative">{children}</div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";










