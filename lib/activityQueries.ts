import { and, eq, gte, lt, ne, sql } from "drizzle-orm";
import { Platform } from "react-native";
import { db } from "../db";
import { dailyMealLogs, hydrationLogs, workoutSessions } from "../db/schema";

// ─── Steps from HealthKit ───────────────────────────────────────────────────

export async function fetchStepsForDate(date: string): Promise<number> {
	if (Platform.OS !== "ios") return 0;
	try {
		const { queryStatisticsForQuantity } = await import("@kingstinct/react-native-healthkit");
		const [y, m, d] = date.split("-").map(Number);
		const startOfDay = new Date(y, m - 1, d);
		const endOfDay = new Date(y, m - 1, d + 1);
		const result = await queryStatisticsForQuantity(
			"HKQuantityTypeIdentifierStepCount",
			["cumulativeSum"],
			{ filter: { date: { startDate: startOfDay, endDate: endOfDay } } }
		);
		return Math.round(result?.sumQuantity?.quantity ?? 0);
	} catch {
		return 0;
	}
}

// ─── Day summary ────────────────────────────────────────────────────────────

export type DaySummary = {
	nutrition: {
		calories: number;
		protein: number;
		carbs: number;
		fat: number;
		mealCount: number;
	} | null;
	hydration: { volumeMl: number; goalMl: number } | null;
	steps: number;
};

export async function getDaySummary(date: string): Promise<DaySummary> {
	const [nutritionRows, hydrationRows, steps] = await Promise.all([
		db
			.select({
				calories: sql<number>`sum(${dailyMealLogs.totalCalories})`,
				protein: sql<number>`sum(${dailyMealLogs.totalProtein})`,
				carbs: sql<number>`sum(${dailyMealLogs.totalCarbs})`,
				fat: sql<number>`sum(${dailyMealLogs.totalFat})`,
				mealCount: sql<number>`count(*)`,
			})
			.from(dailyMealLogs)
			.where(and(eq(dailyMealLogs.date, date), ne(dailyMealLogs.status, "skipped"))),
		db
			.select({ volumeMl: hydrationLogs.volumeMl, goalMl: hydrationLogs.goalMl })
			.from(hydrationLogs)
			.where(eq(hydrationLogs.date, date))
			.limit(1),
		fetchStepsForDate(date),
	]);

	const n = nutritionRows[0];
	const nutrition =
		n && n.mealCount > 0
			? {
					calories: Math.round(n.calories ?? 0),
					protein: Math.round(n.protein ?? 0),
					carbs: Math.round(n.carbs ?? 0),
					fat: Math.round(n.fat ?? 0),
					mealCount: n.mealCount,
				}
			: null;

	const hydration = hydrationRows[0] ?? null;

	return { nutrition, hydration, steps };
}

// ─── Month stats ────────────────────────────────────────────────────────────

export type MonthStats = {
	workoutCount: number;
	dietDays: number;
	hydrationDays: number;
	daysElapsed: number;
};

export async function getMonthStats(year: number, month: number): Promise<MonthStats> {
	const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
	const endDate =
		month === 11 ? `${year + 1}-01-01` : `${year}-${String(month + 2).padStart(2, "0")}-01`;

	const now = new Date();
	const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
	const daysElapsed = isCurrentMonth ? now.getDate() : new Date(year, month + 1, 0).getDate();

	const [workouts, dietDaysRows, hydrationDaysRows] = await Promise.all([
		db
			.select({ count: sql<number>`count(*)` })
			.from(workoutSessions)
			.where(
				and(
					eq(workoutSessions.status, "completed"),
					gte(workoutSessions.date, startDate),
					lt(workoutSessions.date, endDate)
				)
			),
		db
			.select({ dayCount: sql<number>`count(distinct ${dailyMealLogs.date})` })
			.from(dailyMealLogs)
			.where(
				and(
					ne(dailyMealLogs.status, "skipped"),
					gte(dailyMealLogs.date, startDate),
					lt(dailyMealLogs.date, endDate)
				)
			),
		db
			.select({ dayCount: sql<number>`count(*)` })
			.from(hydrationLogs)
			.where(
				and(
					gte(hydrationLogs.date, startDate),
					lt(hydrationLogs.date, endDate),
					sql`${hydrationLogs.volumeMl} >= ${hydrationLogs.goalMl} * 0.8`
				)
			),
	]);

	return {
		workoutCount: workouts[0]?.count ?? 0,
		dietDays: dietDaysRows[0]?.dayCount ?? 0,
		hydrationDays: hydrationDaysRows[0]?.dayCount ?? 0,
		daysElapsed,
	};
}

// ─── Day modules for calendar ───────────────────────────────────────────────

import type { DayModules } from "../components/Calendar";

const STEPS_GOAL = 8000;

export async function getDayModules(year: number, month: number): Promise<Map<string, DayModules>> {
	const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
	const endDate =
		month === 11 ? `${year + 1}-01-01` : `${year}-${String(month + 2).padStart(2, "0")}-01`;

	const [workoutDays, nutritionDays, hydrationDays] = await Promise.all([
		db
			.select({ date: workoutSessions.date })
			.from(workoutSessions)
			.where(
				and(
					eq(workoutSessions.status, "completed"),
					gte(workoutSessions.date, startDate),
					lt(workoutSessions.date, endDate)
				)
			)
			.groupBy(workoutSessions.date),
		db
			.select({ date: dailyMealLogs.date })
			.from(dailyMealLogs)
			.where(
				and(
					ne(dailyMealLogs.status, "skipped"),
					gte(dailyMealLogs.date, startDate),
					lt(dailyMealLogs.date, endDate)
				)
			)
			.groupBy(dailyMealLogs.date),
		db
			.select({ date: hydrationLogs.date })
			.from(hydrationLogs)
			.where(
				and(
					gte(hydrationLogs.date, startDate),
					lt(hydrationLogs.date, endDate),
					sql`${hydrationLogs.volumeMl} >= ${hydrationLogs.goalMl} * 0.8`
				)
			),
	]);

	const map = new Map<string, DayModules>();
	const ensure = (date: string): DayModules => {
		let m = map.get(date);
		if (!m) {
			m = { workout: false, diet: false, hydration: false, steps: false };
			map.set(date, m);
		}
		return m;
	};

	for (const r of workoutDays) ensure(r.date).workout = true;
	for (const r of nutritionDays) ensure(r.date).diet = true;
	for (const r of hydrationDays) ensure(r.date).hydration = true;

	// Steps: check dates that have at least one other module, plus today
	const now = new Date();
	const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
	const datesToCheck = new Set<string>(map.keys());
	if (todayStr >= startDate && todayStr < endDate) datesToCheck.add(todayStr);

	const stepResults = await Promise.all(
		Array.from(datesToCheck).map(async (date) => ({
			date,
			steps: await fetchStepsForDate(date),
		}))
	);

	for (const { date, steps } of stepResults) {
		if (steps >= STEPS_GOAL) ensure(date).steps = true;
	}

	return map;
}
