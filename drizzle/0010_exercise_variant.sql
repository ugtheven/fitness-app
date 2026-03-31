PRAGMA foreign_keys = OFF;
--> statement-breakpoint

-- ============================================================
-- 1. session_exercises — migrate exercise_id → exercise_variant_id
-- ============================================================

UPDATE `session_exercises` SET `exercise_id` = 'bench_press_barbell' WHERE `exercise_id` = 'bench_press';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'incline_bench_press_barbell' WHERE `exercise_id` = 'incline_bench_press';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'decline_bench_press_barbell' WHERE `exercise_id` = 'decline_bench_press';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'fly_dumbbell' WHERE `exercise_id` = 'dumbbell_fly';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'fly_cable' WHERE `exercise_id` = 'cable_fly';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'dips_bodyweight' WHERE `exercise_id` = 'dips';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'push_up_bodyweight' WHERE `exercise_id` = 'push_up';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'deadlift_barbell' WHERE `exercise_id` = 'deadlift';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'pull_up_bodyweight' WHERE `exercise_id` = 'pull_up';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'chin_up_bodyweight' WHERE `exercise_id` = 'chin_up';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'row_barbell' WHERE `exercise_id` = 'barbell_row';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'row_dumbbell' WHERE `exercise_id` = 'dumbbell_row';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'lat_pulldown_cable' WHERE `exercise_id` = 'lat_pulldown';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'row_cable' WHERE `exercise_id` = 'seated_cable_row';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 't_bar_row_barbell' WHERE `exercise_id` = 't_bar_row';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'face_pull_cable' WHERE `exercise_id` = 'face_pull';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'squat_barbell' WHERE `exercise_id` = 'squat';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'hack_squat_machine' WHERE `exercise_id` = 'hack_squat';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'leg_press_machine' WHERE `exercise_id` = 'leg_press';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'romanian_deadlift_barbell' WHERE `exercise_id` = 'romanian_deadlift';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'leg_curl_machine' WHERE `exercise_id` = 'leg_curl';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'leg_extension_machine' WHERE `exercise_id` = 'leg_extension';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'bulgarian_split_squat_dumbbell' WHERE `exercise_id` = 'bulgarian_split_squat';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'lunge_bodyweight' WHERE `exercise_id` = 'lunge';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'calf_raise_machine' WHERE `exercise_id` = 'calf_raise';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'overhead_press_barbell' WHERE `exercise_id` = 'overhead_press';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'overhead_press_dumbbell' WHERE `exercise_id` = 'dumbbell_shoulder_press';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'arnold_press_dumbbell' WHERE `exercise_id` = 'arnold_press';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'lateral_raise_dumbbell' WHERE `exercise_id` = 'lateral_raise';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'front_raise_dumbbell' WHERE `exercise_id` = 'front_raise';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'rear_delt_fly_dumbbell' WHERE `exercise_id` = 'rear_delt_fly';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'upright_row_barbell' WHERE `exercise_id` = 'upright_row';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'curl_barbell' WHERE `exercise_id` = 'barbell_curl';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'curl_dumbbell' WHERE `exercise_id` = 'dumbbell_curl';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'hammer_curl_dumbbell' WHERE `exercise_id` = 'hammer_curl';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'preacher_curl_barbell' WHERE `exercise_id` = 'preacher_curl';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'tricep_pushdown_cable' WHERE `exercise_id` = 'tricep_pushdown';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'skull_crusher_barbell' WHERE `exercise_id` = 'skull_crusher';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'overhead_tricep_extension_dumbbell' WHERE `exercise_id` = 'overhead_tricep_extension';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'close_grip_bench_press_barbell' WHERE `exercise_id` = 'close_grip_bench_press';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'tricep_dips_bodyweight' WHERE `exercise_id` = 'tricep_dips';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'plank_bodyweight' WHERE `exercise_id` = 'plank';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'crunch_bodyweight' WHERE `exercise_id` = 'crunch';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'leg_raise_bodyweight' WHERE `exercise_id` = 'leg_raise';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'ab_wheel_rollout_bodyweight' WHERE `exercise_id` = 'ab_wheel_rollout';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'russian_twist_bodyweight' WHERE `exercise_id` = 'russian_twist';
--> statement-breakpoint
UPDATE `session_exercises` SET `exercise_id` = 'crunch_cable' WHERE `exercise_id` = 'cable_crunch';
--> statement-breakpoint

ALTER TABLE `session_exercises` RENAME COLUMN `exercise_id` TO `exercise_variant_id`;
--> statement-breakpoint
ALTER TABLE `session_exercises` ADD COLUMN `is_unilateral` INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint

-- ============================================================
-- 2. workout_exercises — migrate exercise_id → exercise_variant_id
-- ============================================================

