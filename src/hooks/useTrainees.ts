import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Profile, Program } from "@/types";

export type TraineeSummary = Profile & {
  lastSessionDate: string | null;
  lastBodyWeight: number | null;
  recentPain: boolean;
};

export function useTrainees(coachId: string | undefined) {
  return useQuery({
    queryKey: ["trainees", coachId],
    enabled: !!coachId,
    queryFn: async (): Promise<TraineeSummary[]> => {
      const { data: trainees, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("coach_id", coachId!)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ids = (trainees ?? []).map((t) => t.id);
      if (ids.length === 0) return [];

      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("trainee_id, session_date, pain_flag")
        .in("trainee_id", ids)
        .order("session_date", { ascending: false });

      const { data: metrics } = await supabase
        .from("body_metrics")
        .select("trainee_id, body_weight, recorded_at")
        .in("trainee_id", ids)
        .order("recorded_at", { ascending: false });

      const lastSession = new Map<string, string>();
      const recentPain = new Map<string, boolean>();
      (sessions ?? []).forEach((s) => {
        if (!lastSession.has(s.trainee_id)) lastSession.set(s.trainee_id, s.session_date);
        if (s.pain_flag && !recentPain.has(s.trainee_id)) recentPain.set(s.trainee_id, true);
      });

      const lastWeight = new Map<string, number>();
      (metrics ?? []).forEach((m) => {
        if (!lastWeight.has(m.trainee_id) && m.body_weight != null) {
          lastWeight.set(m.trainee_id, m.body_weight);
        }
      });

      return (trainees ?? []).map((t) => ({
        ...t,
        lastSessionDate: lastSession.get(t.id) ?? null,
        lastBodyWeight: lastWeight.get(t.id) ?? null,
        recentPain: recentPain.get(t.id) ?? false,
      }));
    },
  });
}

export function useTrainee(traineeId: string | undefined) {
  return useQuery({
    queryKey: ["trainee", traineeId],
    enabled: !!traineeId,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", traineeId!)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export type AssignedProgram = {
  id: string;
  active: boolean;
  start_date: string;
  program: Program;
};

export function useTraineePrograms(traineeId: string | undefined) {
  return useQuery({
    queryKey: ["trainee-programs", traineeId],
    enabled: !!traineeId,
    queryFn: async (): Promise<AssignedProgram[]> => {
      const { data, error } = await supabase
        .from("trainee_programs")
        .select("id, active, start_date, program:programs(*)")
        .eq("trainee_id", traineeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).filter((r) => r.program) as unknown as AssignedProgram[];
    },
  });
}

export function useAssignProgram(traineeId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (programId: string) => {
      const { error } = await supabase.from("trainee_programs").insert({
        trainee_id: traineeId!,
        program_id: programId,
        active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainee-programs", traineeId] });
    },
  });
}

export function useUnassignProgram(traineeId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("trainee_programs")
        .delete()
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainee-programs", traineeId] });
    },
  });
}
