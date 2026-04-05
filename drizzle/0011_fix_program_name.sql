-- Add missing program_name column to workout_sessions
ALTER TABLE `workout_sessions` ADD COLUMN `program_name` text;
--> statement-breakpoint

-- Backfill from programs table
UPDATE `workout_sessions`
SET `program_name` = (SELECT `name` FROM `programs` WHERE `programs`.`id` = `workout_sessions`.`program_id`)
WHERE `program_name` IS NULL AND `program_id` IS NOT NULL;
