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
	progress?: (db: Database) => Promise<{ current: number; target: number }>;
};

// ─── Date helpers (DST-safe, pure string comparison) ───────────────────────

function todayStr(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function prevDay(dateStr: string): string {
	const [y, m, d] = dateStr.split("-").map(Number);
	const date = new Date(y, m - 1, d - 1);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function countCompletedWorkouts(db: Database): Promise<number> {
	const [row] = await db
		.select({ count: sql<number>`COUNT(*)` })
		.from(workoutSessions)
		.where(eq(workoutSessions.status, "completed"));
	return row?.count ?? 0;
}

async function countTrackedExercises(db: Database): Promise<number> {
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
	const logs = await db
		.select({ date: hydrationLogs.date })
		.from(hydrationLogs)
		.where(gte(hydrationLogs.volumeMl, hydrationLogs.goalMl))
		.orderBy(sql`${hydrationLogs.date} DESC`)
		.limit(requiredDays);

	if (logs.length < requiredDays) return false;

	const today = todayStr();
	const yesterday = prevDay(today);
	if (logs[0].date !== today && logs[0].date < yesterday) return false;

	for (let i = 0; i < logs.length - 1; i++) {
		if (logs[i + 1].date !== prevDay(logs[i].date)) return false;
	}
	return true;
}

async function currentHydrationStreak(db: Database): Promise<number> {
	const logs = await db
		.select({ date: hydrationLogs.date })
		.from(hydrationLogs)
		.where(gte(hydrationLogs.volumeMl, hydrationLogs.goalMl))
		.orderBy(sql`${hydrationLogs.date} DESC`);

	if (logs.length === 0) return 0;

	const today = todayStr();
	const yesterday = prevDay(today);
	if (logs[0].date !== today && logs[0].date < yesterday) return 0;

	let streak = 1;
	for (let i = 0; i < logs.length - 1; i++) {
		if (logs[i + 1].date === prevDay(logs[i].date)) {
			streak++;
		} else {
			break;
		}
	}
	return streak;
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
		progress: async (db) => ({
			current: Math.min(await countCompletedWorkouts(db), 1),
			target: 1,
		}),
	},
	{
		id: "workouts_10",
		nameKey: "achievements.workouts_10",
		descriptionKey: "achievements.workouts_10_desc",
		iconName: "flame-outline",
		xp: 100,
		check: async (db) => (await countCompletedWorkouts(db)) >= 10,
		progress: async (db) => ({
			current: Math.min(await countCompletedWorkouts(db), 10),
			target: 10,
		}),
	},
	{
		id: "workouts_50",
		nameKey: "achievements.workouts_50",
		descriptionKey: "achievements.workouts_50_desc",
		iconName: "hardware-chip-outline",
		xp: 200,
		check: async (db) => (await countCompletedWorkouts(db)) >= 50,
		progress: async (db) => ({
			current: Math.min(await countCompletedWorkouts(db), 50),
			target: 50,
		}),
	},
	{
		id: "workouts_100",
		nameKey: "achievements.workouts_100",
		descriptionKey: "achievements.workouts_100_desc",
		iconName: "shield-checkmark-outline",
		xp: 200,
		check: async (db) => (await countCompletedWorkouts(db)) >= 100,
		progress: async (db) => ({
			current: Math.min(await countCompletedWorkouts(db), 100),
			target: 100,
		}),
	},
	// PRs
	{
		id: "first_pr",
		nameKey: "achievements.first_pr",
		descriptionKey: "achievements.first_pr_desc",
		iconName: "trending-up-outline",
		xp: 50,
		check: async (db) => (await countTrackedExercises(db)) >= 1,
		progress: async (db) => ({
			current: Math.min(await countTrackedExercises(db), 1),
			target: 1,
		}),
	},
	{
		id: "prs_10",
		nameKey: "achievements.prs_10",
		descriptionKey: "achievements.prs_10_desc",
		iconName: "ribbon-outline",
		xp: 100,
		check: async (db) => (await countTrackedExercises(db)) >= 10,
		progress: async (db) => ({
			current: Math.min(await countTrackedExercises(db), 10),
			target: 10,
		}),
	},
	// Hydration streaks
	{
		id: "hydration_streak_3",
		nameKey: "achievements.hydration_streak_3",
		descriptionKey: "achievements.hydration_streak_3_desc",
		iconName: "water-outline",
		xp: 50,
		check: async (db) => hydrationStreak(db, 3),
		progress: async (db) => ({
			current: Math.min(await currentHydrationStreak(db), 3),
			target: 3,
		}),
	},
	{
		id: "hydration_streak_7",
		nameKey: "achievements.hydration_streak_7",
		descriptionKey: "achievements.hydration_streak_7_desc",
		iconName: "water-outline",
		xp: 100,
		check: async (db) => hydrationStreak(db, 7),
		progress: async (db) => ({
			current: Math.min(await currentHydrationStreak(db), 7),
			target: 7,
		}),
	},
	{
		id: "hydration_streak_30",
		nameKey: "achievements.hydration_streak_30",
		descriptionKey: "achievements.hydration_streak_30_desc",
		iconName: "water-outline",
		xp: 200,
		check: async (db) => hydrationStreak(db, 30),
		progress: async (db) => ({
			current: Math.min(await currentHydrationStreak(db), 30),
			target: 30,
		}),
	},
	// Goals
	{
		id: "first_goal",
		nameKey: "achievements.first_goal",
		descriptionKey: "achievements.first_goal_desc",
		iconName: "flag-outline",
		xp: 50,
		check: async (db) => (await countAchievedGoals(db)) >= 1,
		progress: async (db) => ({
			current: Math.min(await countAchievedGoals(db), 1),
			target: 1,
		}),
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
		progress: async (db) => {
			const { userLevel } = await import("../db/schema");
			const [row] = await db.select().from(userLevel).limit(1);
			return { current: Math.min(row?.level ?? 1, 5), target: 5 };
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
		progress: async (db) => {
			const { userLevel } = await import("../db/schema");
			const [row] = await db.select().from(userLevel).limit(1);
			return { current: Math.min(row?.level ?? 1, 10), target: 10 };
		},
	},
];

export const ACHIEVEMENTS_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
