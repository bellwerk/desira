import { useId } from "react";

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  badge?: string;
}

interface SegmentedControlProps<T extends string> {
  /** Group label for accessibility */
  label: string;
  /** Form field name */
  name: string;
  /** Available options */
  options: SegmentOption<T>[];
  /** Currently selected value */
  value: T;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Helper text displayed below control */
  helperText?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SegmentedControl — pill-style toggle between options
 *
 * Features:
 * - Keyboard accessible
 * - Smooth transition animation
 * - Optional helper text that updates with selection
 */
export function SegmentedControl<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
  helperText,
  className = "",
}: SegmentedControlProps<T>): React.ReactElement {
  const groupId = useId();

  return (
    <fieldset className={className}>
      <legend className="block text-sm font-medium text-[var(--text-primary)] mb-2">
        {label}
      </legend>

      <div
        className="inline-flex rounded-full border border-[var(--border-color)] bg-gray-50/50 p-1"
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const optionId = `${groupId}-${option.value}`;

          return (
            <button
              key={option.value}
              id={optionId}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              className={`
                rounded-full px-4 py-2 text-sm font-medium
                transition-all duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1
                ${
                  isSelected
                    ? "bg-white text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }
              `}
            >
              {option.label}
              {option.badge && !isSelected && (
                <span className="ml-1 text-xs text-[var(--text-muted)]">
                  {option.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value} />

      {helperText && (
        <p className="mt-2 text-xs text-[var(--text-secondary)]">{helperText}</p>
      )}
    </fieldset>
  );
}
