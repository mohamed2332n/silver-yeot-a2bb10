import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import { useProgram, useProgramMutations } from "@/hooks/usePrograms";
import { useExercises } from "@/hooks/useExercises";
import { useLabels } from "@/lib/labels";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { PlusIcon, TrashIcon, ChevronIcon } from "@/components/icons";
import type { ProgramDayWithExercises } from "@/types";

export function ProgramBuilderPage() {
  const { programId } = useParams();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { exerciseName } = useLabels();

  const { data: program, isLoading } = useProgram(programId);
  const { data: exercises } = useExercises(profile?.id);
  const mut = useProgramMutations(programId);

  const [dayModal, setDayModal] = useState(false);
  const [dayTitle, setDayTitle] = useState("");
  const [exModal, setExModal] = useState<{ dayId: string } | null>(null);

  const addDay = async () => {
    const nextIndex = (program?.days.length ?? 0) + 1;
    await mut.addDay.mutateAsync({ dayIndex: nextIndex, title: dayTitle.trim() || `${t("programs.day")} ${nextIndex}` });
    setDayTitle("");
    setDayModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10 text-primary">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (!program) {
    return <p className="text-muted">{t("common.error")}</p>;
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        <Link
          to="/programs"
          className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-text rtl:rotate-180"
        >
          <ChevronIcon className="h-5 w-5 rotate-180 rtl:rotate-0" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-text lg:text-2xl">{program.name}</h1>
          {program.description && (
            <p className="truncate text-sm text-muted">{program.description}</p>
          )}
        </div>
        <button className="btn-primary" onClick={() => setDayModal(true)}>
          <PlusIcon />
          <span className="hidden sm:inline">{t("programs.addDay")}</span>
        </button>
      </div>

      {program.days.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">{t("programs.noDays")}</div>
      ) : (
        <div className="space-y-4">
          {program.days.map((day) => (
            <DayCard
              key={day.id}
              day={day}
              onAddExercise={() => setExModal({ dayId: day.id })}
              onDeleteDay={() => mut.deleteDay.mutate(day.id)}
              onRemoveExercise={(id) => mut.removeExercise.mutate(id)}
              exerciseName={exerciseName}
            />
          ))}
        </div>
      )}

      {/* Add day modal */}
      <Modal
        open={dayModal}
        onClose={() => setDayModal(false)}
        title={t("programs.addDay")}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setDayModal(false)}>
              {t("common.cancel")}
            </button>
            <button className="btn-primary" onClick={addDay} disabled={mut.addDay.isPending}>
              {mut.addDay.isPending ? <Spinner /> : t("common.add")}
            </button>
          </>
        }
      >
        <label className="label">{t("programs.dayTitle")}</label>
        <input className="input" value={dayTitle} onChange={(e) => setDayTitle(e.target.value)} />
      </Modal>

      {/* Add exercise modal */}
      {exModal && (
        <AddExerciseModal
          open
          onClose={() => setExModal(null)}
          dayId={exModal.dayId}
          exercises={exercises ?? []}
          position={
            (program.days.find((d) => d.id === exModal.dayId)?.program_exercises.length ?? 0) + 1
          }
          onAdd={async (values) => {
            await mut.addExercise.mutateAsync(values);
            setExModal(null);
          }}
          pending={mut.addExercise.isPending}
        />
      )}
    </div>
  );
}

function DayCard({
  day,
  onAddExercise,
  onDeleteDay,
  onRemoveExercise,
  exerciseName,
}: {
  day: ProgramDayWithExercises;
  onAddExercise: () => void;
  onDeleteDay: () => void;
  onRemoveExercise: (id: string) => void;
  exerciseName: (ex: { name_ar: string; name_en: string | null } | null) => string;
}) {
  const { t } = useTranslation();
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-2 px-4 py-3">
        <p className="font-semibold text-text">
          {t("programs.day")} {day.day_index}
          {day.title ? ` · ${day.title}` : ""}
        </p>
        <div className="flex gap-1">
          <button onClick={onAddExercise} className="btn-ghost px-2.5 py-1.5 text-xs">
            <PlusIcon className="h-4 w-4" /> {t("programs.addExerciseToDay")}
          </button>
          <button
            onClick={onDeleteDay}
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-danger"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {day.program_exercises.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted">{t("programs.noExercisesInDay")}</p>
      ) : (
        <div className="divide-y divide-border">
          {day.program_exercises.map((pe) => (
            <div key={pe.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">
                  {exerciseName(pe.exercise)}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {[
                    pe.target_sets != null ? `${pe.target_sets} ${t("common.sets")}` : null,
                    pe.target_reps != null ? `${pe.target_reps} ${t("common.reps")}` : null,
                    pe.target_weight != null ? `${pe.target_weight} ${t("common.kg")}` : null,
                    pe.rest_seconds != null ? `${pe.rest_seconds}${t("common.sec")} ${t("common.rest")}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <button
                onClick={() => onRemoveExercise(pe.id)}
                className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-danger"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddExerciseModal({
  open,
  onClose,
  dayId,
  exercises,
  position,
  onAdd,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  dayId: string;
  exercises: { id: string; name_ar: string; name_en: string | null }[];
  position: number;
  onAdd: (values: {
    program_day_id: string;
    exercise_id: string;
    position: number;
    target_sets: number | null;
    target_reps: number | null;
    target_weight: number | null;
    rest_seconds: number | null;
    notes: string | null;
  }) => Promise<void>;
  pending: boolean;
}) {
  const { t } = useTranslation();
  const { exerciseName } = useLabels();
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? "");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("12");
  const [weight, setWeight] = useState("");
  const [rest, setRest] = useState("90");
  const [notes, setNotes] = useState("");

  const submit = async () => {
    if (!exerciseId) return;
    await onAdd({
      program_day_id: dayId,
      exercise_id: exerciseId,
      position,
      target_sets: sets ? Number(sets) : null,
      target_reps: reps ? Number(reps) : null,
      target_weight: weight ? Number(weight) : null,
      rest_seconds: rest ? Number(rest) : null,
      notes: notes.trim() || null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("programs.addExerciseToDay")}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button className="btn-primary" onClick={submit} disabled={pending || !exerciseId}>
            {pending ? <Spinner /> : t("common.add")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">{t("programs.selectExercise")}</label>
          <select
            className="input"
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
          >
            {exercises.length === 0 && <option value="">{t("library.empty")}</option>}
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {exerciseName(ex)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="label">{t("programs.targetSets")}</label>
            <input className="input" type="number" value={sets} onChange={(e) => setSets(e.target.value)} />
          </div>
          <div>
            <label className="label">{t("programs.targetReps")}</label>
            <input className="input" type="number" value={reps} onChange={(e) => setReps(e.target.value)} />
          </div>
          <div>
            <label className="label">{t("programs.targetWeight")}</label>
            <input className="input" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div>
            <label className="label">{t("programs.restSeconds")}</label>
            <input className="input" type="number" value={rest} onChange={(e) => setRest(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">{t("common.notes")}</label>
          <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
