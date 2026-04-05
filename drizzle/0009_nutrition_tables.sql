CREATE TABLE `diets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`calorie_goal` integer,
	`protein_goal` integer,
	`carb_goal` integer,
	`fat_goal` integer,
	`is_active` integer NOT NULL DEFAULT 0,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint

CREATE UNIQUE INDEX `diets_one_active_idx` ON `diets` (`is_active`) WHERE `is_active` = 1;
--> statement-breakpoint

CREATE TABLE `diet_meals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`diet_id` integer NOT NULL,
	`name` text NOT NULL,
	`order` integer NOT NULL DEFAULT 0,
	`target_time` text,
	`created_at` text,
	FOREIGN KEY (`diet_id`) REFERENCES `diets`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE TABLE `diet_meal_foods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`diet_meal_id` integer NOT NULL,
	`food_source` text NOT NULL,
	`food_id` text NOT NULL,
	`name` text NOT NULL,
	`quantity` real NOT NULL,
	`calories_per_100g` real NOT NULL,
	`protein_per_100g` real NOT NULL,
	`carbs_per_100g` real NOT NULL,
	`fat_per_100g` real NOT NULL,
	`order` integer NOT NULL DEFAULT 0,
	`created_at` text,
	FOREIGN KEY (`diet_meal_id`) REFERENCES `diet_meals`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE TABLE `custom_foods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`calories_per_100g` real NOT NULL,
	`protein_per_100g` real NOT NULL,
	`carbs_per_100g` real NOT NULL,
	`fat_per_100g` real NOT NULL,
	`created_at` text
);
--> statement-breakpoint

CREATE TABLE `cached_api_foods` (
	`barcode` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`calories_per_100g` real,
	`protein_per_100g` real,
	`carbs_per_100g` real,
	`fat_per_100g` real,
	`image_url` text,
	`cached_at` text
);
--> statement-breakpoint

CREATE TABLE `daily_meal_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`diet_meal_id` integer,
	`meal_name` text NOT NULL,
	`order` integer NOT NULL DEFAULT 0,
	`status` text NOT NULL DEFAULT 'confirmed',
	`total_calories` real NOT NULL DEFAULT 0,
	`total_protein` real NOT NULL DEFAULT 0,
	`total_carbs` real NOT NULL DEFAULT 0,
	`total_fat` real NOT NULL DEFAULT 0,
	`logged_at` text,
	FOREIGN KEY (`diet_meal_id`) REFERENCES `diet_meals`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint

CREATE INDEX `daily_meal_logs_date_idx` ON `daily_meal_logs` (`date`);
