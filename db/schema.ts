import { int, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const programs = sqliteTable("programs", {
	id: int("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	isActive: int("is_active", { mode: "boolean" }).notNull().default(false),
	createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const sessions = sqliteTable("sessions", {
	id: int("id").primaryKey({ autoIncrement: true }),
	programId: int("program_id")
		.notNull()
		.references(() => programs.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	order: int("order").notNull().default(0),
	createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const sessionExercises = sqliteTable("session_exercises", {
	id: int("id").primaryKey({ autoIncrement: true }),
	sessionId: int("session_id")
		.notNull()
		.references(() => sessions.id, { onDelete: "cascade" }),
	exerciseId: text("exercise_id").notNull(),
	order: int("order").notNull().default(0),
	sets: int("sets").notNull().default(3),
	reps: int("reps").notNull().default(10),
	defaultWeight: real("default_weight"),
	restTime: int("rest_time").notNull().default(90),
});

export const workoutSessions = sqliteTable("workout_sessions", {
	id: int("id").primaryKey({ autoIncrement: true }),
	// Nullable: set null si la session de programme est supprimée (historique conservé)
	sessionId: int("session_id").references(() => sessions.id, { onDelete: "set null" }),
	startedAt: text("started_at").notNull(),
	endedAt: text("ended_at"),
	status: text("status", { enum: ["in_progress", "completed"] })
		.notNull()
		.default("in_progress"),
});

export const workoutExercises = sqliteTable(
	"workout_exercises",
	{
		id: int("id").primaryKey({ autoIncrement: true }),
		workoutSessionId: int("workout_session_id")
			.notNull()
			.references(() => workoutSessions.id, { onDelete: "cascade" }),
		// Nullable: set null si l'exercice de programme est supprimé (historique conservé)
		sessionExerciseId: int("session_exercise_id").references(() => sessionExercises.id, {
			onDelete: "set null",
		}),
		// Dénormalisé: permet de requêter l'historique par exercice sans JOIN
		exerciseId: text("exercise_id").notNull(),
		// Snapshot au moment de la séance: les stats restent cohérentes même si le programme change
		prescribedSets: int("prescribed_sets").notNull(),
		prescribedReps: int("prescribed_reps").notNull(),
		status: text("status", { enum: ["pending", "completed", "skipped"] })
			.notNull()
			.default("pending"),
	},
);

export const workoutSets = sqliteTable(
	"workout_sets",
	{
		id: int("id").primaryKey({ autoIncrement: true }),
		workoutExerciseId: int("workout_exercise_id")
			.notNull()
			.references(() => workoutExercises.id, { onDelete: "cascade" }),
		setIndex: int("set_index").notNull(),
		reps: int("reps").notNull(),
		weight: real("weight"),
		completedAt: text("completed_at").notNull(),
	},
	(t) => [
		uniqueIndex("workout_sets_exercise_set_idx").on(t.workoutExerciseId, t.setIndex),
	],
);
