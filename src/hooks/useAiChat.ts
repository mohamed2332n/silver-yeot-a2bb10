import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AiMessage } from "@/types";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type AiChatMode = "coach" | "trainee";

export function useAiHistory(
  userId: string | undefined,
  subjectTraineeId: string | undefined,
) {
  return useQuery({
    queryKey: ["ai-messages", userId, subjectTraineeId],
    enabled: !!userId && !!subjectTraineeId,
    queryFn: async (): Promise<AiMessage[]> => {
      const { data, error } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("user_id", userId!)
        .eq("subject_trainee_id", subjectTraineeId!)
        .order("created_at", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSendAiMessage(
  mode: AiChatMode,
  targetTraineeId: string | undefined,
  userId: string | undefined,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      messages: ChatMessage[];
      attachmentFileIds?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          mode,
          targetTraineeId: mode === "coach" ? targetTraineeId : undefined,
          messages: params.messages,
          attachmentFileIds: params.attachmentFileIds,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { content: string; model?: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-messages", userId, targetTraineeId] });
    },
  });
}
