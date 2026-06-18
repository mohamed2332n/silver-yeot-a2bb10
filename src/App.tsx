import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { FullPageLoader } from "@/components/ui/Spinner";
import { Layout } from "@/components/Layout";
import { AuthPage } from "@/pages/AuthPage";
import { CoachDashboard } from "@/pages/coach/CoachDashboard";
import { ExerciseLibraryPage } from "@/pages/coach/ExerciseLibraryPage";
import { ProgramsPage } from "@/pages/coach/ProgramsPage";
import { ProgramBuilderPage } from "@/pages/coach/ProgramBuilderPage";
import { TraineesPage } from "@/pages/coach/TraineesPage";
import { TraineeDetailPage } from "@/pages/coach/TraineeDetailPage";
import { CoachReportsPage } from "@/pages/coach/CoachReportsPage";
import { ClubSettingsPage } from "@/pages/coach/ClubSettingsPage";
import { TraineeHome } from "@/pages/trainee/TraineeHome";
import { SessionLogPage } from "@/pages/trainee/SessionLogPage";
import { TraineeProgressPage } from "@/pages/trainee/TraineeProgressPage";
import { AssistantPage } from "@/pages/trainee/AssistantPage";

export default function App() {
  const { loading, session, profile } = useAuth();

  if (loading) return <FullPageLoader />;

  if (!session || !profile) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

  if (profile.role === "coach") {
    return (
      <Routes>
        <Route element={<Layout role="coach" />}>
          <Route index element={<CoachDashboard />} />
          <Route path="library" element={<ExerciseLibraryPage />} />
          <Route path="programs" element={<ProgramsPage />} />
          <Route path="programs/:programId" element={<ProgramBuilderPage />} />
          <Route path="trainees" element={<TraineesPage />} />
          <Route path="trainees/:traineeId" element={<TraineeDetailPage />} />
          <Route path="reports" element={<CoachReportsPage />} />
          <Route path="settings" element={<ClubSettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout role="trainee" />}>
        <Route index element={<TraineeHome />} />
        <Route path="session/:dayId" element={<SessionLogPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="progress" element={<TraineeProgressPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
