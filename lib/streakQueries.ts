import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { workoutSessions } from "../db/schema";

/**
 * Compute the current workout streak (consecutive days with at least one completed session).
 * Today counts if there's a workout today, otherwise we start from yesterday.
 */
export async function getWorkoutStreak(): Promise<number> {
	// Get all distinct workout dates, most recent first
	const rows = await db
		.selectDistinct({ date: workoutSessions.date })
		.from(workoutSessions)
		.where(eq(workoutSessions.status, "completed"))
		.orderBy(desc(workoutSessions.date))
		.limit(365);

	if (rows.length === 0) return 0;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const mostRecentDate = new Date(rows[0].date);
	mostRecentDate.setHours(0, 0, 0, 0);

	// If most recent workout is older than yesterday, streak is 0
	const diffDays = Math.round((today.getTime() - mostRecentDate.getTime()) / 86400000);
	if (diffDays > 1) return 0;

	let streak = 1;
	for (let i = 1; i < rows.length; i++) {
		const prev = new Date(rows[i - 1].date);
		const curr = new Date(rows[i].date);
		prev.setHours(0, 0, 0, 0);
		curr.setHours(0, 0, 0, 0);
		const gap = Math.round((prev.getTime() - curr.getTime()) / 86400000);
		if (gap === 1) {
			streak++;
		} else {
			break;
		}
	}

	return streak;
}
