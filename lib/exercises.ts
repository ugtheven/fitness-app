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

export type Exercise = {
	nameKey: string;
	muscles: MuscleGroup[];
};

export const EXERCISES: Exercise[] = [
	// Chest
	{ nameKey: "bench_press", muscles: ["chest", "triceps", "shoulders"] },
	{ nameKey: "incline_bench_press", muscles: ["chest", "triceps", "shoulders"] },
	{ nameKey: "decline_bench_press", muscles: ["chest", "triceps"] },
	{ nameKey: "dumbbell_fly", muscles: ["chest", "shoulders"] },
	{ nameKey: "cable_fly", muscles: ["chest"] },
	{ nameKey: "dips", muscles: ["chest", "triceps", "shoulders"] },
	{ nameKey: "push_up", muscles: ["chest", "triceps", "shoulders"] },

	// Back
	{ nameKey: "deadlift", muscles: ["back", "glutes", "hamstrings"] },
	{ nameKey: "pull_up", muscles: ["back", "biceps"] },
	{ nameKey: "chin_up", muscles: ["back", "biceps"] },
	{ nameKey: "barbell_row", muscles: ["back", "biceps"] },
	{ nameKey: "dumbbell_row", muscles: ["back", "biceps"] },
	{ nameKey: "lat_pulldown", muscles: ["back", "biceps"] },
	{ nameKey: "seated_cable_row", muscles: ["back", "biceps"] },
	{ nameKey: "t_bar_row", muscles: ["back", "biceps"] },
	{ nameKey: "face_pull", muscles: ["shoulders", "back"] },

	// Legs
	{ nameKey: "squat", muscles: ["quads", "glutes", "hamstrings"] },
	{ nameKey: "hack_squat", muscles: ["quads", "glutes"] },
	{ nameKey: "leg_press", muscles: ["quads", "glutes", "hamstrings"] },
	{ nameKey: "romanian_deadlift", muscles: ["hamstrings", "glutes", "back"] },
	{ nameKey: "leg_curl", muscles: ["hamstrings"] },
	{ nameKey: "leg_extension", muscles: ["quads"] },
	{ nameKey: "bulgarian_split_squat", muscles: ["quads", "glutes", "hamstrings"] },
	{ nameKey: "lunge", muscles: ["quads", "glutes", "hamstrings"] },
	{ nameKey: "calf_raise", muscles: ["hamstrings"] },

	// Shoulders
	{ nameKey: "overhead_press", muscles: ["shoulders", "triceps"] },
	{ nameKey: "dumbbell_shoulder_press", muscles: ["shoulders", "triceps"] },
	{ nameKey: "arnold_press", muscles: ["shoulders", "triceps"] },
	{ nameKey: "lateral_raise", muscles: ["shoulders"] },
	{ nameKey: "front_raise", muscles: ["shoulders"] },
	{ nameKey: "rear_delt_fly", muscles: ["shoulders", "back"] },
	{ nameKey: "upright_row", muscles: ["shoulders", "biceps"] },

	// Arms
	{ nameKey: "barbell_curl", muscles: ["biceps", "forearms"] },
	{ nameKey: "dumbbell_curl", muscles: ["biceps", "forearms"] },
	{ nameKey: "hammer_curl", muscles: ["biceps", "forearms"] },
	{ nameKey: "preacher_curl", muscles: ["biceps"] },
	{ nameKey: "tricep_pushdown", muscles: ["triceps"] },
	{ nameKey: "skull_crusher", muscles: ["triceps"] },
	{ nameKey: "overhead_tricep_extension", muscles: ["triceps"] },
	{ nameKey: "close_grip_bench_press", muscles: ["triceps", "chest"] },
	{ nameKey: "tricep_dips", muscles: ["triceps", "chest"] },

	// Core
	{ nameKey: "plank", muscles: ["abs"] },
	{ nameKey: "crunch", muscles: ["abs"] },
	{ nameKey: "leg_raise", muscles: ["abs"] },
	{ nameKey: "ab_wheel_rollout", muscles: ["abs"] },
	{ nameKey: "russian_twist", muscles: ["abs"] },
	{ nameKey: "cable_crunch", muscles: ["abs"] },
];
