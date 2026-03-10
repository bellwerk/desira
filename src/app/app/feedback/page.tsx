import { GlassCard } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import { BugReportForm } from "./BugReportForm";

export const dynamic = "force-dynamic";

export default function FeedbackPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-12 pt-2">
      <PageHeader
        backHref="/app/settings"
        backLabel="Back to settings"
        title="Report a bug"
        subtitle="Tell us what happened and where it happened."
      />

      <GlassCard className="rounded-[24px] p-5 sm:p-6">
        <BugReportForm />
      </GlassCard>
    </div>
  );
}
