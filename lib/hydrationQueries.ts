import { eq } from "drizzle-orm";
import { db } from "../db";
import { hydrationLogs } from "../db/schema";
import { XP_REWARDS } from "./xp";
import { type XpGrantResult, checkAndGrantAchievements, grantXp } from "./xpQueries";

/** Live query for today's hydration log (for useLiveQuery). */
export function getTodayHydrationQuery(date: string) {
	return db.select().from(hydrationLogs).where(eq(hydrationLogs.date, date));
}

/** Add water to today's log. Creates the row if it doesn't exist, increments if it does. */
export async function addWater(
	date: string,
	amountMl: number,
	goalMl: number
): Promise<XpGrantResult | null> {
	let goalReached = false;

	await db.transaction(async (tx) => {
		const existing = await tx.select().from(hydrationLogs).where(eq(hydrationLogs.date, date));
		if (existing.length > 0) {
			const newVolume = existing[0].volumeMl + amountMl;
			await tx
				.update(hydrationLogs)
				.set({ volumeMl: newVolume, goalMl })
				.where(eq(hydrationLogs.date, date));
			goalReached = newVolume >= goalMl;
		} else {
			await tx.insert(hydrationLogs).values({ date, volumeMl: amountMl, goalMl });
			goalReached = amountMl >= goalMl;
		}
	});

	// XP/achievements outside the transaction (grantXp has its own transaction)
	if (goalReached) {
		const xpResult = await grantXp(XP_REWARDS.hydration, "hydration", date, date);
		await checkAndGrantAchievements(date);
		return xpResult;
	}
	return null;
}

/** Reset today's hydration log to 0. */
export async function resetHydration(date: string) {
	await db.update(hydrationLogs).set({ volumeMl: 0 }).where(eq(hydrationLogs.date, date));
}

/** Remove water from today's log (for undo). Clamps to 0. */
export async function removeWater(date: string, amountMl: number) {
	await db.transaction(async (tx) => {
		const existing = await tx.select().from(hydrationLogs).where(eq(hydrationLogs.date, date));
		if (existing.length > 0) {
			const newVolume = Math.max(0, existing[0].volumeMl - amountMl);
			await tx
				.update(hydrationLogs)
				.set({ volumeMl: newVolume })
				.where(eq(hydrationLogs.date, date));
		}
	});
}
