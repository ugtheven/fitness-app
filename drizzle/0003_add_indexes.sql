CREATE INDEX `workout_sessions_date_idx` ON `workout_sessions` (`date`);
--> statement-breakpoint

CREATE INDEX `workout_exercises_variant_idx` ON `workout_exercises` (`exercise_variant_id`);
--> statement-breakpoint

CREATE UNIQUE INDEX `body_measurements_date_idx` ON `body_measurements` (`date`);
