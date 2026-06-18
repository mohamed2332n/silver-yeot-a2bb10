import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import { useTrainees } from "@/hooks/useTrainees";
import { usePrograms } from "@/hooks/usePrograms";
import { useExercises } from "@/hooks/useExercises";
import { PageHeader } from "@/components/PageHeader";
import { JoinCodeCard } from "@/components/JoinCodeCard";
import { AlertIcon, DumbbellIcon, CalendarIcon, UsersIcon, ChevronIcon } from "@/components/icons";
import { formatDate } from "@/lib/format";

function StatLink({
  to,
  icon,
  label,
  value,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Link to={to} className="card flex items-center gap-3 p-4 transition hover:border-primary/40">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-text">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </Link>
  );
}

export function CoachDashboard() {
  const { t, i18n } = useTranslation();
  const { profile, club } = useAuth();

  const { data: trainees } = useTrainees(profile?.id);
  const { data: programs } = usePrograms(profile?.id);
  const { data: exercises } = useExercises(profile?.id);

  const painTrainees = (trainees ?? []).filter((tr) => tr.recentPain);

  return (
    <div>
      <PageHeader
        title={t("home.welcome", { name: profile?.full_name ?? "" })}
        subtitle={club?.club_name}
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatLink
          to="/trainees"
          icon={<UsersIcon />}
          label={t("nav.trainees")}
          value={trainees?.length ?? 0}
        />
        <StatLink
          to="/programs"
          icon={<CalendarIcon />}
          label={t("nav.programs")}
          value={programs?.length ?? 0}
        />
        <StatLink
          to="/library"
          icon={<DumbbellIcon />}
          label={t("nav.library")}
          value={exercises?.length ?? 0}
        />
      </div>

      <div className="mb-4">
        <JoinCodeCard club={club} />
      </div>

      {painTrainees.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-danger">
            <AlertIcon className="h-4 w-4" />
            {t("reports.painAlerts")}
          </h2>
          <div className="space-y-2">
            {painTrainees.map((tr) => (
              <Link
                key={tr.id}
                to={`/trainees/${tr.id}`}
                className="card flex items-center justify-between gap-2 border-danger/30 p-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">{tr.full_name}</p>
                  {tr.lastSessionDate && (
                    <p className="text-xs text-muted">
                      {formatDate(tr.lastSessionDate, i18n.language)}
                    </p>
                  )}
                </div>
                <ChevronIcon className="h-5 w-5 text-muted rtl:rotate-180" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold text-text">{t("trainees.title")}</h2>
      {(trainees ?? []).length === 0 ? (
        <p className="card p-6 text-center text-sm text-muted">{t("trainees.empty")}</p>
      ) : (
        <div className="space-y-2">
          {(trainees ?? []).slice(0, 6).map((tr) => (
            <Link
              key={tr.id}
              to={`/trainees/${tr.id}`}
              className="card flex items-center justify-between gap-2 p-3.5 transition hover:border-primary/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {(tr.full_name ?? "?").trim()[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">{tr.full_name}</p>
                  <p className="truncate text-xs text-muted">
                    {tr.lastSessionDate
                      ? formatDate(tr.lastSessionDate, i18n.language)
                      : t("trainees.noSessions")}
                  </p>
                </div>
              </div>
              <ChevronIcon className="h-5 w-5 shrink-0 text-muted rtl:rotate-180" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
