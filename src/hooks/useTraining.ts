import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  BodyMetric,
  Exercise,
  Feeling,
  ProgramDayWithExercises,
  SetLog,
} from "@/types";
import type { ProgramFull } from "./usePrograms";
import { todayISO } from "@/lib/format";

export function useMyActiveProgram(traineeId: string | undefined) {
  return useQuery({
    queryKey: ["my-program", traineeId],
    enabled: !!traineeId,
    queryFn: async (): Promise<ProgramFull | null> => {
      const { data: assignment, error } = await supabase
        .from("trainee_programs")
        .select("program_id")
        .eq("trainee_id", traineeId!)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!assignment) return null;

      const { data: program, error: pErr } = await supabase
        .from("programs")
        .select("*")
        .eq("id", assignment.program_id)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!program) return null;

      const { data: days, error: dErr } = await supabase
        .from("program_days")
        .select("*, program_exercises(*, exercise:exercises(*))")
        .eq("program_id", assignment.program_id)
        .order("day_index", { ascending: true });
      if (dErr) throw dErr;

      const sortedDays = (days ?? []).map((d) => ({
        ...d,
        program_exercises: [...(d.program_exercises ?? [])].sort(
          (a, b) => a.position - b.position,
        ),
      })) as ProgramDayWithExercises[];

      return { ...program, days: sortedDays };
    },
  });
}

export function useDaySession(
  traineeId: string | undefined,
  programDayId: string | undefined,
  date: string,
) {
  return useQuery({
    queryKey: ["session", traineeId, programDayId, date],
    enabled: !!traineeId && !!programDayId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("trainee_id", traineeId!)
        .eq("program_day_id", programDayId!)
        .eq("session_date", date)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useEnsureSession(traineeId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { programDayId: string; date: string }) => {
      const { data: existing } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("trainee_id", traineeId!)
        .eq("program_day_id", params.programDayId)
        .eq("session_date", params.date)
        .maybeSingle();
      if (existing) return existing;

      const { data, error } = await supabase
        .from("workout_sessions")
        .insert({
          trainee_id: traineeId!,
          program_day_id: params.programDayId,
          session_date: params.date,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["session", traineeId, vars.programDayId],
      });
    },
  });
}

export function useSessionLogs(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["set-logs", sessionId],
    enabled: !!sessionId,
    queryFn: async (): Promise<SetLog[]> => {
      const { data, error } = await supabase
        .from("set_logs")
        .select("*")
        .eq("session_id", sessionId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLogSet(sessionId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      programExerciseId: string;
      exerciseId: string;
      usedAlternativeId: string | null;
      setNumber: number;
      weight: number | null;
      reps: number | null;
      restTaken: number | null;
      condition: Feeling | null;
    }) => {
      const { error } = await supabase.from("set_logs").insert({
        session_id: sessionId!,
        program_exercise_id: params.programExerciseId,
        exercise_id: params.exerciseId,
        used_alternative_id: params.usedAlternativeId,
        set_number: params.setNumber,
        weight: params.weight,
        reps: params.reps,
        rest_taken: params.restTaken,
        condition: params.condition,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["set-logs", sessionId] });
    },
  });
}

export function useDeleteSetLog(sessionId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("set_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["set-logs", sessionId] }),
  });
}

export function useFinishSession(traineeId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      overallFeeling: Feeling | null;
      painFlag: boolean;
      notes: string | null;
    }) => {
      const { error } = await supabase
        .from("workout_sessions")
        .update({
          overall_feeling: params.overallFeeling,
          pain_flag: params.painFlag,
          notes: params.notes,
        })
        .eq("id", params.sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session", traineeId] });
    },
  });
}

export function useExerciseAlternatives(exerciseId: string | undefined) {
  return useQuery({
    queryKey: ["alternatives", exerciseId],
    enabled: !!exerciseId,
    queryFn: async (): Promise<Exercise[]> => {
      const { data, error } = await supabase
        .from("exercise_alternatives")
        .select("alternative:exercises!exercise_alternatives_alternative_id_fkey(*)")
        .eq("exercise_id", exerciseId!);
      if (error) throw error;
      return (data ?? [])
        .map((r) => (r as unknown as { alternative: Exercise }).alternative)
        .filter(Boolean);
    },
  });
}

export function useBodyMetrics(traineeId: string | undefined) {
  return useQuery({
    queryKey: ["body-metrics", traineeId],
    enabled: !!traineeId,
    queryFn: async (): Promise<BodyMetric[]> => {
      const { data, error } = await supabase
        .from("body_metrics")
        .select("*")
        .eq("trainee_id", traineeId!)
        .order("recorded_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddBodyMetric(traineeId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bodyWeight: number) => {
      const date = todayISO();
      const { data: existing } = await supabase
        .from("body_metrics")
        .select("id")
        .eq("trainee_id", traineeId!)
        .eq("recorded_at", date)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("body_metrics")
          .update({ body_weight: bodyWeight })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("body_metrics").insert({
          trainee_id: traineeId!,
          recorded_at: date,
          body_weight: bodyWeight,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["body-metrics", traineeId] }),
  });
}
