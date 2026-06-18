import type { Tables, Enums } from "./database";

export type Profile = Tables<"profiles">;
export type Club = Tables<"clubs">;
export type Exercise = Tables<"exercises">;
export type Program = Tables<"programs">;
export type ProgramDay = Tables<"program_days">;
export type ProgramExercise = Tables<"program_exercises">;
export type TraineeProgram = Tables<"trainee_programs">;
export type WorkoutSession = Tables<"workout_sessions">;
export type SetLog = Tables<"set_logs">;
export type BodyMetric = Tables<"body_metrics">;
export type PlayerFile = Tables<"player_files">;
export type AiMessage = Tables<"ai_messages">;

export type MuscleGroup = Enums<"muscle_group">;
export type Feeling = Enums<"feeling">;
export type UserRole = Enums<"user_role">;
export type PlayerFileKind = Enums<"player_file_kind">;
export type AiMessageRole = Enums<"ai_message_role">;

export const PLAYER_FILE_KINDS: PlayerFileKind[] = ["medical", "photo", "other"];

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "legs",
  "arms",
  "core",
  "glutes",
  "full_body",
  "cardio",
  "other",
];

export const FEELINGS: Feeling[] = ["great", "good", "ok", "tired", "pain"];

export type ProgramExerciseWithExercise = ProgramExercise & {
  exercise: Exercise | null;
};

export type ProgramDayWithExercises = ProgramDay & {
  program_exercises: ProgramExerciseWithExercise[];
};
