import { index, int, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const programs = sqliteTable("programs", {
	id: int("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	isActive: int("is_active", { mode: "boolean" }).notNull().default(false),
	createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updated_at")
		.$defaultFn(() => new Date().toISOString())
		.$onUpdateFn(() => new Date().toISOString()),
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
	exerciseVariantId: text("exercise_variant_id").notNull(),
	isUnilateral: int("is_unilateral", { mode: "boolean" }).notNull().default(false),
	order: int("order").notNull().default(0),
	sets: int("sets").notNull().default(3),
	reps: int("reps").notNull().default(10),
	defaultWeight: real("default_weight"),
	restTime: int("rest_time").notNull().default(90),
});

export const workoutSessions = sqliteTable(
	"workout_sessions",
	{
		id: int("id").primaryKey({ autoIncrement: true }),
		// Nullable: set null si la session de programme est supprimée (historique conservé)
		sessionId: int("session_id").references(() => sessions.id, { onDelete: "set null" }),
		// Snapshot: set null si le programme est supprimé, mais l'historique reste consultable par programme
		programId: int("program_id").references(() => programs.id, { onDelete: "set null" }),
		// Snapshot noms au lancement — l'historique reste lisible même après suppression du programme/session
		sessionName: text("session_name"),
		programName: text("program_name"),
		startedAt: text("started_at").notNull(),
		endedAt: text("ended_at"),
		/** Local date YYYY-MM-DD — used for calendar, stats, streaks (timezone-safe) */
		date: text("date").notNull(),
		status: text("status", { enum: ["in_progress", "completed"] })
			.notNull()
			.default("in_progress"),
	},
	(t) => [
		index("workout_sessions_date_idx").on(t.date),
		index("workout_sessions_status_date_idx").on(t.status, t.date),
	]
);

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
		exerciseVariantId: text("exercise_variant_id").notNull(),
		isUnilateral: int("is_unilateral", { mode: "boolean" }).notNull().default(false),
		// Snapshot au moment de la séance: les stats restent cohérentes même si le programme change
		prescribedSets: int("prescribed_sets").notNull(),
		prescribedReps: int("prescribed_reps").notNull(),
		prescribedWeight: real("prescribed_weight"),
		prescribedRestTime: int("prescribed_rest_time").notNull().default(90),
		status: text("status", { enum: ["pending", "completed", "skipped"] })
			.notNull()
			.default("pending"),
	},
	(t) => [index("workout_exercises_variant_idx").on(t.exerciseVariantId)]
);

export const workoutSets = sqliteTable(
	"workout_sets",
	{
		id: int("id").primaryKey({ autoIncrement: true }),
		workoutExerciseId: int("workout_exercise_id")
			.notNull()
			.references(() => workoutExercises.id, { onDelete: "cascade" }),
		setIndex: int("set_index").notNull(),
		reps: int("reps"),
		repsLeft: int("reps_left"),
		repsRight: int("reps_right"),
		weight: real("weight"),
		completedAt: text("completed_at").notNull(),
	},
	(t) => [uniqueIndex("workout_sets_exercise_set_idx").on(t.workoutExerciseId, t.setIndex)]
);

// ─── Profile ────────────────────────────────────────────────────────────────

export const userProfile = sqliteTable("user_profile", {
	id: int("id").primaryKey({ autoIncrement: true }),
	heightCm: real("height_cm"),
	updatedAt: text("updated_at")
		.$defaultFn(() => new Date().toISOString())
		.$onUpdateFn(() => new Date().toISOString()),
});

export const weightLogs = sqliteTable(
	"weight_logs",
	{
		id: int("id").primaryKey({ autoIncrement: true }),
		date: text("date").notNull(),
		weightKg: real("weight_kg").notNull(),
		healthkitUuid: text("healthkit_uuid"),
		createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
	},
	(t) => [uniqueIndex("weight_logs_date_idx").on(t.date)]
);

export const bodyMeasurements = sqliteTable(
	"body_measurements",
	{
		id: int("id").primaryKey({ autoIncrement: true }),
		date: text("date").notNull(),
		bodyFat: real("body_fat"),
		shoulders: real("shoulders"),
		chest: real("chest"),
		waist: real("waist"),
		hips: real("hips"),
		neck: real("neck"),
		arms: real("arms"),
		thigh: real("thigh"),
		calf: real("calf"),
		createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
	},
	(t) => [uniqueIndex("body_measurements_date_idx").on(t.date)]
);

export const goals = sqliteTable("goals", {
	id: int("id").primaryKey({ autoIncrement: true }),
	type: text("type", {
		enum: [
			// Body measurements
			"weight",
			"bodyFat",
			"shoulders",
			"chest",
			"waist",
			"hips",
			"neck",
			"arms",
			"thigh",
			"calf",
			// Performance (future)
			"weeklyWorkouts",
			"exerciseWeight",
		],
	}).notNull(),
	// Pour les goals de type "exerciseWeight" — référence au variant ciblé
	exerciseVariantId: text("exercise_variant_id"),
	targetValue: real("target_value").notNull(),
	startValue: real("start_value").notNull(),
	deadline: text("deadline").notNull(),
	status: text("status", { enum: ["active", "achieved", "abandoned"] })
		.notNull()
		.default("active"),
	createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updated_at")
		.$defaultFn(() => new Date().toISOString())
		.$onUpdateFn(() => new Date().toISOString()),
});

