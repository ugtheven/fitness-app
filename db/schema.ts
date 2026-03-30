import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const programs = sqliteTable("programs", {
	id: int("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const sessions = sqliteTable("sessions", {
	id: int("id").primaryKey({ autoIncrement: true }),
	programId: int("program_id")
		.notNull()
		.references(() => programs.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const sessionExercises = sqliteTable("session_exercises", {
	id: int("id").primaryKey({ autoIncrement: true }),
	sessionId: int("session_id")
		.notNull()
		.references(() => sessions.id, { onDelete: "cascade" }),
	exerciseId: text("exercise_id").notNull(),
	sets: int("sets").notNull().default(3),
	reps: int("reps").notNull().default(10),
	defaultWeight: real("default_weight"),
	restTime: int("rest_time").notNull().default(90),
});
