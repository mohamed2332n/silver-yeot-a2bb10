import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import { PageHeader } from "@/components/PageHeader";
import { ReportView } from "@/components/ReportView";

export function TraineeProgressPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("reports.myProgress")} />
      <ReportView traineeId={profile?.id} />
    </div>
  );
}
