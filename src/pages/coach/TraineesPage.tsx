import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import { useTrainees } from "@/hooks/useTrainees";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { JoinCodeCard } from "@/components/JoinCodeCard";
import { ChevronIcon, AlertIcon } from "@/components/icons";
import { formatDate } from "@/lib/format";

export function TraineesPage() {
  const { t, i18n } = useTranslation();
  const { profile, club } = useAuth();
  const { data: trainees, isLoading } = useTrainees(profile?.id);

  return (
    <div>
      <PageHeader title={t("trainees.title")} subtitle={t("trainees.subtitle")} />

      <div className="mb-4">
        <JoinCodeCard club={club} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10 text-primary">
          <Spinner className="h-7 w-7" />
        </div>
      ) : (trainees ?? []).length === 0 ? (
        <EmptyState title={t("trainees.empty")} description={t("trainees.inviteHint")} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(trainees ?? []).map((tr) => (
            <Link
              key={tr.id}
              to={`/trainees/${tr.id}`}
              className="card flex items-center gap-3 p-4 transition hover:border-primary/40"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary">
                {(tr.full_name ?? "?").trim()[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-semibold text-text">
                  {tr.full_name}
                  {tr.recentPain && <AlertIcon className="h-4 w-4 shrink-0 text-danger" />}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {tr.lastSessionDate
                    ? `${t("trainees.lastSession")}: ${formatDate(tr.lastSessionDate, i18n.language)}`
                    : t("trainees.noSessions")}
                </p>
              </div>
              <ChevronIcon className="h-5 w-5 shrink-0 text-muted rtl:rotate-180" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
