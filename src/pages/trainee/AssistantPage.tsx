import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import { PageHeader } from "@/components/PageHeader";
import { AIChat } from "@/components/AIChat";
import { PlayerFiles } from "@/components/PlayerFiles";

export function AssistantPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  if (!profile?.id) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("ai.traineeTitle")} subtitle={t("ai.traineeSubtitle")} />
      <AIChat mode="trainee" targetTraineeId={profile.id} />
      <PlayerFiles traineeId={profile.id} />
    </div>
  );
}
