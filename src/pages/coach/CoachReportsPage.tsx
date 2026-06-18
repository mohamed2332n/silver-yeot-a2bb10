import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import { useTrainees } from "@/hooks/useTrainees";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { ReportView } from "@/components/ReportView";
import { Spinner } from "@/components/ui/Spinner";

export function CoachReportsPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { data: trainees, isLoading } = useTrainees(profile?.id);
  const [selected, setSelected] = useState<string>("");

  const activeId = selected || trainees?.[0]?.id;

  return (
    <div>
      <PageHeader title={t("reports.title")} />

      {isLoading ? (
        <div className="flex justify-center py-10 text-primary">
          <Spinner className="h-7 w-7" />
        </div>
      ) : (trainees ?? []).length === 0 ? (
        <EmptyState title={t("trainees.empty")} />
      ) : (
        <>
          <div className="mb-4">
            <label className="label">{t("reports.selectTrainee")}</label>
            <select
              className="input max-w-xs"
              value={activeId}
              onChange={(e) => setSelected(e.target.value)}
            >
              {(trainees ?? []).map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.full_name}
                </option>
              ))}
            </select>
          </div>
          <ReportView traineeId={activeId} />
        </>
      )}
    </div>
  );
}
