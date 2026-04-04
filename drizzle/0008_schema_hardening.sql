-- Snapshot session/program names on workout_sessions
ALTER TABLE `workout_sessions` ADD COLUMN `session_name` text;
ALTER TABLE `workout_sessions` ADD COLUMN `program_name` text;

-- Backfill existing workout sessions with current names
UPDATE `workout_sessions`
SET `session_name` = (SELECT `name` FROM `sessions` WHERE `sessions`.`id` = `workout_sessions`.`session_id`),
    `program_name` = (SELECT `name` FROM `programs` WHERE `programs`.`id` = `workout_sessions`.`program_id`);

-- Index for filtering by status + date (used in PRs, achievements, streaks)
CREATE INDEX IF NOT EXISTS `workout_sessions_status_date_idx` ON `workout_sessions` (`status`, `date`);

-- Convert xp_logs.source_id from integer to text
-- SQLite doesn't support ALTER COLUMN, so we recreate the column.
-- Since source_id is nullable and part of a unique index, we need to:
-- 1. Drop the old unique index
-- 2. Create a new text column
-- 3. Copy data
-- 4. Drop old column
-- 5. Rename new column
-- 6. Recreate unique index
DROP INDEX IF EXISTS `xp_logs_source_idx`;
ALTER TABLE `xp_logs` ADD COLUMN `source_id_text` text;
UPDATE `xp_logs` SET `source_id_text` = CAST(`source_id` AS TEXT) WHERE `source_id` IS NOT NULL;
ALTER TABLE `xp_logs` DROP COLUMN `source_id`;
ALTER TABLE `xp_logs` RENAME COLUMN `source_id_text` TO `source_id`;
CREATE UNIQUE INDEX `xp_logs_source_idx` ON `xp_logs` (`source`, `source_id`);

-- Add exercise_variant_id to goals (for performance goals like exerciseWeight)
ALTER TABLE `goals` ADD COLUMN `exercise_variant_id` text;
