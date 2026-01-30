"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> {
  /** Label text displayed next to toggle */
  label: string;
  /** Helper text displayed below label */
  helperText?: string;
  /** Controlled checked state */
  checked: boolean;
  /** Callback when toggle state changes */
  onCheckedChange: (checked: boolean) => void;
}

/**
 * Toggle — accessible switch component
 *
 * Features:
 * - Keyboard accessible (Space/Enter to toggle)
 * - Screen reader friendly with proper ARIA
 * - Consistent styling with design system
 */
export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, helperText, checked, onCheckedChange, name, disabled, className = "", ...props }, ref) => {
    const id = useId();

    return (
      <div className={`flex items-center justify-between py-2 ${className}`}>
        <div className="flex-1 min-w-0 pr-4">
          <label
            htmlFor={id}
            className={`block text-sm font-medium ${
              disabled ? "text-gray-400 dark:text-gray-500" : "text-[var(--text-primary)] dark:text-white"
            }`}
          >
            {label}
          </label>
          {helperText && (
            <p
              id={`${id}-description`}
              className={`mt-0.5 text-xs ${
                disabled ? "text-gray-300 dark:text-gray-600" : "text-[var(--text-secondary)] dark:text-white/60"
              }`}
            >
              {helperText}
            </p>
          )}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-describedby={helperText ? `${id}-description` : undefined}
          disabled={disabled}
          onClick={() => onCheckedChange(!checked)}
          className={`
            relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
            transition-colors duration-200 ease-in-out
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9d8df1]/50
            ${disabled ? "cursor-not-allowed opacity-50" : ""}
            ${checked ? "bg-[#9D8DF1]" : "bg-gray-200 dark:bg-[#4a4a4a]"}
          `}
        >
          <span className="sr-only">{label}</span>
          <span
            aria-hidden="true"
            className={`
              pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm
              ring-0 transition-transform duration-200 ease-in-out
              ${checked ? "translate-x-5" : "translate-x-0.5"}
            `}
          />
        </button>

        {/* Hidden input for form submission */}
        <input
          ref={ref}
          type="checkbox"
          id={id}
          name={name}
          value="true"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          {...props}
        />
      </div>
    );
  }
);

Toggle.displayName = "Toggle";
