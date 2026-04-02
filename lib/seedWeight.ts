import { db } from "../db";
import { weightLogs } from "../db/schema";

/**
 * Seeds 7 days of weight data (last week).
 * Call once then remove.
 */
export async function seedWeightLogs() {
	const today = new Date();
	const entries = [
		{ daysAgo: 7, weight: 77.2 },
		{ daysAgo: 6, weight: 77.4 },
		{ daysAgo: 5, weight: 77.1 },
		{ daysAgo: 4, weight: 77.5 },
		{ daysAgo: 3, weight: 77.3 },
		{ daysAgo: 2, weight: 77.8 },
		{ daysAgo: 1, weight: 77.6 },
	];

	for (const { daysAgo, weight } of entries) {
		const d = new Date(today);
		d.setDate(d.getDate() - daysAgo);
		const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
		await db
			.insert(weightLogs)
			.values({ date, weightKg: weight })
			.onConflictDoUpdate({
				target: weightLogs.date,
				set: { weightKg: weight },
			});
	}
}
