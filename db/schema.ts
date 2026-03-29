import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const programs = sqliteTable("programs", {
	id: int("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const programExercises = sqliteTable("program_exercises", {
	id: int("id").primaryKey({ autoIncrement: true }),
	programId: int("program_id")
		.notNull()
		.references(() => programs.id, { onDelete: "cascade" }),
	exerciseId: int("exercise_id").notNull(),
	order: int("order").notNull().default(0),
	defaultWeight: real("default_weight"),
	targetSets: int("target_sets").notNull().default(3),
	targetReps: int("target_reps").notNull().default(10),
	restTime: int("rest_time").notNull().default(90),
});
