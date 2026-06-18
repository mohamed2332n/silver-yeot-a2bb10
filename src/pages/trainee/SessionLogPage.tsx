import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import {
  useMyActiveProgram,
  useEnsureSession,
  useSessionLogs,
  useLogSet,
  useDeleteSetLog,
  useFinishSession,
  useExerciseAlternatives,
} from "@/hooks/useTraining";
import { useLabels } from "@/lib/labels";
import { todayISO } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { FeelingPicker } from "@/components/FeelingPicker";
import { ChevronIcon, PlusIcon, SwapIcon, TrashIcon } from "@/components/icons";
import type { Exercise, Feeling, ProgramExerciseWithExercise, SetLog } from "@/types";

export function SessionLogPage() {
  const { dayId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const traineeId = profile?.id;

  const { data: program, isLoading } = useMyActiveProgram(traineeId);
  const ensureSession = useEnsureSession(traineeId);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const today = todayISO();

  const day = useMemo(
    () => program?.days.find((d) => d.id === dayId),
    [program, dayId],
  );

  useEffect(() => {
    if (dayId && traineeId && day && !sessionId && !ensureSession.isPending) {
      ensureSession
        .mutateAsync({ programDayId: dayId, date: today })
        .then((s) => setSessionId(s.id))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayId, traineeId, day]);

  const { data: logs } = useSessionLogs(sessionId ?? undefined);
  const finishSession = useFinishSession(traineeId);

  const [finishModal, setFinishModal] = useState(false);
  const [overallFeeling, setOverallFeeling] = useState<Feeling | null>(null);
  const [painFlag, setPainFlag] = useState(false);
  const [notes, setNotes] = useState("");

  const doFinish = async () => {
    if (!sessionId) return;
    await finishSession.mutateAsync({
      sessionId,
      overallFeeling,
      painFlag: painFlag || overallFeeling === "pain",
      notes: notes.trim() || null,
    });
    navigate("/");
  };

  if (isLoading || (!day && !program)) {
    return (
      <div className="flex justify-center py-10 text-primary">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (!day) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-muted">{t("common.error")}</p>
        <Link to="/" className="mt-2 inline-block text-primary">
          {t("common.back")}
        </Link>
      </div>
    );
  }

  const totalSets = logs?.length ?? 0;

  return (
    <div className="mx-auto max-w-2xl pb-4">
      <div className="mb-5 flex items-center gap-2">
        <Link
          to="/"
          className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-text"
        >
          <ChevronIcon className="h-5 w-5 rotate-180 rtl:rotate-0" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-text">
            {t("programs.day")} {day.day_index}
            {day.title ? ` · ${day.title}` : ""}
          </h1>
          <p className="text-xs text-muted">{t("logging.logged", { count: totalSets })}</p>
        </div>
      </div>

      {!sessionId ? (
        <div className="flex justify-center py-10 text-primary">
          <Spinner className="h-7 w-7" />
        </div>
      ) : (
        <div className="space-y-4">
          {day.program_exercises.map((pe) => (
            <ExerciseLogger
              key={pe.id}
              programExercise={pe}
              sessionId={sessionId}
              logs={(logs ?? []).filter((l) => l.program_exercise_id === pe.id)}
            />
          ))}

          <button className="btn-primary w-full" onClick={() => setFinishModal(true)}>
            {t("logging.finishSession")}
          </button>
        </div>
      )}

      <Modal
        open={finishModal}
        onClose={() => setFinishModal(false)}
        title={t("logging.finishSession")}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setFinishModal(false)}>
              {t("common.cancel")}
            </button>
            <button className="btn-primary" onClick={doFinish} disabled={finishSession.isPending}>
              {finishSession.isPending ? <Spinner /> : t("common.save")}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">{t("logging.overallFeeling")}</label>
            <FeelingPicker value={overallFeeling} onChange={setOverallFeeling} />
          </div>
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={painFlag}
              onChange={(e) => setPainFlag(e.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--c-danger))]"
            />
            {t("logging.anyPain")}
          </label>
          <div>
            <label className="label">{t("logging.sessionNotes")}</label>
            <textarea
              className="input min-h-20"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ExerciseLogger({
  programExercise,
  sessionId,
  logs,
}: {
  programExercise: ProgramExerciseWithExercise;
  sessionId: string;
  logs: SetLog[];
}) {
  const { t } = useTranslation();
  const { exerciseName, muscle } = useLabels();
  const logSet = useLogSet(sessionId);
  const deleteSet = useDeleteSetLog(sessionId);

  const original = programExercise.exercise;
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(original);
  const [swapOpen, setSwapOpen] = useState(false);

  const [weight, setWeight] = useState(
    programExercise.target_weight != null ? String(programExercise.target_weight) : "",
  );
  const [reps, setReps] = useState(
    programExercise.target_reps != null ? String(programExercise.target_reps) : "",
  );
  const [rest, setRest] = useState(
    programExercise.rest_seconds != null ? String(programExercise.rest_seconds) : "",
  );
  const [condition, setCondition] = useState<Feeling | null>(null);

  const isSwapped = activeExercise?.id !== original?.id;

  const addSet = async () => {
    if (!activeExercise || !original) return;
    await logSet.mutateAsync({
      programExerciseId: programExercise.id,
      exerciseId: activeExercise.id,
      usedAlternativeId: isSwapped ? activeExercise.id : null,
      setNumber: logs.length + 1,
      weight: weight ? Number(weight) : null,
      reps: reps ? Number(reps) : null,
      restTaken: rest ? Number(rest) : null,
      condition,
    });
    setCondition(null);
  };

  const target = [
    programExercise.target_sets != null ? `${programExercise.target_sets} ${t("common.sets")}` : null,
    programExercise.target_reps != null ? `${programExercise.target_reps} ${t("common.reps")}` : null,
    programExercise.target_weight != null ? `${programExercise.target_weight} ${t("common.kg")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border bg-surface-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-text">
              {exerciseName(activeExercise)}
              {isSwapped && (
                <span className="ms-2 rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning">
                  {t("logging.swapExercise")}
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {activeExercise ? muscle(activeExercise.muscle_group) : ""}
              {target ? ` · ${t("logging.target")}: ${target}` : ""}
            </p>
          </div>
          <button
            onClick={() => setSwapOpen(true)}
            className="btn-ghost shrink-0 px-2.5 py-1.5 text-xs"
          >
            <SwapIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t("logging.swapExercise")}</span>
          </button>
        </div>
        {activeExercise?.video_url && (
          <a
            href={activeExercise.video_url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-xs text-primary hover:underline"
          >
            {t("library.videoUrl")}
          </a>
        )}
      </div>

      {/* logged sets */}
      {logs.length > 0 && (
        <div className="divide-y divide-border">
          {logs.map((l, idx) => (
            <div key={l.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
              <span className="text-muted">
                {t("logging.set")} {idx + 1}
              </span>
              <span className="flex-1 px-2 text-text">
                {l.weight ?? "-"} {t("common.kg")} × {l.reps ?? "-"}
                {l.rest_taken != null ? ` · ${l.rest_taken}${t("common.sec")}` : ""}
              </span>
              <button
                onClick={() => deleteSet.mutate(l.id)}
                className="rounded-lg p-1 text-muted transition hover:text-danger"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* add set form */}
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted">{t("logging.weightKg")}</label>
            <input
              className="input text-center"
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">{t("logging.repsCount")}</label>
            <input
              className="input text-center"
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">{t("logging.restSec")}</label>
            <input
              className="input text-center"
              type="number"
              inputMode="numeric"
              value={rest}
              onChange={(e) => setRest(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">{t("logging.condition")}</label>
          <FeelingPicker value={condition} onChange={setCondition} />
        </div>
        <button className="btn-outline w-full" onClick={addSet} disabled={logSet.isPending}>
          {logSet.isPending ? <Spinner /> : <><PlusIcon className="h-4 w-4" /> {t("logging.addSet")}</>}
        </button>
      </div>

      {swapOpen && original && (
        <SwapModal
          open
          exerciseId={original.id}
          exerciseName={exerciseName(original)}
          onClose={() => setSwapOpen(false)}
          onPick={(ex) => {
            setActiveExercise(ex);
            setSwapOpen(false);
          }}
          onResetToOriginal={() => {
            setActiveExercise(original);
            setSwapOpen(false);
          }}
        />
      )}
    </div>
  );
}

function SwapModal({
  open,
  exerciseId,
  exerciseName,
  onClose,
  onPick,
  onResetToOriginal,
}: {
  open: boolean;
  exerciseId: string;
  exerciseName: string;
  onClose: () => void;
  onPick: (ex: Exercise) => void;
  onResetToOriginal: () => void;
}) {
  const { t } = useTranslation();
  const { exerciseName: nameOf, muscle } = useLabels();
  const { data: alternatives, isLoading } = useExerciseAlternatives(exerciseId);

  return (
    <Modal open={open} onClose={onClose} title={t("logging.alternativesFor", { name: exerciseName })}>
      {isLoading ? (
        <div className="flex justify-center py-6 text-primary">
          <Spinner />
        </div>
      ) : (alternatives ?? []).length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">{t("logging.noAlternatives")}</p>
      ) : (
        <div className="space-y-2">
          {(alternatives ?? []).map((ex) => (
            <div key={ex.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">{nameOf(ex)}</p>
                <p className="text-xs text-muted">
                  {muscle(ex.muscle_group)}
                  {ex.equipment ? ` · ${ex.equipment}` : ""}
                </p>
              </div>
              <button className="btn-primary shrink-0 px-3 py-1.5 text-xs" onClick={() => onPick(ex)}>
                {t("logging.useThis")}
              </button>
            </div>
          ))}
        </div>
      )}
      <button className="btn-ghost mt-3 w-full" onClick={onResetToOriginal}>
        {exerciseName}
      </button>
    </Modal>
  );
}
