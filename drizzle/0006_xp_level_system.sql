CREATE TABLE `xp_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`amount` integer NOT NULL,
	`source` text NOT NULL,
	`source_id` integer,
	`date` text NOT NULL,
	`created_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `xp_logs_source_idx` ON `xp_logs` (`source`,`source_id`);
--> statement-breakpoint
CREATE TABLE `user_level` (
	`id` integer PRIMARY KEY NOT NULL,
	`total_xp` integer NOT NULL DEFAULT 0,
	`level` integer NOT NULL DEFAULT 1,
	`updated_at` text
);
--> statement-breakpoint
INSERT INTO `user_level` (`id`, `total_xp`, `level`) VALUES (1, 0, 1);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`achievement_id` text NOT NULL,
	`unlocked_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_achievements_achievement_id_unique` ON `user_achievements` (`achievement_id`);
