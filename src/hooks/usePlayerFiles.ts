import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PlayerFile, PlayerFileKind } from "@/types";

const BUCKET = "player-files";

export function usePlayerFiles(traineeId: string | undefined) {
  return useQuery({
    queryKey: ["player-files", traineeId],
    enabled: !!traineeId,
    queryFn: async (): Promise<PlayerFile[]> => {
      const { data, error } = await supabase
        .from("player_files")
        .select("*")
        .eq("trainee_id", traineeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUploadPlayerFile(traineeId: string | undefined, uploadedBy: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      file: File;
      kind: PlayerFileKind;
      description?: string;
    }) => {
      if (!traineeId || !uploadedBy) throw new Error("Missing ids");
      const ext = params.file.name.split(".").pop() ?? "bin";
      const path = `${traineeId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, params.file, { upsert: false });
      if (upErr) throw upErr;

      const { error: dbErr } = await supabase.from("player_files").insert({
        trainee_id: traineeId,
        uploaded_by: uploadedBy,
        file_name: params.file.name,
        file_path: path,
        mime_type: params.file.type || "application/octet-stream",
        kind: params.kind,
        description: params.description?.trim() || null,
      });
      if (dbErr) throw dbErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["player-files", traineeId] });
    },
  });
}

export function useDeletePlayerFile(traineeId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: PlayerFile) => {
      await supabase.storage.from(BUCKET).remove([file.file_path]);
      const { error } = await supabase.from("player_files").delete().eq("id", file.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["player-files", traineeId] });
    },
  });
}

export async function getSignedFileUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
