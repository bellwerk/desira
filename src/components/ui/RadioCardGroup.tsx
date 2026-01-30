import { useId, type ReactNode } from "react";

interface RadioCardOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface RadioCardGroupProps<T extends string> {
  /** Group label for accessibility */
  label: string;
  /** Form field name */
  name: string;
  /** Available options */
  options: RadioCardOption<T>[];
  /** Currently selected value */
  value: T;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Number of columns (responsive) */
  columns?: 2 | 3 | 4;
  /** Additional CSS classes */
  className?: string;
}

/**
 * RadioCardGroup — accessible radio button group with card styling
 *
 * Features:
 * - Keyboard navigation (arrow keys)
 * - Screen reader friendly with proper ARIA
 * - Visual selection indicator
 */
export function RadioCardGroup<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
  columns = 3,
  className = "",
}: RadioCardGroupProps<T>): React.ReactElement {
  const groupId = useId();

  const columnClasses: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  };

  return (
    <fieldset className={className}>
      <legend className="block text-sm font-medium text-[var(--text-primary)] mb-2">
        {label}
      </legend>
      <div
        className={`grid gap-2 ${columnClasses[columns]}`}
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const optionId = `${groupId}-${option.value}`;

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={`
                relative flex cursor-pointer flex-col rounded-2xl border p-3
                transition-all duration-150
                focus-within:ring-2 focus-within:ring-[var(--primary)] focus-within:ring-offset-1
                ${
                  isSelected
                    ? "border-[#9D8DF1] bg-[#9D8DF1]/10"
                    : "border-[var(--border-color)] bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {option.icon && (
                    <span className="shrink-0 text-[var(--text-secondary)]">
                      {option.icon}
                    </span>
                  )}
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {option.label}
                  </span>
                </div>
                {isSelected && (
                  <svg
                    className="h-4 w-4 shrink-0 text-[#9D8DF1]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              {option.description && (
                <span className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {option.description}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
