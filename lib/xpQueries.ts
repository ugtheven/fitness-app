import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { userAchievements, userLevel, xpLogs } from "../db/schema";
import { ACHIEVEMENTS, type AchievementDef } from "./achievements";
import { levelForXp } from "./xp";

// ─── Types ──────────────────────────────────────────────────────────────────

export type XpGrantResult = {
	granted: boolean;
	newTotalXp: number;
	newLevel: number;
	leveledUp: boolean;
};

export type NewAchievement = AchievementDef & { xpResult: XpGrantResult };

// ─── Reactive queries (for useLiveQuery) ────────────────────────────────────

export function getUserLevelQuery() {
	return db.select().from(userLevel).limit(1);
}

export function getUnlockedAchievementsQuery() {
	return db.select().from(userAchievements);
}

export function getXpLogsForSourceQuery(source: string, sourceId: string) {
	return db
		.select()
		.from(xpLogs)
		.where(sql`${xpLogs.source} = ${source} AND ${xpLogs.sourceId} = ${sourceId}`);
}

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Grant XP for an event. Idempotent: duplicate (source, sourceId) is ignored.
 */
export async function grantXp(
	amount: number,
	source: "workout" | "hydration" | "achievement" | "steps",
	sourceId: string,
	date: string
): Promise<XpGrantResult> {
	return await db.transaction(async (tx) => {
		// Try to insert — unique index on (source, source_id) prevents duplicates
		const inserted = await tx
			.insert(xpLogs)
			.values({ amount, source, sourceId, date })
			.onConflictDoNothing();

		// If no row was inserted, this XP was already granted
		if (inserted.changes === 0) {
			const [current] = await tx.select().from(userLevel).limit(1);
			return {
				granted: false,
				newTotalXp: current?.totalXp ?? 0,
				newLevel: current?.level ?? 1,
				leveledUp: false,
			};
		}

		// Get current level state
		const [current] = await tx.select().from(userLevel).limit(1);
		const oldLevel = current?.level ?? 1;
		const newTotalXp = (current?.totalXp ?? 0) + amount;
		const newLevel = levelForXp(newTotalXp);

		await tx
			.update(userLevel)
			.set({
				totalXp: newTotalXp,
				level: newLevel,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(userLevel.id, 1));

		return {
			granted: true,
			newTotalXp,
			newLevel,
			leveledUp: newLevel > oldLevel,
		};
	});
}

/**
 * Recalculate userLevel from xpLogs (safety net for cache corruption).
 * Call on app startup or from debug tools.
 */
export async function recalculateLevel(): Promise<void> {
	const [row] = await db
		.select({ total: sql<number>`COALESCE(SUM(${xpLogs.amount}), 0)` })
		.from(xpLogs);
	const totalXp = row?.total ?? 0;
	const level = levelForXp(totalXp);
	await db
		.update(userLevel)
		.set({ totalXp, level, updatedAt: new Date().toISOString() })
		.where(eq(userLevel.id, 1));
}

/**
 * Check all achievements and grant XP for newly unlocked ones.
 * Returns the list of newly unlocked achievements.
 */
export async function checkAndGrantAchievements(date: string): Promise<NewAchievement[]> {
	// Load already unlocked
	const unlocked = await db.select().from(userAchievements);
	const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

	const newlyUnlocked: NewAchievement[] = [];

	for (const achievement of ACHIEVEMENTS) {
		if (unlockedIds.has(achievement.id)) continue;

		const passed = await achievement.check(db);
		if (!passed) continue;

		// Insert achievement + grant XP atomically
		const insertedId = await db.transaction(async (tx) => {
			await tx.insert(userAchievements).values({
				achievementId: achievement.id,
				unlockedAt: new Date().toISOString(),
			});
			const [row] = await tx
				.select({ id: userAchievements.id })
				.from(userAchievements)
				.where(eq(userAchievements.achievementId, achievement.id));
			return row.id;
		});

		// grantXp has its own transaction — safe to call outside
		const xpResult = await grantXp(achievement.xp, "achievement", String(insertedId), date);
		newlyUnlocked.push({ ...achievement, xpResult });
	}

	return newlyUnlocked;
}