// ─── Gamification ─────────────────────────────────────────────────────────────

export const xpLogs = sqliteTable(
	"xp_logs",
	{
		id: int("id").primaryKey({ autoIncrement: true }),
		amount: int("amount").notNull(),
		source: text("source", { enum: ["workout", "hydration", "achievement", "steps"] }).notNull(),
		sourceId: text("source_id"),
		date: text("date").notNull(),
		createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
	},
	(t) => [uniqueIndex("xp_logs_source_idx").on(t.source, t.sourceId)]
);

export const userLevel = sqliteTable("user_level", {
	id: int("id").primaryKey(),
	totalXp: int("total_xp").notNull().default(0),
	level: int("level").notNull().default(1),
	updatedAt: text("updated_at")
		.$defaultFn(() => new Date().toISOString())
		.$onUpdateFn(() => new Date().toISOString()),
});

export const userAchievements = sqliteTable("user_achievements", {
	id: int("id").primaryKey({ autoIncrement: true }),
	achievementId: text("achievement_id").notNull().unique(),
	unlockedAt: text("unlocked_at").notNull(),
});

// ─── Hydration ─────────────────────────────────────────────────────────────────

export const hydrationLogs = sqliteTable(
	"hydration_logs",
	{
		id: int("id").primaryKey({ autoIncrement: true }),
		date: text("date").notNull(),
		volumeMl: real("volume_ml").notNull(),
		goalMl: real("goal_ml").notNull(),
		createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
	},
	(t) => [uniqueIndex("hydration_logs_date_idx").on(t.date)]
);

// ─── Nutrition ────────────────────────────────────────────────────────────────

export const diets = sqliteTable("diets", {
	id: int("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	description: text("description"),
	calorieGoal: int("calorie_goal"),
	proteinGoal: int("protein_goal"),
	carbGoal: int("carb_goal"),
	fatGoal: int("fat_goal"),
	isActive: int("is_active", { mode: "boolean" }).notNull().default(false),
	createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updated_at")
		.$defaultFn(() => new Date().toISOString())
		.$onUpdateFn(() => new Date().toISOString()),
});

export const dietMeals = sqliteTable("diet_meals", {
	id: int("id").primaryKey({ autoIncrement: true }),
	dietId: int("diet_id")
		.notNull()
		.references(() => diets.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	order: int("order").notNull().default(0),
	targetTime: text("target_time"),
	createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const dietMealFoods = sqliteTable("diet_meal_foods", {
	id: int("id").primaryKey({ autoIncrement: true }),
	dietMealId: int("diet_meal_id")
		.notNull()
		.references(() => dietMeals.id, { onDelete: "cascade" }),
	foodSource: text("food_source", { enum: ["local", "api", "custom"] }).notNull(),
	foodId: text("food_id").notNull(),
	name: text("name").notNull(),
	quantity: real("quantity").notNull(),
	caloriesPer100g: real("calories_per_100g").notNull(),
	proteinPer100g: real("protein_per_100g").notNull(),
	carbsPer100g: real("carbs_per_100g").notNull(),
	fatPer100g: real("fat_per_100g").notNull(),
	order: int("order").notNull().default(0),
	createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const customFoods = sqliteTable("custom_foods", {
	id: int("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	category: text("category", {
		enum: ["protein", "carb", "fat", "vegetable", "fruit", "dairy", "other"],
	})
		.notNull()
		.default("other"),
	caloriesPer100g: real("calories_per_100g").notNull(),
	proteinPer100g: real("protein_per_100g").notNull(),
	carbsPer100g: real("carbs_per_100g").notNull(),
	fatPer100g: real("fat_per_100g").notNull(),
	createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const cachedApiFoods = sqliteTable("cached_api_foods", {
	barcode: text("barcode").primaryKey(),
	name: text("name").notNull(),
	caloriesPer100g: real("calories_per_100g"),
	proteinPer100g: real("protein_per_100g"),
	carbsPer100g: real("carbs_per_100g"),
	fatPer100g: real("fat_per_100g"),
	imageUrl: text("image_url"),
	cachedAt: text("cached_at").$defaultFn(() => new Date().toISOString()),
});

export const dailyMealLogs = sqliteTable(
	"daily_meal_logs",
	{
		id: int("id").primaryKey({ autoIncrement: true }),
		date: text("date").notNull(),
		dietId: int("diet_id").references(() => diets.id, { onDelete: "set null" }),
		dietMealId: int("diet_meal_id").references(() => dietMeals.id, { onDelete: "set null" }),
		mealName: text("meal_name").notNull(),
		order: int("order").notNull().default(0),
		status: text("status", { enum: ["confirmed", "skipped", "cheat"] })
			.notNull()
			.default("confirmed"),
		totalCalories: real("total_calories").notNull().default(0),
		totalProtein: real("total_protein").notNull().default(0),
		totalCarbs: real("total_carbs").notNull().default(0),
		totalFat: real("total_fat").notNull().default(0),
		loggedAt: text("logged_at").$defaultFn(() => new Date().toISOString()),
	},
	(t) => [
		index("daily_meal_logs_date_idx").on(t.date),
		uniqueIndex("daily_meal_logs_date_meal_idx").on(t.date, t.dietMealId),
	]
);
