export type MuscleGroup =
	| "chest"
	| "triceps"
	| "biceps"
	| "abs"
	| "forearms"
	| "back"
	| "shoulders"
	| "quads"
	| "glutes"
	| "hamstrings";

export type ExerciseType = "bodyweight" | "free_weight" | "machine";

export type Exercise = {
	nameKey: string;
	muscles: MuscleGroup[];
	type: ExerciseType;
};

export const EXERCISES: Exercise[] = [
	// Chest
	{ nameKey: "bench_press", muscles: ["chest", "triceps", "shoulders"], type: "free_weight" },
	{ nameKey: "incline_bench_press", muscles: ["chest", "triceps", "shoulders"], type: "free_weight" },
	{ nameKey: "decline_bench_press", muscles: ["chest", "triceps"], type: "free_weight" },
	{ nameKey: "dumbbell_fly", muscles: ["chest", "shoulders"], type: "free_weight" },
	{ nameKey: "cable_fly", muscles: ["chest"], type: "machine" },
	{ nameKey: "dips", muscles: ["chest", "triceps", "shoulders"], type: "bodyweight" },
	{ nameKey: "push_up", muscles: ["chest", "triceps", "shoulders"], type: "bodyweight" },

	// Back
	{ nameKey: "deadlift", muscles: ["back", "glutes", "hamstrings"], type: "free_weight" },
	{ nameKey: "pull_up", muscles: ["back", "biceps"], type: "bodyweight" },
	{ nameKey: "chin_up", muscles: ["back", "biceps"], type: "bodyweight" },
	{ nameKey: "barbell_row", muscles: ["back", "biceps"], type: "free_weight" },
	{ nameKey: "dumbbell_row", muscles: ["back", "biceps"], type: "free_weight" },
	{ nameKey: "lat_pulldown", muscles: ["back", "biceps"], type: "machine" },
	{ nameKey: "seated_cable_row", muscles: ["back", "biceps"], type: "machine" },
	{ nameKey: "t_bar_row", muscles: ["back", "biceps"], type: "free_weight" },
	{ nameKey: "face_pull", muscles: ["shoulders", "back"], type: "machine" },

	// Legs
	{ nameKey: "squat", muscles: ["quads", "glutes", "hamstrings"], type: "free_weight" },
	{ nameKey: "hack_squat", muscles: ["quads", "glutes"], type: "machine" },
	{ nameKey: "leg_press", muscles: ["quads", "glutes", "hamstrings"], type: "machine" },
	{ nameKey: "romanian_deadlift", muscles: ["hamstrings", "glutes", "back"], type: "free_weight" },
	{ nameKey: "leg_curl", muscles: ["hamstrings"], type: "machine" },
	{ nameKey: "leg_extension", muscles: ["quads"], type: "machine" },
	{ nameKey: "bulgarian_split_squat", muscles: ["quads", "glutes", "hamstrings"], type: "free_weight" },
	{ nameKey: "lunge", muscles: ["quads", "glutes", "hamstrings"], type: "free_weight" },
	{ nameKey: "calf_raise", muscles: ["hamstrings"], type: "machine" },

	// Shoulders
	{ nameKey: "overhead_press", muscles: ["shoulders", "triceps"], type: "free_weight" },
	{ nameKey: "dumbbell_shoulder_press", muscles: ["shoulders", "triceps"], type: "free_weight" },
	{ nameKey: "arnold_press", muscles: ["shoulders", "triceps"], type: "free_weight" },
	{ nameKey: "lateral_raise", muscles: ["shoulders"], type: "free_weight" },
	{ nameKey: "front_raise", muscles: ["shoulders"], type: "free_weight" },
	{ nameKey: "rear_delt_fly", muscles: ["shoulders", "back"], type: "free_weight" },
	{ nameKey: "upright_row", muscles: ["shoulders", "biceps"], type: "free_weight" },

	// Arms
	{ nameKey: "barbell_curl", muscles: ["biceps", "forearms"], type: "free_weight" },
	{ nameKey: "dumbbell_curl", muscles: ["biceps", "forearms"], type: "free_weight" },
	{ nameKey: "hammer_curl", muscles: ["biceps", "forearms"], type: "free_weight" },
	{ nameKey: "preacher_curl", muscles: ["biceps"], type: "free_weight" },
	{ nameKey: "tricep_pushdown", muscles: ["triceps"], type: "machine" },
	{ nameKey: "skull_crusher", muscles: ["triceps"], type: "free_weight" },
	{ nameKey: "overhead_tricep_extension", muscles: ["triceps"], type: "free_weight" },
	{ nameKey: "close_grip_bench_press", muscles: ["triceps", "chest"], type: "free_weight" },
	{ nameKey: "tricep_dips", muscles: ["triceps", "chest"], type: "bodyweight" },

	// Core
	{ nameKey: "plank", muscles: ["abs"], type: "bodyweight" },
	{ nameKey: "crunch", muscles: ["abs"], type: "bodyweight" },
	{ nameKey: "leg_raise", muscles: ["abs"], type: "bodyweight" },
	{ nameKey: "ab_wheel_rollout", muscles: ["abs"], type: "bodyweight" },
	{ nameKey: "russian_twist", muscles: ["abs"], type: "bodyweight" },
	{ nameKey: "cable_crunch", muscles: ["abs"], type: "machine" },
];
