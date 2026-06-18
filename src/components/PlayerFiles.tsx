import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import {
  usePlayerFiles,
  useUploadPlayerFile,
  useDeletePlayerFile,
  getSignedFileUrl,
} from "@/hooks/usePlayerFiles";
import { PLAYER_FILE_KINDS, type PlayerFileKind } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { TrashIcon, PlusIcon } from "@/components/icons";
import { formatDate } from "@/lib/format";

export function PlayerFiles({
  traineeId,
  readOnly = false,
}: {
  traineeId: string | undefined;
  readOnly?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: files, isLoading } = usePlayerFiles(traineeId);
  const upload = useUploadPlayerFile(traineeId, user?.id);
  const remove = useDeletePlayerFile(traineeId);

  const [kind, setKind] = useState<PlayerFileKind>("medical");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await upload.mutateAsync({ file, kind, description });
      setDescription("");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const openFile = async (filePath: string) => {
    const url = await getSignedFileUrl(filePath);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const kindLabel = (k: PlayerFileKind) => t(`files.kind.${k}`);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text">{t("files.title")}</h3>

      {!readOnly && (
        <div className="card space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">{t("files.kindLabel")}</label>
              <select
                className="input"
                value={kind}
                onChange={(e) => setKind(e.target.value as PlayerFileKind)}
              >
                {PLAYER_FILE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {kindLabel(k)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("files.description")}</label>
              <input
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("files.descriptionPlaceholder")}
              />
            </div>
          </div>
          <label className="btn-outline cursor-pointer">
            {uploading ? <Spinner /> : <PlusIcon className="h-4 w-4" />}
            {t("files.upload")}
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFile}
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-muted">{t("files.uploadHint")}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6 text-primary">
          <Spinner />
        </div>
      ) : (files ?? []).length === 0 ? (
        <p className="card p-4 text-center text-sm text-muted">{t("files.empty")}</p>
      ) : (
        <div className="space-y-2">
          {(files ?? []).map((f) => (
            <div
              key={f.id}
              className="card flex items-center justify-between gap-3 p-3.5"
            >
              <button
                type="button"
                onClick={() => openFile(f.file_path)}
                className="min-w-0 flex-1 text-start"
              >
                <p className="truncate text-sm font-medium text-text">{f.file_name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {kindLabel(f.kind)}
                  {f.description ? ` · ${f.description}` : ""}
                  {" · "}
                  {formatDate(f.created_at, i18n.language)}
                </p>
              </button>
              {!readOnly && (
                <button
                  onClick={() => remove.mutate(f)}
                  className="rounded-lg p-1.5 text-muted transition hover:text-danger"
                  disabled={remove.isPending}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
