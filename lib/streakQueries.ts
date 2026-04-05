import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { workoutSessions } from "../db/schema";

/** Subtract one day from a YYYY-MM-DD string. */
function prevDay(dateStr: string): string {
	const [y, m, d] = dateStr.split("-").map(Number);
	const date = new Date(y, m - 1, d - 1);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Today as YYYY-MM-DD (local timezone). */
function todayStr(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Compute the current workout streak (consecutive days with at least one completed session).
 * Today counts if there's a workout today, otherwise we start from yesterday.
 * Uses pure string comparison on YYYY-MM-DD — DST-safe.
 */
export async function getWorkoutStreak(): Promise<number> {
	const rows = await db
		.selectDistinct({ date: workoutSessions.date })
		.from(workoutSessions)
		.where(eq(workoutSessions.status, "completed"))
		.orderBy(desc(workoutSessions.date))
		.limit(365);

	if (rows.length === 0) return 0;

	const today = todayStr();
	const yesterday = prevDay(today);
	const mostRecent = rows[0].date;

	// If most recent workout is older than yesterday, streak is broken
	if (mostRecent < yesterday) return 0;

	let streak = 1;
	let expected = prevDay(mostRecent);
	for (let i = 1; i < rows.length; i++) {
		if (rows[i].date === expected) {
			streak++;
			expected = prevDay(expected);
		} else {
			break;
		}
	}

	return streak;
}
