import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import {
  useTrainee,
  useTraineePrograms,
  useAssignProgram,
  useUnassignProgram,
} from "@/hooks/useTrainees";
import { usePrograms } from "@/hooks/usePrograms";
import { ReportView } from "@/components/ReportView";
import { AIChat } from "@/components/AIChat";
import { PlayerFiles } from "@/components/PlayerFiles";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { ChevronIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { formatDate } from "@/lib/format";

export function TraineeDetailPage() {
  const { traineeId } = useParams();
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();

  const { data: trainee, isLoading } = useTrainee(traineeId);
  const { data: assigned } = useTraineePrograms(traineeId);
  const { data: programs } = usePrograms(profile?.id);
  const assign = useAssignProgram(traineeId);
  const unassign = useUnassignProgram(traineeId);

  const [assignModal, setAssignModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("");

  if (isLoading) {
    return (
      <div className="flex justify-center py-10 text-primary">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (!trainee) return <p className="text-muted">{t("common.error")}</p>;

  const doAssign = async () => {
    if (!selectedProgram) return;
    await assign.mutateAsync(selectedProgram);
    setSelectedProgram("");
    setAssignModal(false);
  };

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        <Link
          to="/trainees"
          className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-text"
        >
          <ChevronIcon className="h-5 w-5 rotate-180 rtl:rotate-0" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
            {(trainee.full_name ?? "?").trim()[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">{trainee.full_name}</h1>
            <p className="text-xs text-muted" dir="ltr">
              {trainee.email}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">{t("trainees.assignedPrograms")}</h2>
          <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setAssignModal(true)}>
            <PlusIcon className="h-4 w-4" /> {t("trainees.assignProgram")}
          </button>
        </div>
        {(assigned ?? []).length === 0 ? (
          <p className="card p-4 text-center text-sm text-muted">{t("trainees.noAssigned")}</p>
        ) : (
          <div className="space-y-2">
            {(assigned ?? []).map((a) => (
              <div key={a.id} className="card flex items-center justify-between gap-2 p-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">{a.program.name}</p>
                  <p className="text-xs text-muted">{formatDate(a.start_date, i18n.language)}</p>
                </div>
                <button
                  onClick={() => unassign.mutate(a.id)}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-danger"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <h2 className="text-sm font-semibold text-text">{t("ai.coachAnalysis")}</h2>
        {traineeId && <AIChat mode="coach" targetTraineeId={traineeId} />}
      </div>

      <div className="mb-6">
        <PlayerFiles traineeId={traineeId} readOnly />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-text">{t("reports.title")}</h2>
      <ReportView traineeId={traineeId} />

      <Modal
        open={assignModal}
        onClose={() => setAssignModal(false)}
        title={t("trainees.assignProgram")}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setAssignModal(false)}>
              {t("common.cancel")}
            </button>
            <button className="btn-primary" onClick={doAssign} disabled={assign.isPending || !selectedProgram}>
              {assign.isPending ? <Spinner /> : t("trainees.assign")}
            </button>
          </>
        }
      >
        <label className="label">{t("programs.title")}</label>
        <select
          className="input"
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value)}
        >
          <option value="">--</option>
          {(programs ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Modal>
    </div>
  );
}
