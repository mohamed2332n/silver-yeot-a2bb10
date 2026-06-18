import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Program, ProgramDayWithExercises } from "@/types";
import type { TablesInsert } from "@/types/database";

export function usePrograms(coachId: string | undefined) {
  return useQuery({
    queryKey: ["programs", coachId],
    enabled: !!coachId,
    queryFn: async (): Promise<Program[]> => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type ProgramFull = Program & { days: ProgramDayWithExercises[] };

export function useProgram(programId: string | undefined) {
  return useQuery({
    queryKey: ["program", programId],
    enabled: !!programId,
    queryFn: async (): Promise<ProgramFull | null> => {
      const { data: program, error } = await supabase
        .from("programs")
        .select("*")
        .eq("id", programId!)
        .maybeSingle();
      if (error) throw error;
      if (!program) return null;

      const { data: days, error: daysErr } = await supabase
        .from("program_days")
        .select("*, program_exercises(*, exercise:exercises(*))")
        .eq("program_id", programId!)
        .order("day_index", { ascending: true });
      if (daysErr) throw daysErr;

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

export function useSaveProgram(coachId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id?: string; name: string; description?: string | null }) => {
      if (!coachId) throw new Error("no coach");
      if (params.id) {
        const { error } = await supabase
          .from("programs")
          .update({ name: params.name, description: params.description })
          .eq("id", params.id);
        if (error) throw error;
        return params.id;
      }
      const { data, error } = await supabase
        .from("programs")
        .insert({ coach_id: coachId, name: params.name, description: params.description })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["programs", coachId] }),
  });
}

export function useDeleteProgram(coachId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["programs", coachId] }),
  });
}

export function useProgramMutations(programId: string | undefined) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["program", programId] });

  const addDay = useMutation({
    mutationFn: async (params: { dayIndex: number; title: string }) => {
      const { error } = await supabase.from("program_days").insert({
        program_id: programId!,
        day_index: params.dayIndex,
        title: params.title,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateDay = useMutation({
    mutationFn: async (params: { id: string; title: string }) => {
      const { error } = await supabase
        .from("program_days")
        .update({ title: params.title })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteDay = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("program_days").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addExercise = useMutation({
    mutationFn: async (params: TablesInsert<"program_exercises">) => {
      const { error } = await supabase.from("program_exercises").insert(params);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateExercise = useMutation({
    mutationFn: async (params: { id: string; values: Partial<TablesInsert<"program_exercises">> }) => {
      const { error } = await supabase
        .from("program_exercises")
        .update(params.values)
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeExercise = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("program_exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { addDay, updateDay, deleteDay, addExercise, updateExercise, removeExercise };
}
