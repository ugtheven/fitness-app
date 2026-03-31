-- workoutSessions: snapshot programId (survives program deletion)
ALTER TABLE workout_sessions ADD COLUMN program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL;
--> statement-breakpoint

-- workoutExercises: snapshot prescribed weight
ALTER TABLE workout_exercises ADD COLUMN prescribed_weight REAL;
--> statement-breakpoint

-- programs: enforce single active program at DB level
CREATE UNIQUE INDEX programs_one_active_idx ON programs (is_active) WHERE is_active = 1;
