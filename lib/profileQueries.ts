import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../db";
import { bodyMeasurements, goals, userProfile, weightLogs, workoutExercises, workoutSessions, workoutSets } from "../db/schema";

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

export function getAllExercisePRsQuery() {
	return db
		.select({
			exerciseVariantId: workoutExercises.exerciseVariantId,
			maxWeight: sql<number>`MAX(${workoutSets.weight})`,
		})
		.from(workoutSets)
		.innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
		.innerJoin(workoutSessions, eq(workoutExercises.workoutSessionId, workoutSessions.id))
		.where(
			and(
				eq(workoutSessions.status, "completed"),
				isNotNull(workoutSets.weight),
			),
		)
		.groupBy(workoutExercises.exerciseVariantId);
}

// ─── Goals queries ──────────────────────────────────────────────────────────

export function getActiveGoalsQuery() {
	return db.select().from(goals).where(eq(goals.status, "active")).orderBy(goals.deadline);
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export async function insertWeightLog(date: string, weightKg: number) {
	await db
		.insert(weightLogs)
		.values({ date, weightKg })
		.onConflictDoUpdate({
			target: weightLogs.date,
			set: { weightKg, createdAt: new Date().toISOString() },
		});
}

export async function upsertHeight(heightCm: number) {
	await db
		.insert(userProfile)
		.values({ id: 1, heightCm })
		.onConflictDoUpdate({
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

type GoalType = "weight" | "bodyFat" | "shoulders" | "chest" | "waist" | "hips" | "neck" | "arms" | "thigh" | "calf";

export async function insertGoal(data: { type: GoalType; targetValue: number; startValue: number; deadline: string }) {
	// One active goal per type: archive existing active goal of same type
	await db
		.update(goals)
		.set({ status: "abandoned" })
		.where(and(eq(goals.type, data.type), eq(goals.status, "active")));
	await db.insert(goals).values(data);
}

export async function updateGoalStatus(goalId: number, status: "achieved" | "abandoned") {
	await db.update(goals).set({ status }).where(eq(goals.id, goalId));
}
