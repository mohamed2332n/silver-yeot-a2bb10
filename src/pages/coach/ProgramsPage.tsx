import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import {
  usePrograms,
  useSaveProgram,
  useDeleteProgram,
} from "@/hooks/usePrograms";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { PlusIcon, TrashIcon, ChevronIcon } from "@/components/icons";

export function ProgramsPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const coachId = profile?.id;

  const { data: programs, isLoading } = usePrograms(coachId);
  const saveProgram = useSaveProgram(coachId);
  const deleteProgram = useDeleteProgram(coachId);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const submit = async () => {
    if (!name.trim()) return;
    await saveProgram.mutateAsync({ name: name.trim(), description: description.trim() || null });
    setName("");
    setDescription("");
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t("programs.deleteConfirm"))) {
      await deleteProgram.mutateAsync(id);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("programs.title")}
        subtitle={t("programs.subtitle")}
        action={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <PlusIcon />
            <span className="hidden sm:inline">{t("programs.addProgram")}</span>
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-10 text-primary">
          <Spinner className="h-7 w-7" />
        </div>
      ) : (programs ?? []).length === 0 ? (
        <EmptyState
          title={t("programs.empty")}
          action={
            <button className="btn-primary mt-2" onClick={() => setModalOpen(true)}>
              <PlusIcon /> {t("programs.addProgram")}
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(programs ?? []).map((p) => (
            <div key={p.id} className="card flex items-center gap-2 p-4">
              <Link to={`/programs/${p.id}`} className="min-w-0 flex-1">
                <p className="truncate font-semibold text-text">{p.name}</p>
                {p.description && (
                  <p className="mt-0.5 truncate text-xs text-muted">{p.description}</p>
                )}
              </Link>
              <button
                onClick={() => handleDelete(p.id)}
                className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-danger"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              <Link
                to={`/programs/${p.id}`}
                className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-text rtl:rotate-180"
              >
                <ChevronIcon className="h-5 w-5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t("programs.addProgram")}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModalOpen(false)}>
              {t("common.cancel")}
            </button>
            <button className="btn-primary" onClick={submit} disabled={saveProgram.isPending}>
              {saveProgram.isPending ? <Spinner /> : t("common.create")}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">{t("programs.programName")}</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">{t("programs.description")}</label>
            <textarea
              className="input min-h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
