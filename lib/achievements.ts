import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import type { Database } from "../db";
import { goals, hydrationLogs, workoutExercises, workoutSessions, workoutSets } from "../db/schema";

type CheckFn = (db: Database) => Promise<boolean>;

export type AchievementDef = {
	id: string;
	nameKey: string;
	descriptionKey: string;
	iconName: string;
	xp: number;
	check: CheckFn;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

async function countCompletedWorkouts(db: Database): Promise<number> {
	const [row] = await db
		.select({ count: sql<number>`COUNT(*)` })
		.from(workoutSessions)
		.where(eq(workoutSessions.status, "completed"));
	return row?.count ?? 0;
}

async function countPRExercises(db: Database): Promise<number> {
	// Count distinct exercise variants that have at least one recorded weight
	const [row] = await db
		.select({ count: sql<number>`COUNT(DISTINCT ${workoutExercises.exerciseVariantId})` })
		.from(workoutSets)
		.innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
		.innerJoin(workoutSessions, eq(workoutExercises.workoutSessionId, workoutSessions.id))
		.where(and(eq(workoutSessions.status, "completed"), isNotNull(workoutSets.weight)));
	return row?.count ?? 0;
}

async function hydrationStreak(db: Database, requiredDays: number): Promise<boolean> {
	// Get the last N days of hydration logs ordered by date desc
	const logs = await db
		.select({
			date: hydrationLogs.date,
			volumeMl: hydrationLogs.volumeMl,
			goalMl: hydrationLogs.goalMl,
		})
		.from(hydrationLogs)
		.where(gte(hydrationLogs.volumeMl, hydrationLogs.goalMl))
		.orderBy(sql`${hydrationLogs.date} DESC`)
		.limit(requiredDays);

	if (logs.length < requiredDays) return false;

	// Check that the dates are consecutive
	for (let i = 0; i < logs.length - 1; i++) {
		const current = new Date(logs[i].date);
		const next = new Date(logs[i + 1].date);
		const diffMs = current.getTime() - next.getTime();
		const diffDays = diffMs / (1000 * 60 * 60 * 24);
		if (Math.round(diffDays) !== 1) return false;
	}
	return true;
}

async function countAchievedGoals(db: Database): Promise<number> {
	const [row] = await db
		.select({ count: sql<number>`COUNT(*)` })
		.from(goals)
		.where(eq(goals.status, "achieved"));
	return row?.count ?? 0;
}

// ─── Catalogue ──────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: AchievementDef[] = [
	// Workouts
	{
		id: "first_workout",
		nameKey: "achievements.first_workout",
		descriptionKey: "achievements.first_workout_desc",
		iconName: "footsteps-outline",
		xp: 50,
		check: async (db) => (await countCompletedWorkouts(db)) >= 1,
	},
	{
		id: "workouts_10",
		nameKey: "achievements.workouts_10",
		descriptionKey: "achievements.workouts_10_desc",
		iconName: "flame-outline",
		xp: 100,
		check: async (db) => (await countCompletedWorkouts(db)) >= 10,
	},
	{
		id: "workouts_50",
		nameKey: "achievements.workouts_50",
		descriptionKey: "achievements.workouts_50_desc",
		iconName: "hardware-chip-outline",
		xp: 200,
		check: async (db) => (await countCompletedWorkouts(db)) >= 50,
	},
	{
		id: "workouts_100",
		nameKey: "achievements.workouts_100",
		descriptionKey: "achievements.workouts_100_desc",
		iconName: "shield-checkmark-outline",
		xp: 200,
		check: async (db) => (await countCompletedWorkouts(db)) >= 100,
	},
	// PRs
	{
		id: "first_pr",
		nameKey: "achievements.first_pr",
		descriptionKey: "achievements.first_pr_desc",
		iconName: "trending-up-outline",
		xp: 50,
		check: async (db) => (await countPRExercises(db)) >= 1,
	},
	{
		id: "prs_10",
		nameKey: "achievements.prs_10",
		descriptionKey: "achievements.prs_10_desc",
		iconName: "ribbon-outline",
		xp: 100,
		check: async (db) => (await countPRExercises(db)) >= 10,
	},
	// Hydration streaks
	{
		id: "hydration_streak_3",
		nameKey: "achievements.hydration_streak_3",
		descriptionKey: "achievements.hydration_streak_3_desc",
		iconName: "water-outline",
		xp: 50,
		check: async (db) => hydrationStreak(db, 3),
	},
	{
		id: "hydration_streak_7",
		nameKey: "achievements.hydration_streak_7",
		descriptionKey: "achievements.hydration_streak_7_desc",
		iconName: "water-outline",
		xp: 100,
		check: async (db) => hydrationStreak(db, 7),
	},
	{
		id: "hydration_streak_30",
		nameKey: "achievements.hydration_streak_30",
		descriptionKey: "achievements.hydration_streak_30_desc",
		iconName: "water-outline",
		xp: 200,
		check: async (db) => hydrationStreak(db, 30),
	},
	// Goals
	{
		id: "first_goal",
		nameKey: "achievements.first_goal",
		descriptionKey: "achievements.first_goal_desc",
		iconName: "flag-outline",
		xp: 50,
		check: async (db) => (await countAchievedGoals(db)) >= 1,
	},
	// Levels (checked after XP grant)
	{
		id: "level_5",
		nameKey: "achievements.level_5",
		descriptionKey: "achievements.level_5_desc",
		iconName: "star-outline",
		xp: 100,
		check: async (db) => {
			const { userLevel } = await import("../db/schema");
			const [row] = await db.select().from(userLevel).limit(1);
			return (row?.level ?? 1) >= 5;
		},
	},
	{
		id: "level_10",
		nameKey: "achievements.level_10",
		descriptionKey: "achievements.level_10_desc",
		iconName: "star-outline",
		xp: 150,
		check: async (db) => {
			const { userLevel } = await import("../db/schema");
			const [row] = await db.select().from(userLevel).limit(1);
			return (row?.level ?? 1) >= 10;
		},
	},
];

export const ACHIEVEMENTS_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
