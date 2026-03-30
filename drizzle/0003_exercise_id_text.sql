PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `session_exercises_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`exercise_id` text NOT NULL,
	`sets` integer DEFAULT 3 NOT NULL,
	`reps` integer DEFAULT 10 NOT NULL,
	`default_weight` real,
	`rest_time` integer DEFAULT 90 NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `session_exercises_new` SELECT `id`, `session_id`, CAST(`exercise_id` AS TEXT), `sets`, `reps`, `default_weight`, `rest_time` FROM `session_exercises`;
--> statement-breakpoint
DROP TABLE `session_exercises`;
--> statement-breakpoint
ALTER TABLE `session_exercises_new` RENAME TO `session_exercises`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
