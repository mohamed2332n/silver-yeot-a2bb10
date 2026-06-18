import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import { useUpdateClub } from "@/hooks/useClub";
import { PageHeader } from "@/components/PageHeader";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { JoinCodeCard } from "@/components/JoinCodeCard";

export function ClubSettingsPage() {
  const { t } = useTranslation();
  const { profile, club, refresh } = useAuth();
  const update = useUpdateClub(profile?.id);

  const [clubName, setClubName] = useState(club?.club_name ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const save = async () => {
    await update.mutateAsync({ clubName: clubName.trim(), logoFile });
    await refresh();
    setLogoFile(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="max-w-xl">
      <PageHeader title={t("club.title")} subtitle={t("club.subtitle")} />

      <div className="card space-y-5 p-5">
        <div className="flex items-center gap-4">
          {preview ? (
            <img src={preview} alt="" className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            <Logo club={club} size={64} />
          )}
          <label className="btn-outline cursor-pointer">
            {t("club.uploadLogo")}
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
        </div>

        <div>
          <label className="label">{t("club.clubName")}</label>
          <input className="input" value={clubName} onChange={(e) => setClubName(e.target.value)} />
        </div>

        <button className="btn-primary" onClick={save} disabled={update.isPending}>
          {update.isPending ? <Spinner /> : saved ? t("common.saved") : t("club.save")}
        </button>
      </div>

      <div className="mt-4">
        <JoinCodeCard club={club} />
      </div>
    </div>
  );
}
