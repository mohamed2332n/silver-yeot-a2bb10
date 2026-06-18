import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Feeling } from "@/types";

const FEELING_SCORE: Record<Feeling, number> = {
  great: 5,
  good: 4,
  ok: 3,
  tired: 2,
  pain: 1,
};

export type SessionReport = {
  id: string;
  session_date: string;
  overall_feeling: Feeling | null;
  pain_flag: boolean;
  notes: string | null;
  volume: number;
  setCount: number;
};

export type TraineeReport = {
  totalSessions: number;
  totalVolume: number;
  avgFeeling: number | null;
  painCount: number;
  sessions: SessionReport[];
  volumeSeries: { date: string; volume: number }[];
  bodyWeightSeries: { date: string; weight: number }[];
};

export function useTraineeReport(traineeId: string | undefined, sinceISO: string) {
  return useQuery({
    queryKey: ["report", traineeId, sinceISO],
    enabled: !!traineeId,
    queryFn: async (): Promise<TraineeReport> => {
      const { data: sessions, error } = await supabase
        .from("workout_sessions")
        .select("id, session_date, overall_feeling, pain_flag, notes, set_logs(weight, reps)")
        .eq("trainee_id", traineeId!)
        .gte("session_date", sinceISO)
        .order("session_date", { ascending: true });
      if (error) throw error;

      const reports: SessionReport[] = (sessions ?? []).map((s) => {
        const logs = (s.set_logs ?? []) as { weight: number | null; reps: number | null }[];
        const volume = logs.reduce(
          (sum, l) => sum + (l.weight ?? 0) * (l.reps ?? 0),
          0,
        );
        return {
          id: s.id,
          session_date: s.session_date,
          overall_feeling: s.overall_feeling,
          pain_flag: s.pain_flag,
          notes: s.notes,
          volume,
          setCount: logs.length,
        };
      });

      const feelings = reports
        .map((r) => r.overall_feeling)
        .filter((f): f is Feeling => !!f)
        .map((f) => FEELING_SCORE[f]);
      const avgFeeling =
        feelings.length > 0
          ? feelings.reduce((a, b) => a + b, 0) / feelings.length
          : null;

      const volumeByDate = new Map<string, number>();
      reports.forEach((r) => {
        volumeByDate.set(r.session_date, (volumeByDate.get(r.session_date) ?? 0) + r.volume);
      });

      const { data: metrics } = await supabase
        .from("body_metrics")
        .select("recorded_at, body_weight")
        .eq("trainee_id", traineeId!)
        .gte("recorded_at", sinceISO)
        .order("recorded_at", { ascending: true });

      return {
        totalSessions: reports.length,
        totalVolume: reports.reduce((sum, r) => sum + r.volume, 0),
        avgFeeling,
        painCount: reports.filter((r) => r.pain_flag).length,
        sessions: [...reports].reverse(),
        volumeSeries: Array.from(volumeByDate.entries()).map(([date, volume]) => ({
          date,
          volume: Math.round(volume),
        })),
        bodyWeightSeries: (metrics ?? [])
          .filter((m) => m.body_weight != null)
          .map((m) => ({ date: m.recorded_at, weight: m.body_weight as number })),
      };
    },
  });
}
