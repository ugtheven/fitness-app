import { eq } from "drizzle-orm";
import { db } from "../db";
import { hydrationLogs } from "../db/schema";
import { XP_REWARDS } from "./xp";
import { checkAndGrantAchievements, grantXp } from "./xpQueries";

/** Live query for today's hydration log (for useLiveQuery). */
export function getTodayHydrationQuery(date: string) {
	return db.select().from(hydrationLogs).where(eq(hydrationLogs.date, date));
}

/** Add water to today's log. Creates the row if it doesn't exist, increments if it does. */
export async function addWater(date: string, amountMl: number, goalMl: number) {
	const existing = await db.select().from(hydrationLogs).where(eq(hydrationLogs.date, date));
	if (existing.length > 0) {
		const oldVolume = existing[0].volumeMl;
		const newVolume = oldVolume + amountMl;
		await db.update(hydrationLogs).set({ volumeMl: newVolume }).where(eq(hydrationLogs.date, date));

		// Grant XP on first goal crossing (idempotent via sourceId)
		if (newVolume >= goalMl) {
			await grantXp(XP_REWARDS.hydration, "hydration", existing[0].id, date);
			await checkAndGrantAchievements(date);
		}
	} else {
		await db.insert(hydrationLogs).values({ date, volumeMl: amountMl, goalMl });

		// If single add already meets goal
		if (amountMl >= goalMl) {
			const [inserted] = await db
				.select({ id: hydrationLogs.id })
				.from(hydrationLogs)
				.where(eq(hydrationLogs.date, date));
			await grantXp(XP_REWARDS.hydration, "hydration", inserted.id, date);
			await checkAndGrantAchievements(date);
		}
	}
}

/** Remove water from today's log (for undo). Clamps to 0. */
export async function removeWater(date: string, amountMl: number) {
	const existing = await db.select().from(hydrationLogs).where(eq(hydrationLogs.date, date));
	if (existing.length > 0) {
		const newVolume = Math.max(0, existing[0].volumeMl - amountMl);
		await db.update(hydrationLogs).set({ volumeMl: newVolume }).where(eq(hydrationLogs.date, date));
	}
}
