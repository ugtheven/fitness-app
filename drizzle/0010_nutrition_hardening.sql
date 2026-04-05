-- Add dietId to dailyMealLogs for history tracking
ALTER TABLE `daily_meal_logs` ADD COLUMN `diet_id` integer REFERENCES `diets`(`id`) ON DELETE SET NULL;
--> statement-breakpoint

-- Backfill dietId from existing dietMealId → dietMeals.dietId
UPDATE `daily_meal_logs` SET `diet_id` = (
	SELECT `diet_id` FROM `diet_meals` WHERE `diet_meals`.`id` = `daily_meal_logs`.`diet_meal_id`
) WHERE `diet_meal_id` IS NOT NULL;
--> statement-breakpoint

-- Add category to customFoods
ALTER TABLE `custom_foods` ADD COLUMN `category` text NOT NULL DEFAULT 'other';
--> statement-breakpoint

-- Unique index to prevent double logging same meal same day
CREATE UNIQUE INDEX `daily_meal_logs_date_meal_idx` ON `daily_meal_logs` (`date`, `diet_meal_id`);
