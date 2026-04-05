import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { dailyMealLogs, dietMealFoods } from "../db/schema";

/** Live query for today's meal logs (for useLiveQuery). */
export function getTodayMealLogsQuery(date: string) {
	return db.select().from(dailyMealLogs).where(eq(dailyMealLogs.date, date));
}

/** Get macros for a specific meal from its foods. */
async function computeMealMacros(mealId: number) {
	const rows = await db
		.select({
			totalCalories: sql<number>`coalesce(sum(calories_per_100g * quantity / 100), 0)`,
			totalProtein: sql<number>`coalesce(sum(protein_per_100g * quantity / 100), 0)`,
			totalCarbs: sql<number>`coalesce(sum(carbs_per_100g * quantity / 100), 0)`,
			totalFat: sql<number>`coalesce(sum(fat_per_100g * quantity / 100), 0)`,
		})
		.from(dietMealFoods)
		.where(eq(dietMealFoods.dietMealId, mealId));
	const r = rows[0];
	return {
		totalCalories: r?.totalCalories ?? 0,
		totalProtein: r?.totalProtein ?? 0,
		totalCarbs: r?.totalCarbs ?? 0,
		totalFat: r?.totalFat ?? 0,
	};
}

/** Confirm a meal — snapshot macros from current dietMealFoods. Idempotent per (date, mealId). */
export async function confirmMeal(
	date: string,
	dietId: number,
	mealId: number,
	mealName: string,
	order: number
): Promise<void> {
	const macros = await computeMealMacros(mealId);
	await db
		.insert(dailyMealLogs)
		.values({
			date,
			dietId,
			dietMealId: mealId,
			mealName,
			order,
			status: "confirmed",
			...macros,
		})
		.onConflictDoNothing();
}

/** Skip a meal — log with zero macros. Idempotent per (date, mealId). */
export async function skipMeal(
	date: string,
	dietId: number,
	mealId: number,
	mealName: string,
	order: number
): Promise<void> {
	await db
		.insert(dailyMealLogs)
		.values({
			date,
			dietId,
			dietMealId: mealId,
			mealName,
			order,
			status: "skipped",
			totalCalories: 0,
			totalProtein: 0,
			totalCarbs: 0,
			totalFat: 0,
		})
		.onConflictDoNothing();
}

/** Cheat meal — macros from the planned meal are counted (v1 simple). Idempotent per (date, mealId). */
export async function cheatMeal(
	date: string,
	dietId: number,
	mealId: number,
	mealName: string,
	order: number
): Promise<void> {
	const macros = await computeMealMacros(mealId);
	await db
		.insert(dailyMealLogs)
		.values({
			date,
			dietId,
			dietMealId: mealId,
			mealName,
			order,
			status: "cheat",
			...macros,
		})
		.onConflictDoNothing();
}

/** Undo a meal log (delete by id). */
export async function undoMealLog(logId: number): Promise<void> {
	await db.delete(dailyMealLogs).where(eq(dailyMealLogs.id, logId));
}

/** Import all foods from a source meal into a target meal. Returns the number of foods imported. */
export async function importMealFoods(sourceMealId: number, targetMealId: number): Promise<number> {
	const sourceFoods = await db
		.select()
		.from(dietMealFoods)
		.where(eq(dietMealFoods.dietMealId, sourceMealId))
		.orderBy(dietMealFoods.order);

	if (sourceFoods.length === 0) return 0;

	// Get current max order in target meal
	const [maxRow] = await db
		.select({ maxOrder: sql<number>`coalesce(max(${dietMealFoods.order}), -1)` })
		.from(dietMealFoods)
		.where(eq(dietMealFoods.dietMealId, targetMealId));
	const startOrder = (maxRow?.maxOrder ?? -1) + 1;

	await db.insert(dietMealFoods).values(
		sourceFoods.map((food, i) => ({
			dietMealId: targetMealId,
			foodSource: food.foodSource,
			foodId: food.foodId,
			name: food.name,
			quantity: food.quantity,
			caloriesPer100g: food.caloriesPer100g,
			proteinPer100g: food.proteinPer100g,
			carbsPer100g: food.carbsPer100g,
			fatPer100g: food.fatPer100g,
			order: startOrder + i,
		}))
	);

	return sourceFoods.length;
}
