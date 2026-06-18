import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import {
  useExercises,
  useSaveExercise,
  useDeleteExercise,
  type ExerciseWithAlternatives,
} from "@/hooks/useExercises";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/types";
import { useLabels } from "@/lib/labels";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { PlusIcon, EditIcon, TrashIcon } from "@/components/icons";

type FormState = {
  name_ar: string;
  name_en: string;
  muscle_group: MuscleGroup;
  equipment: string;
  video_url: string;
  image_url: string;
  instructions: string;
  alternativeIds: string[];
};

const emptyForm: FormState = {
  name_ar: "",
  name_en: "",
  muscle_group: "chest",
  equipment: "",
  video_url: "",
  image_url: "",
  instructions: "",
  alternativeIds: [],
};

export function ExerciseLibraryPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { muscle, exerciseName } = useLabels();
  const coachId = profile?.id;

  const { data: exercises, isLoading } = useExercises(coachId);
  const saveExercise = useSaveExercise(coachId);
  const deleteExercise = useDeleteExercise(coachId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [filter, setFilter] = useState<MuscleGroup | "all">("all");

  const filtered = useMemo(() => {
    if (!exercises) return [];
    return filter === "all"
      ? exercises
      : exercises.filter((e) => e.muscle_group === filter);
  }, [exercises, filter]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (ex: ExerciseWithAlternatives) => {
    setEditingId(ex.id);
    setForm({
      name_ar: ex.name_ar,
      name_en: ex.name_en ?? "",
      muscle_group: ex.muscle_group,
      equipment: ex.equipment ?? "",
      video_url: ex.video_url ?? "",
      image_url: ex.image_url ?? "",
      instructions: ex.instructions ?? "",
      alternativeIds: ex.alternativeIds,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.name_ar.trim()) return;
    await saveExercise.mutateAsync({
      id: editingId ?? undefined,
      values: {
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim() || null,
        muscle_group: form.muscle_group,
        equipment: form.equipment.trim() || null,
        video_url: form.video_url.trim() || null,
        image_url: form.image_url.trim() || null,
        instructions: form.instructions.trim() || null,
      },
      alternativeIds: form.alternativeIds,
    });
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t("library.deleteConfirm"))) {
      await deleteExercise.mutateAsync(id);
    }
  };

  const toggleAlt = (id: string) => {
    setForm((f) => ({
      ...f,
      alternativeIds: f.alternativeIds.includes(id)
        ? f.alternativeIds.filter((x) => x !== id)
        : [...f.alternativeIds, id],
    }));
  };

  return (
    <div>
      <PageHeader
        title={t("library.title")}
        subtitle={t("library.subtitle")}
        action={
          <button className="btn-primary" onClick={openAdd}>
            <PlusIcon />
            <span className="hidden sm:inline">{t("library.addExercise")}</span>
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          {t("common.all")}
        </FilterChip>
        {MUSCLE_GROUPS.map((m) => (
          <FilterChip key={m} active={filter === m} onClick={() => setFilter(m)}>
            {muscle(m)}
          </FilterChip>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10 text-primary">
          <Spinner className="h-7 w-7" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("library.empty")}
          action={
            <button className="btn-primary mt-2" onClick={openAdd}>
              <PlusIcon /> {t("library.addExercise")}
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
            <div key={ex.id} className="card flex gap-3 p-4">
              {ex.image_url ? (
                <img
                  src={ex.image_url}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-xs text-muted">
                  {muscle(ex.muscle_group)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-text">{exerciseName(ex)}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {muscle(ex.muscle_group)}
                  {ex.equipment ? ` · ${ex.equipment}` : ""}
                </p>
                {ex.alternativeIds.length > 0 && (
                  <p className="mt-1 text-xs text-primary">
                    {ex.alternativeIds.length} {t("library.alternatives")}
                  </p>
                )}
                <div className="mt-2 flex gap-1">
                  <button
                    onClick={() => openEdit(ex)}
                    className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-text"
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ex.id)}
                    className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-danger"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? t("library.editExercise") : t("library.addExercise")}
        size="lg"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModalOpen(false)}>
              {t("common.cancel")}
            </button>
            <button className="btn-primary" onClick={submit} disabled={saveExercise.isPending}>
              {saveExercise.isPending ? <Spinner /> : t("common.save")}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t("library.nameAr")}</label>
            <input
              className="input"
              value={form.name_ar}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t("library.nameEn")}</label>
            <input
              className="input"
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              dir="ltr"
            />
          </div>
          <div>
            <label className="label">{t("library.muscleGroup")}</label>
            <select
              className="input"
              value={form.muscle_group}
              onChange={(e) => setForm({ ...form, muscle_group: e.target.value as MuscleGroup })}
            >
              {MUSCLE_GROUPS.map((m) => (
                <option key={m} value={m}>
                  {muscle(m)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t("library.equipment")}</label>
            <input
              className="input"
              value={form.equipment}
              onChange={(e) => setForm({ ...form, equipment: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t("library.videoUrl")}</label>
            <input
              className="input"
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              dir="ltr"
            />
          </div>
          <div>
            <label className="label">{t("library.imageUrl")}</label>
            <input
              className="input"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t("library.instructions")}</label>
            <textarea
              className="input min-h-20"
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t("library.alternatives")}</label>
            <p className="mb-2 text-xs text-muted">{t("library.alternativesHint")}</p>
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-border p-2">
              {(exercises ?? [])
                .filter((e) => e.id !== editingId)
                .map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleAlt(e.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      form.alternativeIds.includes(e.id)
                        ? "bg-primary text-primary-fg"
                        : "bg-surface-2 text-muted hover:text-text"
                    }`}
                  >
                    {exerciseName(e)}
                  </button>
                ))}
              {(exercises ?? []).filter((e) => e.id !== editingId).length === 0 && (
                <span className="px-2 py-1 text-xs text-muted">{t("common.none")}</span>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
