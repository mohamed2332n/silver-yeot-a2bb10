import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Exercise } from "@/types";
import type { TablesInsert, TablesUpdate } from "@/types/database";

export type ExerciseWithAlternatives = Exercise & {
  alternativeIds: string[];
};

export function useExercises(coachId: string | undefined) {
  return useQuery({
    queryKey: ["exercises", coachId],
    enabled: !!coachId,
    queryFn: async (): Promise<ExerciseWithAlternatives[]> => {
      const { data: exercises, error } = await supabase
        .from("exercises")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: alts, error: altErr } = await supabase
        .from("exercise_alternatives")
        .select("exercise_id, alternative_id");
      if (altErr) throw altErr;

      const byExercise = new Map<string, string[]>();
      (alts ?? []).forEach((a) => {
        const list = byExercise.get(a.exercise_id) ?? [];
        list.push(a.alternative_id);
        byExercise.set(a.exercise_id, list);
      });

      return (exercises ?? []).map((ex) => ({
        ...ex,
        alternativeIds: byExercise.get(ex.id) ?? [],
      }));
    },
  });
}

export function useSaveExercise(coachId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id?: string;
      values: Omit<TablesInsert<"exercises">, "coach_id">;
      alternativeIds: string[];
    }) => {
      if (!coachId) throw new Error("no coach");
      let exerciseId = params.id;

      if (exerciseId) {
        const { error } = await supabase
          .from("exercises")
          .update(params.values as TablesUpdate<"exercises">)
          .eq("id", exerciseId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("exercises")
          .insert({ ...params.values, coach_id: coachId })
          .select("id")
          .single();
        if (error) throw error;
        exerciseId = data.id;
      }

      // reset alternatives
      await supabase.from("exercise_alternatives").delete().eq("exercise_id", exerciseId);
      if (params.alternativeIds.length > 0) {
        const rows = params.alternativeIds.map((altId) => ({
          exercise_id: exerciseId!,
          alternative_id: altId,
        }));
        const { error } = await supabase.from("exercise_alternatives").insert(rows);
        if (error) throw error;
      }
      return exerciseId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exercises", coachId] });
    },
  });
}

export function useDeleteExercise(coachId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exercises", coachId] });
    },
  });
}
