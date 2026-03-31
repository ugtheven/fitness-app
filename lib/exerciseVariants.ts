import type { ExerciseVariant } from "./exerciseTypes";

export const EXERCISE_VARIANTS: ExerciseVariant[] = [
	// Chest — Bench Press
	{ id: "bench_press_barbell", baseId: "bench_press", nameKey: "bench_press_barbell", equipment: "barbell" },
	{ id: "bench_press_dumbbell", baseId: "bench_press", nameKey: "bench_press_dumbbell", equipment: "dumbbell" },
	{ id: "incline_bench_press_barbell", baseId: "incline_bench_press", nameKey: "incline_bench_press_barbell", equipment: "barbell" },
	{ id: "incline_bench_press_dumbbell", baseId: "incline_bench_press", nameKey: "incline_bench_press_dumbbell", equipment: "dumbbell" },
	{ id: "decline_bench_press_barbell", baseId: "decline_bench_press", nameKey: "decline_bench_press_barbell", equipment: "barbell" },
	{ id: "decline_bench_press_dumbbell", baseId: "decline_bench_press", nameKey: "decline_bench_press_dumbbell", equipment: "dumbbell" },

	// Chest — Fly
	{ id: "fly_dumbbell", baseId: "fly", nameKey: "fly_dumbbell", equipment: "dumbbell" },
	{ id: "fly_cable", baseId: "fly", nameKey: "fly_cable", equipment: "cable" },

	// Chest — Bodyweight
	{ id: "dips_bodyweight", baseId: "dips", nameKey: "dips_bodyweight", equipment: "bodyweight" },
	{ id: "push_up_bodyweight", baseId: "push_up", nameKey: "push_up_bodyweight", equipment: "bodyweight" },

	// Back
	{ id: "deadlift_barbell", baseId: "deadlift", nameKey: "deadlift_barbell", equipment: "barbell" },
	{ id: "pull_up_bodyweight", baseId: "pull_up", nameKey: "pull_up_bodyweight", equipment: "bodyweight" },
	{ id: "chin_up_bodyweight", baseId: "chin_up", nameKey: "chin_up_bodyweight", equipment: "bodyweight" },
	{ id: "row_barbell", baseId: "row", nameKey: "row_barbell", equipment: "barbell" },
	{ id: "row_dumbbell", baseId: "row", nameKey: "row_dumbbell", equipment: "dumbbell" },
	{ id: "row_cable", baseId: "row", nameKey: "row_cable", equipment: "cable" },
	{ id: "lat_pulldown_cable", baseId: "lat_pulldown", nameKey: "lat_pulldown_cable", equipment: "cable" },
	{ id: "t_bar_row_barbell", baseId: "t_bar_row", nameKey: "t_bar_row_barbell", equipment: "barbell" },
	{ id: "face_pull_cable", baseId: "face_pull", nameKey: "face_pull_cable", equipment: "cable" },

	// Legs
	{ id: "squat_barbell", baseId: "squat", nameKey: "squat_barbell", equipment: "barbell" },
	{ id: "hack_squat_machine", baseId: "hack_squat", nameKey: "hack_squat_machine", equipment: "machine" },
	{ id: "leg_press_machine", baseId: "leg_press", nameKey: "leg_press_machine", equipment: "machine" },
	{ id: "romanian_deadlift_barbell", baseId: "romanian_deadlift", nameKey: "romanian_deadlift_barbell", equipment: "barbell" },
	{ id: "romanian_deadlift_dumbbell", baseId: "romanian_deadlift", nameKey: "romanian_deadlift_dumbbell", equipment: "dumbbell" },
	{ id: "leg_curl_machine", baseId: "leg_curl", nameKey: "leg_curl_machine", equipment: "machine" },
	{ id: "leg_extension_machine", baseId: "leg_extension", nameKey: "leg_extension_machine", equipment: "machine" },
	{ id: "bulgarian_split_squat_dumbbell", baseId: "bulgarian_split_squat", nameKey: "bulgarian_split_squat_dumbbell", equipment: "dumbbell" },
	{ id: "bulgarian_split_squat_barbell", baseId: "bulgarian_split_squat", nameKey: "bulgarian_split_squat_barbell", equipment: "barbell" },
	{ id: "lunge_bodyweight", baseId: "lunge", nameKey: "lunge_bodyweight", equipment: "bodyweight" },
	{ id: "lunge_dumbbell", baseId: "lunge", nameKey: "lunge_dumbbell", equipment: "dumbbell" },
	{ id: "lunge_barbell", baseId: "lunge", nameKey: "lunge_barbell", equipment: "barbell" },
	{ id: "calf_raise_machine", baseId: "calf_raise", nameKey: "calf_raise_machine", equipment: "machine" },
	{ id: "calf_raise_bodyweight", baseId: "calf_raise", nameKey: "calf_raise_bodyweight", equipment: "bodyweight" },

	// Shoulders
	{ id: "overhead_press_barbell", baseId: "overhead_press", nameKey: "overhead_press_barbell", equipment: "barbell" },
	{ id: "overhead_press_dumbbell", baseId: "overhead_press", nameKey: "overhead_press_dumbbell", equipment: "dumbbell" },
	{ id: "arnold_press_dumbbell", baseId: "arnold_press", nameKey: "arnold_press_dumbbell", equipment: "dumbbell" },
	{ id: "lateral_raise_dumbbell", baseId: "lateral_raise", nameKey: "lateral_raise_dumbbell", equipment: "dumbbell" },
	{ id: "lateral_raise_cable", baseId: "lateral_raise", nameKey: "lateral_raise_cable", equipment: "cable" },
	{ id: "front_raise_dumbbell", baseId: "front_raise", nameKey: "front_raise_dumbbell", equipment: "dumbbell" },
	{ id: "rear_delt_fly_dumbbell", baseId: "rear_delt_fly", nameKey: "rear_delt_fly_dumbbell", equipment: "dumbbell" },
	{ id: "rear_delt_fly_cable", baseId: "rear_delt_fly", nameKey: "rear_delt_fly_cable", equipment: "cable" },
	{ id: "upright_row_barbell", baseId: "upright_row", nameKey: "upright_row_barbell", equipment: "barbell" },

	// Arms — Biceps
	{ id: "curl_barbell", baseId: "curl", nameKey: "curl_barbell", equipment: "barbell" },
	{ id: "curl_dumbbell", baseId: "curl", nameKey: "curl_dumbbell", equipment: "dumbbell" },
	{ id: "curl_cable", baseId: "curl", nameKey: "curl_cable", equipment: "cable" },
	{ id: "hammer_curl_dumbbell", baseId: "hammer_curl", nameKey: "hammer_curl_dumbbell", equipment: "dumbbell" },
	{ id: "preacher_curl_barbell", baseId: "preacher_curl", nameKey: "preacher_curl_barbell", equipment: "barbell" },
	{ id: "preacher_curl_dumbbell", baseId: "preacher_curl", nameKey: "preacher_curl_dumbbell", equipment: "dumbbell" },

	// Arms — Triceps
	{ id: "tricep_pushdown_cable", baseId: "tricep_pushdown", nameKey: "tricep_pushdown_cable", equipment: "cable" },
	{ id: "skull_crusher_barbell", baseId: "skull_crusher", nameKey: "skull_crusher_barbell", equipment: "barbell" },
	{ id: "skull_crusher_dumbbell", baseId: "skull_crusher", nameKey: "skull_crusher_dumbbell", equipment: "dumbbell" },
	{ id: "overhead_tricep_extension_dumbbell", baseId: "overhead_tricep_extension", nameKey: "overhead_tricep_extension_dumbbell", equipment: "dumbbell" },
	{ id: "overhead_tricep_extension_cable", baseId: "overhead_tricep_extension", nameKey: "overhead_tricep_extension_cable", equipment: "cable" },
	{ id: "close_grip_bench_press_barbell", baseId: "close_grip_bench_press", nameKey: "close_grip_bench_press_barbell", equipment: "barbell" },
	{ id: "tricep_dips_bodyweight", baseId: "tricep_dips", nameKey: "tricep_dips_bodyweight", equipment: "bodyweight" },

	// Core
	{ id: "plank_bodyweight", baseId: "plank", nameKey: "plank_bodyweight", equipment: "bodyweight" },
	{ id: "crunch_bodyweight", baseId: "crunch", nameKey: "crunch_bodyweight", equipment: "bodyweight" },
	{ id: "crunch_cable", baseId: "crunch", nameKey: "crunch_cable", equipment: "cable" },
	{ id: "leg_raise_bodyweight", baseId: "leg_raise", nameKey: "leg_raise_bodyweight", equipment: "bodyweight" },
	{ id: "ab_wheel_rollout_bodyweight", baseId: "ab_wheel_rollout", nameKey: "ab_wheel_rollout_bodyweight", equipment: "bodyweight" },
	{ id: "russian_twist_bodyweight", baseId: "russian_twist", nameKey: "russian_twist_bodyweight", equipment: "bodyweight" },
	{ id: "russian_twist_dumbbell", baseId: "russian_twist", nameKey: "russian_twist_dumbbell", equipment: "dumbbell" },
];

export const EXERCISE_VARIANTS_BY_ID = Object.fromEntries(
	EXERCISE_VARIANTS.map((variant) => [variant.id, variant]),
) as Record<string, ExerciseVariant>;
