export type MuscleGroup = "chest" | "back" | "legs" | "shoulders" | "arms" | "core";

export type Exercise = {
	id: number;
	name: string;
	muscleGroup: MuscleGroup;
	description: string;
};

export const EXERCISES: Exercise[] = [
	{ id: 1, name: "Bench Press", muscleGroup: "chest", description: "Barbell flat bench press" },
	{ id: 2, name: "Squat", muscleGroup: "legs", description: "Barbell back squat" },
	{ id: 3, name: "Deadlift", muscleGroup: "back", description: "Conventional deadlift" },
];