import type { ReactNode } from "react";

type IconButtonVariant = "default" | "danger";

type IconButtonProps = {
  icon: ReactNode;
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: IconButtonVariant;
  className?: string;
};

const variantClasses: Record<IconButtonVariant, string> = {
  default:
    "border border-[#2b2b2b] bg-transparent hover:bg-[#2b2b2b]/5",
  danger:
    "border border-[#2b2b2b] bg-transparent hover:border-red-500 hover:bg-red-50",
};

export function IconButton({
  icon,
  label,
  onClick,
  disabled = false,
  variant = "default",
  className = "",
}: IconButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
    >
      {icon}
    </button>
  );
}
