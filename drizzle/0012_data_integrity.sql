-- Partial unique indexes: enforce single active program and single active diet
CREATE UNIQUE INDEX IF NOT EXISTS `programs_single_active_idx` ON `programs` (`is_active`) WHERE `is_active` = 1;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `diets_single_active_idx` ON `diets` (`is_active`) WHERE `is_active` = 1;
--> statement-breakpoint
-- Safety net: ensure user_level row exists (idempotent)
INSERT OR IGNORE INTO `user_level` (`id`, `total_xp`, `level`) VALUES (1, 0, 1);
