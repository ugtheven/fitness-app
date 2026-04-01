CREATE TABLE `programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`is_active` integer NOT NULL DEFAULT 0,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint

CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`program_id` integer NOT NULL,
	`name` text NOT NULL,
	`order` integer NOT NULL DEFAULT 0,
	`created_at` text,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE TABLE `session_exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`exercise_variant_id` text NOT NULL,
	`is_unilateral` integer NOT NULL DEFAULT 0,
	`order` integer NOT NULL DEFAULT 0,
	`sets` integer NOT NULL DEFAULT 3,
	`reps` integer NOT NULL DEFAULT 10,
	`default_weight` real,
	`rest_time` integer NOT NULL DEFAULT 90,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE TABLE `workout_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer,
	`program_id` integer,
	`started_at` text NOT NULL,
	`ended_at` text,
	`date` text NOT NULL DEFAULT '',
	`status` text NOT NULL DEFAULT 'in_progress',
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE SET NULL,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint

CREATE TABLE `workout_exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workout_session_id` integer NOT NULL,
	`session_exercise_id` integer,
	`exercise_variant_id` text NOT NULL,
	`is_unilateral` integer NOT NULL DEFAULT 0,
	`prescribed_sets` integer NOT NULL,
	`prescribed_reps` integer NOT NULL,
	`prescribed_weight` real,
	`status` text NOT NULL DEFAULT 'pending',
	FOREIGN KEY (`workout_session_id`) REFERENCES `workout_sessions`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`session_exercise_id`) REFERENCES `session_exercises`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint

CREATE TABLE `workout_sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workout_exercise_id` integer NOT NULL,
	`set_index` integer NOT NULL,
	`reps` integer,
	`reps_left` integer,
	`reps_right` integer,
	`weight` real,
	`completed_at` text NOT NULL,
	FOREIGN KEY (`workout_exercise_id`) REFERENCES `workout_exercises`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE UNIQUE INDEX `workout_sets_exercise_set_idx` ON `workout_sets` (`workout_exercise_id`, `set_index`);
--> statement-breakpoint

CREATE UNIQUE INDEX `programs_one_active_idx` ON `programs` (`is_active`) WHERE `is_active` = 1;
