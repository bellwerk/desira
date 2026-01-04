import { forwardRef, type ReactNode, type HTMLAttributes } from "react";

type GlassCardVariant = "default" | "interactive" | "dense";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassCardVariant;
  children: ReactNode;
}

const variantClasses: Record<GlassCardVariant, string> = {
  default: "glass-1 rounded-3xl p-6",
  interactive:
    "glass-1 rounded-3xl p-6 cursor-pointer transition-all duration-150 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]",
  dense: "glass-1 rounded-2xl p-4",
};

/**
 * GlassCard — default container for item/list blocks
 *
 * Variants:
 * - `default` (Glass-1) — standard card
 * - `interactive` — hover/press states for clickable cards
 * - `dense` — compact padding for smaller items
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";





