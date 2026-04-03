import type { ExerciseBase } from "./exerciseTypes";

export const EXERCISE_BASES: ExerciseBase[] = [
	// Chest
	{ id: "bench_press", nameKey: "bench_press", muscles: ["chest", "triceps", "shoulders"] },
	{
		id: "incline_bench_press",
		nameKey: "incline_bench_press",
		muscles: ["chest", "triceps", "shoulders"],
	},
	{ id: "decline_bench_press", nameKey: "decline_bench_press", muscles: ["chest", "triceps"] },
	{ id: "fly", nameKey: "fly", muscles: ["chest", "shoulders"] },
	{ id: "dips", nameKey: "dips", muscles: ["chest", "triceps", "shoulders"] },
	{ id: "push_up", nameKey: "push_up", muscles: ["chest", "triceps", "shoulders"] },

	// Back
	{ id: "deadlift", nameKey: "deadlift", muscles: ["back", "glutes", "hamstrings"] },
	{ id: "pull_up", nameKey: "pull_up", muscles: ["back", "biceps"] },
	{ id: "chin_up", nameKey: "chin_up", muscles: ["back", "biceps"] },
	{ id: "row", nameKey: "row", muscles: ["back", "biceps"], supportsUnilateral: true },
	{ id: "lat_pulldown", nameKey: "lat_pulldown", muscles: ["back", "biceps"] },
	{ id: "t_bar_row", nameKey: "t_bar_row", muscles: ["back", "biceps"] },
	{ id: "face_pull", nameKey: "face_pull", muscles: ["shoulders", "back"] },

	// Legs
	{ id: "squat", nameKey: "squat", muscles: ["quads", "glutes", "hamstrings"] },
	{ id: "hack_squat", nameKey: "hack_squat", muscles: ["quads", "glutes"] },
	{ id: "leg_press", nameKey: "leg_press", muscles: ["quads", "glutes", "hamstrings"] },
	{
		id: "romanian_deadlift",
		nameKey: "romanian_deadlift",
		muscles: ["hamstrings", "glutes", "back"],
	},
	{ id: "leg_curl", nameKey: "leg_curl", muscles: ["hamstrings"] },
	{ id: "leg_extension", nameKey: "leg_extension", muscles: ["quads"] },
	{
		id: "bulgarian_split_squat",
		nameKey: "bulgarian_split_squat",
		muscles: ["quads", "glutes", "hamstrings"],
		supportsUnilateral: true,
	},
	{
		id: "lunge",
		nameKey: "lunge",
		muscles: ["quads", "glutes", "hamstrings"],
		supportsUnilateral: true,
	},
	{ id: "calf_raise", nameKey: "calf_raise", muscles: ["calves"] },

	// Shoulders
	{ id: "overhead_press", nameKey: "overhead_press", muscles: ["shoulders", "triceps"] },
	{ id: "arnold_press", nameKey: "arnold_press", muscles: ["shoulders", "triceps"] },
	{
		id: "lateral_raise",
		nameKey: "lateral_raise",
		muscles: ["shoulders"],
		supportsUnilateral: true,
	},
	{ id: "front_raise", nameKey: "front_raise", muscles: ["shoulders"], supportsUnilateral: true },
	{
		id: "rear_delt_fly",
		nameKey: "rear_delt_fly",
		muscles: ["shoulders", "back"],
		supportsUnilateral: true,
	},
	{ id: "upright_row", nameKey: "upright_row", muscles: ["shoulders", "biceps"] },

	// Arms
	{ id: "curl", nameKey: "curl", muscles: ["biceps", "forearms"], supportsUnilateral: true },
	{
		id: "hammer_curl",
		nameKey: "hammer_curl",
		muscles: ["biceps", "forearms"],
		supportsUnilateral: true,
	},
	{ id: "preacher_curl", nameKey: "preacher_curl", muscles: ["biceps"], supportsUnilateral: true },
	{
		id: "tricep_pushdown",
		nameKey: "tricep_pushdown",
		muscles: ["triceps"],
		supportsUnilateral: true,
	},
	{ id: "skull_crusher", nameKey: "skull_crusher", muscles: ["triceps"] },
	{
		id: "overhead_tricep_extension",
		nameKey: "overhead_tricep_extension",
		muscles: ["triceps"],
		supportsUnilateral: true,
	},
	{
		id: "close_grip_bench_press",
		nameKey: "close_grip_bench_press",
		muscles: ["triceps", "chest"],
	},
	{ id: "tricep_dips", nameKey: "tricep_dips", muscles: ["triceps", "chest"] },

	// Core
	{ id: "plank", nameKey: "plank", muscles: ["abs"] },
	{ id: "crunch", nameKey: "crunch", muscles: ["abs"] },
	{ id: "leg_raise", nameKey: "leg_raise", muscles: ["abs"] },
	{ id: "ab_wheel_rollout", nameKey: "ab_wheel_rollout", muscles: ["abs"] },
	{ id: "russian_twist", nameKey: "russian_twist", muscles: ["abs"] },
];

export const EXERCISE_BASES_BY_ID = Object.fromEntries(
	EXERCISE_BASES.map((base) => [base.id, base])
) as Record<string, ExerciseBase>;
