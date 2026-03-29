CREATE TABLE `session_exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`sets` integer DEFAULT 3 NOT NULL,
	`reps` integer DEFAULT 10 NOT NULL,
	`default_weight` real,
	`rest_time` integer DEFAULT 90 NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
