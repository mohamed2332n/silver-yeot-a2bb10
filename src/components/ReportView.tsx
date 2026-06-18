import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTraineeReport } from "@/hooks/useReports";
import { daysAgoISO, formatShortDate, formatDate } from "@/lib/format";
import { useLabels, FEELING_COLOR, FEELING_EMOJI } from "@/lib/labels";
import { Spinner } from "@/components/ui/Spinner";
import { AlertIcon } from "@/components/icons";

type Period = "daily" | "weekly" | "monthly";

const PERIOD_DAYS: Record<Period, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ?? "text-text"}`}>{value}</p>
    </div>
  );
}

export function ReportView({ traineeId }: { traineeId: string | undefined }) {
  const { t, i18n } = useTranslation();
  const { feeling } = useLabels();
  const [period, setPeriod] = useState<Period>("weekly");
  const since = daysAgoISO(PERIOD_DAYS[period]);
  const { data, isLoading } = useTraineeReport(traineeId, since);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10 text-primary">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (!data) return null;

  const feelingLabel =
    data.avgFeeling != null
      ? data.avgFeeling >= 4.5
        ? feeling("great")
        : data.avgFeeling >= 3.5
          ? feeling("good")
          : data.avgFeeling >= 2.5
            ? feeling("ok")
            : data.avgFeeling >= 1.5
              ? feeling("tired")
              : feeling("pain")
      : "-";

  const chartLocale = i18n.language;

  return (
    <div className="space-y-5">
      <div className="flex gap-1.5">
        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              period === p
                ? "bg-primary text-primary-fg"
                : "bg-surface-2 text-muted hover:text-text"
            }`}
          >
            {t(`reports.${p}`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("reports.totalSessions")} value={String(data.totalSessions)} />
        <StatCard
          label={t("reports.totalVolume")}
          value={data.totalVolume.toLocaleString(chartLocale === "ar" ? "ar-EG" : "en-US")}
        />
        <StatCard label={t("reports.avgFeeling")} value={feelingLabel} />
        <StatCard
          label={t("reports.painAlerts")}
          value={String(data.painCount)}
          accent={data.painCount > 0 ? "text-danger" : "text-success"}
        />
      </div>

      {data.volumeSeries.length > 1 && (
        <div className="card p-4">
          <p className="mb-3 text-sm font-semibold text-text">{t("reports.volumeTrend")}</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.volumeSeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-border))" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatShortDate(d, chartLocale)}
                tick={{ fill: "rgb(var(--c-muted))", fontSize: 11 }}
                stroke="rgb(var(--c-border))"
              />
              <YAxis tick={{ fill: "rgb(var(--c-muted))", fontSize: 11 }} stroke="rgb(var(--c-border))" />
              <Tooltip
                contentStyle={{
                  background: "rgb(var(--c-surface))",
                  border: "1px solid rgb(var(--c-border))",
                  borderRadius: 12,
                  color: "rgb(var(--c-text))",
                }}
                labelFormatter={(d) => formatShortDate(String(d), chartLocale)}
              />
              <Line
                type="monotone"
                dataKey="volume"
                name={t("reports.volume")}
                stroke="rgb(var(--c-primary))"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.bodyWeightSeries.length > 1 && (
        <div className="card p-4">
          <p className="mb-3 text-sm font-semibold text-text">{t("reports.bodyWeightTrend")}</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.bodyWeightSeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-border))" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatShortDate(d, chartLocale)}
                tick={{ fill: "rgb(var(--c-muted))", fontSize: 11 }}
                stroke="rgb(var(--c-border))"
              />
              <YAxis
                domain={["dataMin - 2", "dataMax + 2"]}
                tick={{ fill: "rgb(var(--c-muted))", fontSize: 11 }}
                stroke="rgb(var(--c-border))"
              />
              <Tooltip
                contentStyle={{
                  background: "rgb(var(--c-surface))",
                  border: "1px solid rgb(var(--c-border))",
                  borderRadius: 12,
                  color: "rgb(var(--c-text))",
                }}
                labelFormatter={(d) => formatShortDate(String(d), chartLocale)}
              />
              <Line
                type="monotone"
                dataKey="weight"
                name={t("trainees.bodyWeight")}
                stroke="rgb(var(--c-warning))"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-text">{t("reports.recentSessions")}</p>
        {data.sessions.length === 0 ? (
          <p className="card p-6 text-center text-sm text-muted">{t("reports.noData")}</p>
        ) : (
          <div className="space-y-2">
            {data.sessions.map((s) => (
              <div key={s.id} className="card flex items-center justify-between gap-3 p-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">
                    {formatDate(s.session_date, chartLocale)}
                  </p>
                  <p className="text-xs text-muted">
                    {s.setCount} {t("common.sets")} · {Math.round(s.volume)} {t("common.kg")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.pain_flag && (
                    <span className="flex items-center gap-1 rounded-full bg-danger/10 px-2 py-1 text-xs font-medium text-danger">
                      <AlertIcon className="h-3.5 w-3.5" />
                      {t("reports.painReported")}
                    </span>
                  )}
                  {s.overall_feeling && (
                    <span className={`text-lg ${FEELING_COLOR[s.overall_feeling]}`}>
                      {FEELING_EMOJI[s.overall_feeling]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
