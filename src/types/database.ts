export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["ai_message_role"]
          subject_trainee_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["ai_message_role"]
          subject_trainee_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["ai_message_role"]
          subject_trainee_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_subject_trainee_id_fkey"
            columns: ["subject_trainee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      body_metrics: {
        Row: {
          body_weight: number | null
          created_at: string
          id: string
          notes: string | null
          recorded_at: string
          trainee_id: string
        }
        Insert: {
          body_weight?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          trainee_id: string
        }
        Update: {
          body_weight?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          trainee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "body_metrics_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          club_name: string
          coach_id: string
          created_at: string
          id: string
          join_code: string
          logo_url: string | null
        }
        Insert: {
          club_name?: string
          coach_id: string
          created_at?: string
          id?: string
          join_code: string
          logo_url?: string | null
        }
        Update: {
          club_name?: string
          coach_id?: string
          created_at?: string
          id?: string
          join_code?: string
          logo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_alternatives: {
        Row: {
          alternative_id: string
          exercise_id: string
          id: string
        }
        Insert: {
          alternative_id: string
          exercise_id: string
          id?: string
        }
        Update: {
          alternative_id?: string
          exercise_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_alternatives_alternative_id_fkey"
            columns: ["alternative_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_alternatives_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          coach_id: string
          created_at: string
          equipment: string | null
          id: string
          image_url: string | null
          instructions: string | null
          muscle_group: Database["public"]["Enums"]["muscle_group"]
          name_ar: string
          name_en: string | null
          video_url: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          equipment?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          muscle_group?: Database["public"]["Enums"]["muscle_group"]
          name_ar: string
          name_en?: string | null
          video_url?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          equipment?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          muscle_group?: Database["public"]["Enums"]["muscle_group"]
          name_ar?: string
          name_en?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coach_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          locale: string
          role: Database["public"]["Enums"]["user_role"]
          theme: string
        }
        Insert: {
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          locale?: string
          role?: Database["public"]["Enums"]["user_role"]
          theme?: string
        }
        Update: {
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          locale?: string
          role?: Database["public"]["Enums"]["user_role"]
          theme?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_files: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          id: string
          kind: Database["public"]["Enums"]["player_file_kind"]
          mime_type: string
          trainee_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          id?: string
          kind?: Database["public"]["Enums"]["player_file_kind"]
          mime_type: string
          trainee_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          id?: string
          kind?: Database["public"]["Enums"]["player_file_kind"]
          mime_type?: string
          trainee_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_files_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      program_days: {
        Row: {
          created_at: string
          day_index: number
          id: string
          program_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          day_index?: number
          id?: string
          program_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          day_index?: number
          id?: string
          program_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_days_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_exercises: {
        Row: {
          exercise_id: string
          id: string
          notes: string | null
          position: number
          program_day_id: string
          rest_seconds: number | null
          target_reps: number | null
          target_sets: number | null
          target_weight: number | null
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string | null
          position?: number
          program_day_id: string
          rest_seconds?: number | null
          target_reps?: number | null
          target_sets?: number | null
          target_weight?: number | null
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          program_day_id?: string
          rest_seconds?: number | null
          target_reps?: number | null
          target_sets?: number | null
          target_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "program_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_exercises_program_day_id_fkey"
            columns: ["program_day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          coach_id: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      set_logs: {
        Row: {
          condition: Database["public"]["Enums"]["feeling"] | null
          created_at: string
          exercise_id: string | null
          id: string
          program_exercise_id: string | null
          reps: number | null
          rest_taken: number | null
          session_id: string
          set_number: number
          used_alternative_id: string | null
          weight: number | null
        }
        Insert: {
          condition?: Database["public"]["Enums"]["feeling"] | null
          created_at?: string
          exercise_id?: string | null
          id?: string
          program_exercise_id?: string | null
          reps?: number | null
          rest_taken?: number | null
          session_id: string
          set_number?: number
          used_alternative_id?: string | null
          weight?: number | null
        }
        Update: {
          condition?: Database["public"]["Enums"]["feeling"] | null
          created_at?: string
          exercise_id?: string | null
          id?: string
          program_exercise_id?: string | null
          reps?: number | null
          rest_taken?: number | null
          session_id?: string
          set_number?: number
          used_alternative_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_program_exercise_id_fkey"
            columns: ["program_exercise_id"]
            isOneToOne: false
            referencedRelation: "program_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_used_alternative_id_fkey"
            columns: ["used_alternative_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      trainee_programs: {
        Row: {
          active: boolean
          created_at: string
          id: string
          program_id: string
          start_date: string
          trainee_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          program_id: string
          start_date?: string
          trainee_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          program_id?: string
          start_date?: string
          trainee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainee_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainee_programs_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          overall_feeling: Database["public"]["Enums"]["feeling"] | null
          pain_flag: boolean
          program_day_id: string | null
          session_date: string
          trainee_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          overall_feeling?: Database["public"]["Enums"]["feeling"] | null
          pain_flag?: boolean
          program_day_id?: string | null
          session_date?: string
          trainee_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          overall_feeling?: Database["public"]["Enums"]["feeling"] | null
          pain_flag?: boolean
          program_day_id?: string | null
          session_date?: string
          trainee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_program_day_id_fkey"
            columns: ["program_day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gen_join_code: { Args: Record<string, never>; Returns: string }
      is_coach_of: { Args: { p_trainee: string }; Returns: boolean }
      my_coach_id: { Args: Record<string, never>; Returns: string }
      redeem_join_code: { Args: { p_code: string }; Returns: boolean }
    }
    Enums: {
      ai_message_role: "user" | "assistant"
      feeling: "great" | "good" | "ok" | "tired" | "pain"
      muscle_group:
        | "chest"
        | "back"
        | "shoulders"
        | "legs"
        | "arms"
        | "core"
        | "glutes"
        | "full_body"
        | "cardio"
        | "other"
      player_file_kind: "medical" | "photo" | "other"
      user_role: "coach" | "trainee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T]
