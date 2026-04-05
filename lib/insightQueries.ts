import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "../db";
import { dailyMealLogs, hydrationLogs } from "../db/schema";

/** Nutrition data for a specific date (used in workout history detail) */
export async function getNutritionForDate(date: string) {
	const rows = await db
		.select({
			calories: sql<number>`sum(${dailyMealLogs.totalCalories})`,
			protein: sql<number>`sum(${dailyMealLogs.totalProtein})`,
			carbs: sql<number>`sum(${dailyMealLogs.totalCarbs})`,
			fat: sql<number>`sum(${dailyMealLogs.totalFat})`,
		})
		.from(dailyMealLogs)
		.where(and(eq(dailyMealLogs.date, date), ne(dailyMealLogs.status, "skipped")));

	const row = rows[0];
	if (!row || row.calories == null) return null;
	return {
		calories: Math.round(row.calories),
		protein: Math.round(row.protein),
		carbs: Math.round(row.carbs),
		fat: Math.round(row.fat),
	};
}

export async function getHydrationForDate(date: string) {
	const rows = await db
		.select({
			volumeMl: hydrationLogs.volumeMl,
			goalMl: hydrationLogs.goalMl,
		})
		.from(hydrationLogs)
		.where(eq(hydrationLogs.date, date))
		.limit(1);

	return rows[0] ?? null;
}
