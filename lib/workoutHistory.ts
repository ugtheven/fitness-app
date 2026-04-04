import { and, desc, eq, gte, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "../db";
import { workoutExercises, workoutSessions, workoutSets } from "../db/schema";

// --- Types ---

export type PrefillSet = {
	setIndex: number;
	reps: number | null;
	repsLeft: number | null;
	repsRight: number | null;
	weight: number | null;
};

export type ExercisePR = {
	maxWeight: number;
};

export type ExerciseHistoryEntry = {
	startedAt: string;
	maxWeight: number;
};

export type WorkoutSummary = {
	id: number;
	startedAt: string;
	endedAt: string | null;
	sessionName: string | null;
	exerciseCount: number;
	setCount: number;
	totalVolume: number;
};

// --- Queries ---

/**
 * Returns all sets from the last completed workout for a given exercise variant.
 * Used for set-by-set prefill in the logging screen.
 */
export async function getLastSets(exerciseVariantId: string): Promise<PrefillSet[]> {
	// Find the most recent completed workout session that contains this exercise
	const lastSession = await db
		.select({ workoutSessionId: workoutExercises.workoutSessionId })
		.from(workoutExercises)
		.innerJoin(workoutSessions, eq(workoutExercises.workoutSessionId, workoutSessions.id))
		.where(
			and(
				eq(workoutExercises.exerciseVariantId, exerciseVariantId),
				eq(workoutExercises.status, "completed"),
				eq(workoutSessions.status, "completed")
			)
		)
		.orderBy(desc(workoutSessions.startedAt))
		.limit(1);

	if (lastSession.length === 0) return [];

	const rows = await db
		.select({
			setIndex: workoutSets.setIndex,
			reps: workoutSets.reps,
			repsLeft: workoutSets.repsLeft,
			repsRight: workoutSets.repsRight,
			weight: workoutSets.weight,
		})
		.from(workoutSets)
		.innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
		.where(
			and(
				eq(workoutExercises.workoutSessionId, lastSession[0].workoutSessionId),
				eq(workoutExercises.exerciseVariantId, exerciseVariantId)
			)
		)
		.orderBy(workoutSets.setIndex);

	return rows;
}

/**
 * Returns the max weight ever lifted for a given exercise variant.
 */
export async function getExercisePR(exerciseVariantId: string): Promise<ExercisePR | null> {
	const rows = await db
		.select({
			maxWeight: sql<number>`MAX(${workoutSets.weight})`,
		})
		.from(workoutSets)
		.innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
		.innerJoin(workoutSessions, eq(workoutExercises.workoutSessionId, workoutSessions.id))
		.where(
			and(
				eq(workoutExercises.exerciseVariantId, exerciseVariantId),
				eq(workoutSessions.status, "completed"),
				isNotNull(workoutSets.weight)
			)
		);

	const maxWeight = rows[0]?.maxWeight;
	if (maxWeight == null) return null;

	return { maxWeight };
}

/**
 * Returns exercise history grouped by session (max weight per session).
 * Used for the exercise history sheet in Activity.
 */
export async function getExerciseHistory(
	exerciseVariantId: string
): Promise<ExerciseHistoryEntry[]> {
	return db
		.select({
			startedAt: workoutSessions.startedAt,
			maxWeight: sql<number>`MAX(${workoutSets.weight})`,
		})
		.from(workoutSets)
		.innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
		.innerJoin(workoutSessions, eq(workoutExercises.workoutSessionId, workoutSessions.id))
		.where(
			and(
				eq(workoutExercises.exerciseVariantId, exerciseVariantId),
				eq(workoutSessions.status, "completed"),
				isNotNull(workoutSets.weight)
			)
		)
		.groupBy(workoutSessions.id)
		.orderBy(desc(workoutSessions.startedAt));
}

/**
 * Returns the exercises and their sets for a given workout session.
 * Used for the workout detail screen in Activity.
 */
export async function getWorkoutDetail(workoutSessionId: number) {
	const exercises = await db
		.select({
			id: workoutExercises.id,
			exerciseVariantId: workoutExercises.exerciseVariantId,
			isUnilateral: workoutExercises.isUnilateral,
			prescribedSets: workoutExercises.prescribedSets,
			prescribedReps: workoutExercises.prescribedReps,
			prescribedWeight: workoutExercises.prescribedWeight,
			status: workoutExercises.status,
		})
		.from(workoutExercises)
		.where(eq(workoutExercises.workoutSessionId, workoutSessionId))
		.orderBy(workoutExercises.id);

	const sets = await db
		.select({
			workoutExerciseId: workoutSets.workoutExerciseId,
			setIndex: workoutSets.setIndex,
			reps: workoutSets.reps,
			repsLeft: workoutSets.repsLeft,
			repsRight: workoutSets.repsRight,
			weight: workoutSets.weight,
		})
		.from(workoutSets)
		.innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
		.where(eq(workoutExercises.workoutSessionId, workoutSessionId))
		.orderBy(workoutSets.workoutExerciseId, workoutSets.setIndex);

	// Group sets by exercise
	const setsByExercise = new Map<number, typeof sets>();
	for (const set of sets) {
		const arr = setsByExercise.get(set.workoutExerciseId) ?? [];
		arr.push(set);
		setsByExercise.set(set.workoutExerciseId, arr);
	}

	return exercises.map((ex) => ({
		...ex,
		sets: setsByExercise.get(ex.id) ?? [],
	}));
}

/**
 * Returns detailed exercise history: all sets grouped by session.
 * Used for the exercise history bottom sheet.
 */
export async function getExerciseHistoryDetailed(exerciseVariantId: string) {
	const rows = await db
		.select({
			workoutSessionId: workoutExercises.workoutSessionId,
			startedAt: workoutSessions.startedAt,
			setIndex: workoutSets.setIndex,
			reps: workoutSets.reps,
			repsLeft: workoutSets.repsLeft,
			repsRight: workoutSets.repsRight,
			weight: workoutSets.weight,
			isUnilateral: workoutExercises.isUnilateral,
		})
		.from(workoutSets)
		.innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
		.innerJoin(workoutSessions, eq(workoutExercises.workoutSessionId, workoutSessions.id))
		.where(
			and(
				eq(workoutExercises.exerciseVariantId, exerciseVariantId),
				eq(workoutSessions.status, "completed")
			)
		)
		.orderBy(desc(workoutSessions.startedAt), workoutSets.setIndex);

	// Group by session
	const sessionsMap = new Map<
		number,
		{
			startedAt: string;
			sets: {
				reps: number | null;
				repsLeft: number | null;
				repsRight: number | null;
				weight: number | null;
				isUnilateral: boolean;
			}[];
		}
	>();

	for (const row of rows) {
		let session = sessionsMap.get(row.workoutSessionId);
		if (!session) {
			session = { startedAt: row.startedAt, sets: [] };
			sessionsMap.set(row.workoutSessionId, session);
		}
		session.sets.push({
			reps: row.reps,
			repsLeft: row.repsLeft,
			repsRight: row.repsRight,
			weight: row.weight,
			isUnilateral: row.isUnilateral,
		});
	}

	return Array.from(sessionsMap.values());
}

/**
 * Returns the total number of sets ever completed for a given exercise variant.
 */
export async function getExerciseTotalSets(exerciseVariantId: string): Promise<number> {
	const rows = await db
		.select({ count: sql<number>`COUNT(${workoutSets.id})` })
		.from(workoutSets)
		.innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
		.innerJoin(workoutSessions, eq(workoutExercises.workoutSessionId, workoutSessions.id))
		.where(
			and(
				eq(workoutExercises.exerciseVariantId, exerciseVariantId),
				eq(workoutSessions.status, "completed")
			)
		);

	return rows[0]?.count ?? 0;
}

/**
 * Returns PRs beaten during a given workout session.
 * Compares each exercise's max weight in this session vs all previous sessions.
 */
export async function getSessionPRs(workoutSessionId: number): Promise<
	{
		exerciseVariantId: string;
		newWeight: number;
		previousWeight: number | null;
	}[]
> {
	// Get max weight per exercise in this session
	const sessionMaxes = await db
		.select({
			exerciseVariantId: workoutExercises.exerciseVariantId,
			maxWeight: sql<number>`MAX(${workoutSets.weight})`,
		})
		.from(workoutSets)
		.innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
		.where(
			and(eq(workoutExercises.workoutSessionId, workoutSessionId), isNotNull(workoutSets.weight))
		)
		.groupBy(workoutExercises.exerciseVariantId);

	if (sessionMaxes.length === 0) return [];

	const prs: { exerciseVariantId: string; newWeight: number; previousWeight: number | null }[] = [];

	for (const { exerciseVariantId, maxWeight } of sessionMaxes) {
		if (maxWeight == null) continue;

		// Get max weight from all OTHER completed sessions
		const [prev] = await db
			.select({ maxWeight: sql<number>`MAX(${workoutSets.weight})` })
			.from(workoutSets)
			.innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
			.innerJoin(workoutSessions, eq(workoutExercises.workoutSessionId, workoutSessions.id))
			.where(
				and(
					eq(workoutExercises.exerciseVariantId, exerciseVariantId),
					eq(workoutSessions.status, "completed"),
					sql`${workoutExercises.workoutSessionId} != ${workoutSessionId}`,
					isNotNull(workoutSets.weight)
				)
			);

		const previousMax = prev?.maxWeight ?? null;

		if (previousMax == null || maxWeight > previousMax) {
			prs.push({ exerciseVariantId, newWeight: maxWeight, previousWeight: previousMax });
		}
	}

	return prs;
}

/**
 * Returns all completed workout sessions for the Activity tab.
 * Handles unilateral volume correctly: uses reps when available, otherwise repsLeft + repsRight.
 */
/**
 * Returns all completed workout sessions for a given month.
 * Same shape as getRecentWorkoutsQuery() but filtered by month.
 */
export function getWorkoutsByMonthQuery(year: number, month: number) {
	const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
	const endDate =
		month === 11 ? `${year + 1}-01-01` : `${year}-${String(month + 2).padStart(2, "0")}-01`;

	return db
		.select({
			id: workoutSessions.id,
			startedAt: workoutSessions.startedAt,
			endedAt: workoutSessions.endedAt,
			date: workoutSessions.date,
			sessionName: workoutSessions.sessionName,
			exerciseCount: sql<number>`COUNT(DISTINCT ${workoutExercises.id})`,
			setCount: sql<number>`COUNT(${workoutSets.id})`,
			totalVolume: sql<number>`COALESCE(SUM(
				COALESCE(${workoutSets.reps}, COALESCE(${workoutSets.repsLeft}, 0) + COALESCE(${workoutSets.repsRight}, 0))
				* COALESCE(${workoutSets.weight}, 0)
			), 0)`,
		})
		.from(workoutSessions)
		.leftJoin(workoutExercises, eq(workoutExercises.workoutSessionId, workoutSessions.id))
		.leftJoin(workoutSets, eq(workoutSets.workoutExerciseId, workoutExercises.id))
		.where(
			and(
				eq(workoutSessions.status, "completed"),
				gte(workoutSessions.date, startDate),
				lt(workoutSessions.date, endDate)
			)
		)
		.groupBy(workoutSessions.id)
		.orderBy(desc(workoutSessions.startedAt));
}

export function getRecentWorkoutsQuery() {
	return db
		.select({
			id: workoutSessions.id,
			startedAt: workoutSessions.startedAt,
			endedAt: workoutSessions.endedAt,
			sessionName: workoutSessions.sessionName,
			exerciseCount: sql<number>`COUNT(DISTINCT ${workoutExercises.id})`,
			setCount: sql<number>`COUNT(${workoutSets.id})`,
			totalVolume: sql<number>`COALESCE(SUM(
				COALESCE(${workoutSets.reps}, COALESCE(${workoutSets.repsLeft}, 0) + COALESCE(${workoutSets.repsRight}, 0))
				* COALESCE(${workoutSets.weight}, 0)
			), 0)`,
		})
		.from(workoutSessions)
		.leftJoin(workoutExercises, eq(workoutExercises.workoutSessionId, workoutSessions.id))
		.leftJoin(workoutSets, eq(workoutSets.workoutExerciseId, workoutExercises.id))
		.where(eq(workoutSessions.status, "completed"))
		.groupBy(workoutSessions.id)
		.orderBy(desc(workoutSessions.startedAt));
}
