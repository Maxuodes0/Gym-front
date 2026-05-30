import type { WorkoutType } from "@/types/domain";

export const workoutTypes: WorkoutType[] = ["Push A", "Pull A", "Legs", "Push B", "Pull B"];

export const selectableWorkoutTypes: WorkoutType[] = [...workoutTypes, "Rest Day"];
