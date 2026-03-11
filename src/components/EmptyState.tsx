import type { ReactNode } from "react";
import { GlassCard } from "@/components/ui";

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps): React.ReactElement {
  return (
    <GlassCard className={`rounded-2xl px-5 py-10 text-center sm:px-10 sm:py-14 ${className}`}>
      {icon && <div className="mx-auto mb-6">{icon}</div>}
      <h3 className="font-asul text-3xl font-medium text-[#2b2b2b]">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm text-[#4f4f4f]">{description}</p>
      )}
      {action && <div className="mt-8">{action}</div>}
    </GlassCard>
  );
}

