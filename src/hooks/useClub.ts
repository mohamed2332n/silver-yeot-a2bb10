import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useUpdateClub(coachId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { clubName?: string; logoFile?: File | null }) => {
      if (!coachId) throw new Error("no coach");
      let logoUrl: string | undefined;

      if (params.logoFile) {
        const ext = params.logoFile.name.split(".").pop() ?? "png";
        const path = `${coachId}/logo-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("logos")
          .upload(path, params.logoFile, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("logos").getPublicUrl(path);
        logoUrl = data.publicUrl;
      }

      const patch: { club_name?: string; logo_url?: string } = {};
      if (params.clubName !== undefined) patch.club_name = params.clubName;
      if (logoUrl) patch.logo_url = logoUrl;

      const { error } = await supabase.from("clubs").update(patch).eq("coach_id", coachId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}
