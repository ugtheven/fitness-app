-- Désactiver les FK pour les DROP/CREATE
PRAGMA foreign_keys = OFF;
--> statement-breakpoint

-- Nettoyer les tables workout (ordre inverse des dépendances)
DROP TABLE IF EXISTS `workout_sets`;
--> statement-breakpoint
DROP TABLE IF EXISTS `workout_exercises`;
--> statement-breakpoint
DROP TABLE IF EXISTS `workout_sessions`;
--> statement-breakpoint
DROP TABLE IF EXISTS `workout_sessions_new`;
--> statement-breakpoint
DROP TABLE IF EXISTS `workout_exercises_new`;
--> statement-breakpoint

-- Recréer workout_sessions : session_id nullable (set null si session supprimée)
CREATE TABLE `workout_sessions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `session_id` integer REFERENCES `sessions`(`id`) ON DELETE SET NULL,
  `started_at` text NOT NULL,
  `ended_at` text,
  `status` text DEFAULT 'in_progress' NOT NULL
);
--> statement-breakpoint

-- Recréer workout_exercises : session_exercise_id nullable + exerciseId dénormalisé + snapshot prescribed
CREATE TABLE `workout_exercises` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `workout_session_id` integer NOT NULL REFERENCES `workout_sessions`(`id`) ON DELETE CASCADE,
  `session_exercise_id` integer REFERENCES `session_exercises`(`id`) ON DELETE SET NULL,
  `exercise_id` text DEFAULT '' NOT NULL,
  `prescribed_sets` integer DEFAULT 0 NOT NULL,
  `prescribed_reps` integer DEFAULT 0 NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint

-- Recréer workout_sets avec contrainte d'unicité
CREATE TABLE `workout_sets` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `workout_exercise_id` integer NOT NULL REFERENCES `workout_exercises`(`id`) ON DELETE CASCADE,
  `set_index` integer NOT NULL,
  `reps` integer NOT NULL,
  `weight` real,
  `completed_at` text NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX `workout_sets_exercise_set_idx` ON `workout_sets` (`workout_exercise_id`, `set_index`);
--> statement-breakpoint

-- Réactiver les FK
PRAGMA foreign_keys = ON;
