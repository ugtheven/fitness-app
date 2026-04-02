CREATE TABLE `user_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`height_cm` real,
	`updated_at` text
);
--> statement-breakpoint

CREATE TABLE `weight_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`weight_kg` real NOT NULL,
	`created_at` text
);
--> statement-breakpoint

CREATE UNIQUE INDEX `weight_logs_date_idx` ON `weight_logs` (`date`);
--> statement-breakpoint

CREATE TABLE `body_measurements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`body_fat` real,
	`shoulders` real,
	`chest` real,
	`waist` real,
	`hips` real,
	`neck` real,
	`arms` real,
	`thigh` real,
	`calf` real,
	`created_at` text
);