UPDATE `workout_exercises` SET `exercise_id` = 'bench_press_barbell' WHERE `exercise_id` = 'bench_press';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'incline_bench_press_barbell' WHERE `exercise_id` = 'incline_bench_press';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'decline_bench_press_barbell' WHERE `exercise_id` = 'decline_bench_press';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'fly_dumbbell' WHERE `exercise_id` = 'dumbbell_fly';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'fly_cable' WHERE `exercise_id` = 'cable_fly';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'dips_bodyweight' WHERE `exercise_id` = 'dips';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'push_up_bodyweight' WHERE `exercise_id` = 'push_up';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'deadlift_barbell' WHERE `exercise_id` = 'deadlift';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'pull_up_bodyweight' WHERE `exercise_id` = 'pull_up';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'chin_up_bodyweight' WHERE `exercise_id` = 'chin_up';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'row_barbell' WHERE `exercise_id` = 'barbell_row';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'row_dumbbell' WHERE `exercise_id` = 'dumbbell_row';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'lat_pulldown_cable' WHERE `exercise_id` = 'lat_pulldown';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'row_cable' WHERE `exercise_id` = 'seated_cable_row';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 't_bar_row_barbell' WHERE `exercise_id` = 't_bar_row';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'face_pull_cable' WHERE `exercise_id` = 'face_pull';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'squat_barbell' WHERE `exercise_id` = 'squat';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'hack_squat_machine' WHERE `exercise_id` = 'hack_squat';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'leg_press_machine' WHERE `exercise_id` = 'leg_press';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'romanian_deadlift_barbell' WHERE `exercise_id` = 'romanian_deadlift';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'leg_curl_machine' WHERE `exercise_id` = 'leg_curl';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'leg_extension_machine' WHERE `exercise_id` = 'leg_extension';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'bulgarian_split_squat_dumbbell' WHERE `exercise_id` = 'bulgarian_split_squat';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'lunge_bodyweight' WHERE `exercise_id` = 'lunge';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'calf_raise_machine' WHERE `exercise_id` = 'calf_raise';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'overhead_press_barbell' WHERE `exercise_id` = 'overhead_press';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'overhead_press_dumbbell' WHERE `exercise_id` = 'dumbbell_shoulder_press';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'arnold_press_dumbbell' WHERE `exercise_id` = 'arnold_press';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'lateral_raise_dumbbell' WHERE `exercise_id` = 'lateral_raise';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'front_raise_dumbbell' WHERE `exercise_id` = 'front_raise';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'rear_delt_fly_dumbbell' WHERE `exercise_id` = 'rear_delt_fly';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'upright_row_barbell' WHERE `exercise_id` = 'upright_row';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'curl_barbell' WHERE `exercise_id` = 'barbell_curl';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'curl_dumbbell' WHERE `exercise_id` = 'dumbbell_curl';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'hammer_curl_dumbbell' WHERE `exercise_id` = 'hammer_curl';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'preacher_curl_barbell' WHERE `exercise_id` = 'preacher_curl';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'tricep_pushdown_cable' WHERE `exercise_id` = 'tricep_pushdown';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'skull_crusher_barbell' WHERE `exercise_id` = 'skull_crusher';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'overhead_tricep_extension_dumbbell' WHERE `exercise_id` = 'overhead_tricep_extension';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'close_grip_bench_press_barbell' WHERE `exercise_id` = 'close_grip_bench_press';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'tricep_dips_bodyweight' WHERE `exercise_id` = 'tricep_dips';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'plank_bodyweight' WHERE `exercise_id` = 'plank';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'crunch_bodyweight' WHERE `exercise_id` = 'crunch';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'leg_raise_bodyweight' WHERE `exercise_id` = 'leg_raise';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'ab_wheel_rollout_bodyweight' WHERE `exercise_id` = 'ab_wheel_rollout';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'russian_twist_bodyweight' WHERE `exercise_id` = 'russian_twist';
--> statement-breakpoint
UPDATE `workout_exercises` SET `exercise_id` = 'crunch_cable' WHERE `exercise_id` = 'cable_crunch';
--> statement-breakpoint

ALTER TABLE `workout_exercises` RENAME COLUMN `exercise_id` TO `exercise_variant_id`;
--> statement-breakpoint
ALTER TABLE `workout_exercises` ADD COLUMN `is_unilateral` INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint

-- ============================================================
-- 3. workout_sets — reps nullable + reps_left / reps_right
-- SQLite ne supporte pas ALTER COLUMN, on recrée la table
-- ============================================================

CREATE TABLE `workout_sets_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `workout_exercise_id` integer NOT NULL REFERENCES `workout_exercises`(`id`) ON DELETE CASCADE,
  `set_index` integer NOT NULL,
  `reps` integer,
  `reps_left` integer,
  `reps_right` integer,
  `weight` real,
  `completed_at` text NOT NULL
);
--> statement-breakpoint

INSERT INTO `workout_sets_new` (`id`, `workout_exercise_id`, `set_index`, `reps`, `weight`, `completed_at`)
  SELECT `id`, `workout_exercise_id`, `set_index`, `reps`, `weight`, `completed_at` FROM `workout_sets`;
--> statement-breakpoint

DROP TABLE `workout_sets`;
--> statement-breakpoint

ALTER TABLE `workout_sets_new` RENAME TO `workout_sets`;
--> statement-breakpoint

CREATE UNIQUE INDEX `workout_sets_exercise_set_idx` ON `workout_sets` (`workout_exercise_id`, `set_index`);
--> statement-breakpoint

PRAGMA foreign_keys = ON;
