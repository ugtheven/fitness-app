CREATE TABLE `goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`target_value` real NOT NULL,
	`start_value` real NOT NULL,
	`deadline` text NOT NULL,
	`status` text NOT NULL DEFAULT 'active',
	`created_at` text,
	`updated_at` text
);
