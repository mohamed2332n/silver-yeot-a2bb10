import { useTranslation } from "react-i18next";
import type { Exercise, Feeling, MuscleGroup } from "@/types";

export function useLabels() {
  const { t, i18n } = useTranslation();

  const muscle = (m: MuscleGroup) => t(`muscle.${m}`);
  const feeling = (f: Feeling) => t(`feeling.${f}`);

  const exerciseName = (ex: Pick<Exercise, "name_ar" | "name_en"> | null | undefined) => {
    if (!ex) return "";
    if (i18n.language === "en") return ex.name_en || ex.name_ar;
    return ex.name_ar || ex.name_en || "";
  };

  return { muscle, feeling, exerciseName, lang: i18n.language };
}

export const FEELING_COLOR: Record<Feeling, string> = {
  great: "text-success",
  good: "text-success",
  ok: "text-muted",
  tired: "text-warning",
  pain: "text-danger",
};

export const FEELING_EMOJI: Record<Feeling, string> = {
  great: "\u{1F525}",
  good: "\u{1F642}",
  ok: "\u{1F610}",
  tired: "\u{1F62B}",
  pain: "\u{1F915}",
};
