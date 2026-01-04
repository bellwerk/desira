import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type GlassButtonVariant = "primary" | "secondary" | "ghost";
type GlassButtonSize = "sm" | "md" | "lg";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  children: ReactNode;
  loading?: boolean;
}

const variantClasses: Record<GlassButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-lg hover:from-rose-600 hover:to-orange-500 hover:shadow-xl active:scale-[0.98]",
  secondary:
    "glass-1 text-slate-800 dark:text-slate-100 hover:bg-white/80 dark:hover:bg-white/10 active:scale-[0.98]",
  ghost:
    "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10 active:scale-[0.98]",
};

const sizeClasses: Record<GlassButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-2xl gap-2",
  lg: "px-6 py-3 text-base rounded-2xl gap-2.5",
};

/**
 * GlassButton — primary action buttons
 *
 * Variants:
 * - `primary` — accent-tinted gradient, main CTAs
 * - `secondary` — glass background, secondary actions
 * - `ghost` — text/icon only, subtle hover wash
 */
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      className = "",
      children,
      disabled,
      loading,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-medium transition-all duration-150
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${disabled || loading ? "opacity-50 cursor-not-allowed hover:scale-100" : ""}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";





