import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useMyActiveProgram } from "@/hooks/useTraining";
import { useBodyMetrics, useAddBodyMetric } from "@/hooks/useTraining";
import { Logo } from "@/components/Logo";
import { EmptyState } from "@/components/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { CalendarIcon, ChevronIcon } from "@/components/icons";

export function TraineeHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, club, refresh } = useAuth();

  const { data: program, isLoading } = useMyActiveProgram(profile?.id);
  const { data: metrics } = useBodyMetrics(profile?.id);
  const addWeight = useAddBodyMetric(profile?.id);

  const [weight, setWeight] = useState("");
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [weightSaved, setWeightSaved] = useState(false);

  const latestWeight = metrics && metrics.length > 0 ? metrics[metrics.length - 1].body_weight : null;

  const redeem = async () => {
    if (!code.trim()) return;
    setRedeeming(true);
    setCodeError(false);
    const { data, error } = await supabase.rpc("redeem_join_code", { p_code: code });
    setRedeeming(false);
    if (error || !data) {
      setCodeError(true);
      return;
    }
    await refresh();
  };

  const saveWeight = async () => {
    const value = Number(weight);
    if (!value) return;
    await addWeight.mutateAsync(value);
    setWeight("");
    setWeightSaved(true);
    setTimeout(() => setWeightSaved(false), 1500);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Welcome */}
      <div className="card mb-4 flex items-center gap-4 p-5">
        <Logo club={club} size={56} />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-text">
            {t("home.welcome", { name: profile?.full_name ?? "" })}
          </h1>
          {club && (
            <p className="truncate text-sm text-muted">
              {t("home.withCoach", { club: club.club_name })}
            </p>
          )}
        </div>
      </div>

      {/* Join code prompt if not linked */}
      {!profile?.coach_id && (
        <div className="card mb-4 space-y-3 p-5">
          <p className="text-sm font-semibold text-text">{t("auth.joinCode")}</p>
          <p className="text-xs text-muted">{t("auth.joinCodeHint")}</p>
          {codeError && <p className="text-xs text-danger">{t("common.error")}</p>}
          <div className="flex gap-2">
            <input
              className="input uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              dir="ltr"
              maxLength={6}
            />
            <button className="btn-primary shrink-0" onClick={redeem} disabled={redeeming}>
              {redeeming ? <Spinner /> : t("common.confirm")}
            </button>
          </div>
        </div>
      )}

      {/* Body weight quick log */}
      <div className="card mb-4 p-5">
        <p className="mb-2 text-sm font-semibold text-text">{t("home.logBodyWeight")}</p>
        {latestWeight != null && (
          <p className="mb-2 text-xs text-muted">
            {t("trainees.bodyWeight")}: <span className="font-semibold text-text">{latestWeight}</span> {t("common.kg")}
          </p>
        )}
        <div className="flex gap-2">
          <input
            className="input"
            type="number"
            inputMode="decimal"
            placeholder={t("logging.weightKg")}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <button className="btn-primary shrink-0" onClick={saveWeight} disabled={addWeight.isPending}>
            {addWeight.isPending ? <Spinner /> : weightSaved ? t("common.saved") : t("common.save")}
          </button>
        </div>
      </div>

      {/* Today / program days */}
      <h2 className="mb-2 text-sm font-semibold text-text">{t("home.pickDay")}</h2>
      {isLoading ? (
        <div className="flex justify-center py-10 text-primary">
          <Spinner className="h-7 w-7" />
        </div>
      ) : !program || program.days.length === 0 ? (
        <EmptyState title={t("home.noProgram")} description={t("home.noProgramDesc")} />
      ) : (
        <div className="space-y-2">
          {program.days.map((day) => (
            <button
              key={day.id}
              onClick={() => navigate(`/session/${day.id}`)}
              className="card flex w-full items-center gap-3 p-4 text-start transition hover:border-primary/40"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <CalendarIcon />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-text">
                  {t("programs.day")} {day.day_index}
                  {day.title ? ` · ${day.title}` : ""}
                </p>
                <p className="text-xs text-muted">
                  {day.program_exercises.length} {t("common.exercises")}
                </p>
              </div>
              <ChevronIcon className="h-5 w-5 shrink-0 text-muted rtl:rotate-180" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
