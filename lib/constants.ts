import type { WorkoutType } from "@/types/domain";

export const workoutTypes: Exclude<WorkoutType, "Rest Day">[] = ["Push A", "Pull A", "Legs", "Push B", "Pull B"];

export type WorkoutOption = {
  label: string;
  value: Exclude<WorkoutType, "Rest Day">;
};

export const selectableWorkoutTypes: WorkoutType[] = [...workoutTypes, "Rest Day"];

export const workoutOptions: WorkoutOption[] = workoutTypes.map((type) => ({ label: type, value: type }));

export const bushraueiWorkoutOptions: WorkoutOption[] = [
  { label: "Push", value: "Push A" },
  { label: "Pull", value: "Pull A" },
  { label: "Legs", value: "Legs" },
  { label: "Full Body", value: "Push B" }
];

export function isBushraueiEmail(email: string | null | undefined) {
  return email?.toLowerCase() === "bushrauei@tura.app";
}

export function getWorkoutOptionsForEmail(email: string | null | undefined) {
  return isBushraueiEmail(email) ? bushraueiWorkoutOptions : workoutOptions;
}

export function getWorkoutDisplayType(type: WorkoutType, email: string | null | undefined) {
  if (!isBushraueiEmail(email)) return type;

  return bushraueiWorkoutOptions.find((option) => option.value === type)?.label ?? type;
}
