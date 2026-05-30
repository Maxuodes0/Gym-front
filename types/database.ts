import type { CardioLog, Exercise, ExerciseLog, Profile, WeightLog, Workout } from "@/types/domain";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Pick<Profile, "id" | "email"> & Partial<Pick<Profile, "full_name" | "created_at" | "updated_at">>;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
      weight_logs: {
        Row: WeightLog;
        Insert: Pick<WeightLog, "user_id" | "weight" | "body_fat_percentage"> & Partial<Pick<WeightLog, "id" | "created_at">>;
        Update: Partial<Pick<WeightLog, "weight" | "body_fat_percentage">>;
        Relationships: [];
      };
      cardio_logs: {
        Row: CardioLog;
        Insert: Pick<CardioLog, "user_id" | "machine_type" | "duration_minutes"> & Partial<Pick<CardioLog, "id" | "created_at">>;
        Update: Partial<Pick<CardioLog, "machine_type" | "duration_minutes">>;
        Relationships: [];
      };
      workouts: {
        Row: Workout;
        Insert: Pick<Workout, "user_id" | "workout_type" | "is_rest_day"> & Partial<Pick<Workout, "id" | "workout_date" | "created_at">>;
        Update: Partial<Pick<Workout, "workout_type" | "is_rest_day" | "workout_date">>;
        Relationships: [];
      };
      exercises: {
        Row: Exercise;
        Insert: Omit<Exercise, "id" | "created_at"> & Partial<Pick<Exercise, "id" | "created_at">>;
        Update: Partial<Omit<Exercise, "id" | "created_at">>;
        Relationships: [];
      };
      exercise_logs: {
        Row: ExerciseLog;
        Insert: Pick<ExerciseLog, "workout_id" | "exercise_id" | "set_number" | "weight_used" | "reps_completed"> &
          Partial<Pick<ExerciseLog, "id" | "created_at">>;
        Update: Partial<Pick<ExerciseLog, "weight_used" | "reps_completed">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      workout_type: Workout["workout_type"];
    };
    CompositeTypes: Record<string, never>;
  };
};
