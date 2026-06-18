import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Club } from "@/types";

export function JoinCodeCard({ club }: { club: Club | null }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!club) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(club.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="card flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text">{t("trainees.inviteTitle")}</p>
        <p className="mt-0.5 text-xs text-muted">{t("trainees.inviteHint")}</p>
      </div>
      <button
        onClick={copy}
        className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5"
      >
        <span className="font-mono text-lg font-bold tracking-widest text-primary" dir="ltr">
          {club.join_code}
        </span>
        <span className="text-xs text-muted">{copied ? t("common.copied") : t("common.copy")}</span>
      </button>
    </div>
  );
}
