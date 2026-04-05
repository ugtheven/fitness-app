import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../db";
import {
	bodyMeasurements,
	goals,
	userProfile,
	weightLogs,
	workoutExercises,
	workoutSessions,
	workoutSets,
} from "../db/schema";
import { checkAndGrantAchievements } from "./xpQueries";

// ─── Read queries (for useLiveQuery) ────────────────────────────────────────

export function getLatestWeightQuery() {
	return db.select().from(weightLogs).orderBy(desc(weightLogs.date)).limit(1);
}

export function getTwoLatestWeightsQuery() {
	return db.select().from(weightLogs).orderBy(desc(weightLogs.date)).limit(2);
}

export function getWeightLogsQuery() {
	return db.select().from(weightLogs).orderBy(weightLogs.date);
}

export function getUserProfileQuery() {
	return db.select().from(userProfile).limit(1);
}

export function getLatestMeasurementsQuery() {
	return db.select().from(bodyMeasurements).orderBy(desc(bodyMeasurements.date)).limit(1);
}

export function getMeasurementHistoryQuery() {
	return db.select().from(bodyMeasurements).orderBy(bodyMeasurements.date);
}

export function getAllExercisePRsQuery() {
	return db
		.select({
			exerciseVariantId: workoutExercises.exerciseVariantId,
			maxWeight: sql<number>`MAX(${workoutSets.weight})`,
		})
		.from(workoutSets)
		.innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
		.innerJoin(workoutSessions, eq(workoutExercises.workoutSessionId, workoutSessions.id))
		.where(and(eq(workoutSessions.status, "completed"), isNotNull(workoutSets.weight)))
		.groupBy(workoutExercises.exerciseVariantId);
}

// ─── Goals queries ──────────────────────────────────────────────────────────

export function getActiveGoalsQuery() {
	return db.select().from(goals).where(eq(goals.status, "active")).orderBy(goals.deadline);
}

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Insert or update a weight log. When called from HealthKit sync, pass
 * `skipHealthKit: true` and optionally a `healthkitUuid` to avoid re-pushing.
 */
export async function insertWeightLog(
	date: string,
	weightKg: number,
	options?: { skipHealthKit?: boolean; healthkitUuid?: string | null }
) {
	const skip = options?.skipHealthKit ?? false;
	let uuid = options?.healthkitUuid ?? null;

	if (!skip) {
		// Lazy-import to avoid circular deps and keep HealthKit optional
		const { isHealthKitEnabled, writeWeightToHealthKit, deleteWeightFromHealthKit } = await import(
			"./healthkit"
		);
		const enabled = await isHealthKitEnabled();
		if (enabled) {
			// Delete old HealthKit sample if one exists for this date
			const existing = await db
				.select({ healthkitUuid: weightLogs.healthkitUuid })
				.from(weightLogs)
				.where(eq(weightLogs.date, date));
			if (existing[0]?.healthkitUuid) {
				await deleteWeightFromHealthKit(existing[0].healthkitUuid);
			}
			uuid = await writeWeightToHealthKit(date, weightKg);
		}
	}

	await db
		.insert(weightLogs)
		.values({ date, weightKg, healthkitUuid: uuid })
		.onConflictDoUpdate({
			target: weightLogs.date,
			set: { weightKg, healthkitUuid: uuid, createdAt: new Date().toISOString() },
		});
}

export async function deleteWeightLog(date: string) {
	const existing = await db
		.select({ healthkitUuid: weightLogs.healthkitUuid })
		.from(weightLogs)
		.where(eq(weightLogs.date, date));

	if (existing[0]?.healthkitUuid) {
		const { isHealthKitEnabled, deleteWeightFromHealthKit } = await import("./healthkit");
		const enabled = await isHealthKitEnabled();
		if (enabled) {
			await deleteWeightFromHealthKit(existing[0].healthkitUuid);
		}
	}

	await db.delete(weightLogs).where(eq(weightLogs.date, date));
}

export async function upsertHeight(heightCm: number) {
	await db.insert(userProfile).values({ id: 1, heightCm }).onConflictDoUpdate({
		target: userProfile.id,
		set: { heightCm },
	});
}

export async function insertBodyMeasurements(data: {
	date: string;
	bodyFat?: number | null;
	shoulders?: number | null;
	chest?: number | null;
	waist?: number | null;
	hips?: number | null;
	neck?: number | null;
	arms?: number | null;
	thigh?: number | null;
	calf?: number | null;
}) {
	const { date, ...fields } = data;
	await db
		.insert(bodyMeasurements)
		.values(data)
		.onConflictDoUpdate({
			target: bodyMeasurements.date,
			set: { ...fields, createdAt: new Date().toISOString() },
		});
}

type MeasurementField =
	| "bodyFat"
	| "shoulders"
	| "chest"
	| "waist"
	| "hips"
	| "neck"
	| "arms"
	| "thigh"
	| "calf";

export async function updateMeasurementField(date: string, key: MeasurementField, value: number) {
	await db
		.update(bodyMeasurements)
		.set({ [key]: value })
		.where(eq(bodyMeasurements.date, date));
}

export async function deleteMeasurementField(date: string, key: MeasurementField) {
	await db
		.update(bodyMeasurements)
		.set({ [key]: null })
		.where(eq(bodyMeasurements.date, date));
}

type GoalType =
	| "weight"
	| "bodyFat"
	| "shoulders"
	| "chest"
	| "waist"
	| "hips"
	| "neck"
	| "arms"
	| "thigh"
	| "calf";

export async function insertGoal(data: {
	type: GoalType;
	targetValue: number;
	startValue: number;
	deadline: string;
}) {
	// One active goal per type: archive existing then insert — atomic
	await db.transaction(async (tx) => {
		await tx
			.update(goals)
			.set({ status: "abandoned" })
			.where(and(eq(goals.type, data.type), eq(goals.status, "active")));
		await tx.insert(goals).values(data);
	});
}

export async function updateGoalStatus(goalId: number, status: "achieved" | "abandoned") {
	await db.update(goals).set({ status }).where(eq(goals.id, goalId));

	if (status === "achieved") {
		const today = new Date().toISOString().slice(0, 10);
		await checkAndGrantAchievements(today);
	}
}
