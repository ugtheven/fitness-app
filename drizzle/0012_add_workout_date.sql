ALTER TABLE `workout_sessions` ADD COLUMN `date` text NOT NULL DEFAULT '';
--> statement-breakpoint
UPDATE `workout_sessions` SET `date` = substr(`started_at`, 1, 10) WHERE `date` = '';
