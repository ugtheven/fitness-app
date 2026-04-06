import { sql } from "drizzle-orm";
import pako from "pako";
import { z } from "zod";
import type { Database } from "../db";
import * as schema from "../db/schema";

// ─── Types ──────────────────────────────────────────────────────────────────────

export const CURRENT_BACKUP_VERSION = 14;

const CHUNK_SIZE = 200;

export type BackupData = {
	version: number;
	exportedAt: string;
	tables: {
		userProfile: (typeof schema.userProfile.$inferSelect)[];
		userLevel: (typeof schema.userLevel.$inferSelect)[];
		programs: (typeof schema.programs.$inferSelect)[];
		sessions: (typeof schema.sessions.$inferSelect)[];
		sessionExercises: (typeof schema.sessionExercises.$inferSelect)[];
		workoutSessions: (typeof schema.workoutSessions.$inferSelect)[];
		workoutExercises: (typeof schema.workoutExercises.$inferSelect)[];
		workoutSets: (typeof schema.workoutSets.$inferSelect)[];
		weightLogs: (typeof schema.weightLogs.$inferSelect)[];
		bodyMeasurements: (typeof schema.bodyMeasurements.$inferSelect)[];
		goals: (typeof schema.goals.$inferSelect)[];
		hydrationLogs: (typeof schema.hydrationLogs.$inferSelect)[];
		xpLogs: (typeof schema.xpLogs.$inferSelect)[];
		userAchievements: (typeof schema.userAchievements.$inferSelect)[];
		diets: (typeof schema.diets.$inferSelect)[];
		dietMeals: (typeof schema.dietMeals.$inferSelect)[];
		dietMealFoods: (typeof schema.dietMealFoods.$inferSelect)[];
		customFoods: (typeof schema.customFoods.$inferSelect)[];
		cachedApiFoods: (typeof schema.cachedApiFoods.$inferSelect)[];
		dailyMealLogs: (typeof schema.dailyMealLogs.$inferSelect)[];
	};
};

const TABLE_NAMES = [
	"userProfile",
	"userLevel",
	"programs",
	"sessions",
	"sessionExercises",
	"workoutSessions",
	"workoutExercises",
	"workoutSets",
	"weightLogs",
	"bodyMeasurements",
	"goals",
	"hydrationLogs",
	"xpLogs",
	"userAchievements",
	"diets",
	"dietMeals",
	"dietMealFoods",
	"customFoods",
	"cachedApiFoods",
	"dailyMealLogs",
] as const;

const backupSchema = z.object({
	version: z.number().int().min(1).max(CURRENT_BACKUP_VERSION),
	exportedAt: z.string(),
	tables: z.object(
		Object.fromEntries(TABLE_NAMES.map((k) => [k, z.array(z.record(z.string(), z.unknown()))])) as {
			[K in (typeof TABLE_NAMES)[number]]: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
		}
	),
});

export type BackupMetadata = {
	version: number;
	exportedAt: string;
	entries: number;
};

// ─── Export ─────────────────────────────────────────────────────────────────────

export async function exportAllData(db: Database): Promise<BackupData> {
	return {
		version: CURRENT_BACKUP_VERSION,
		exportedAt: new Date().toISOString(),
		tables: {
			userProfile: await db.select().from(schema.userProfile),
			userLevel: await db.select().from(schema.userLevel),
			programs: await db.select().from(schema.programs),
			sessions: await db.select().from(schema.sessions),
			sessionExercises: await db.select().from(schema.sessionExercises),
			workoutSessions: await db.select().from(schema.workoutSessions),
			workoutExercises: await db.select().from(schema.workoutExercises),
			workoutSets: await db.select().from(schema.workoutSets),
			weightLogs: await db.select().from(schema.weightLogs),
			bodyMeasurements: await db.select().from(schema.bodyMeasurements),
			goals: await db.select().from(schema.goals),
			hydrationLogs: await db.select().from(schema.hydrationLogs),
			xpLogs: await db.select().from(schema.xpLogs),
			userAchievements: await db.select().from(schema.userAchievements),
			diets: await db.select().from(schema.diets),
			dietMeals: await db.select().from(schema.dietMeals),
			dietMealFoods: await db.select().from(schema.dietMealFoods),
			customFoods: await db.select().from(schema.customFoods),
			cachedApiFoods: await db.select().from(schema.cachedApiFoods),
			dailyMealLogs: await db.select().from(schema.dailyMealLogs),
		},
	};
}

// ─── Serialize / Deserialize ────────────────────────────────────────────────────

export function serializeBackup(data: BackupData): Uint8Array {
	const json = JSON.stringify(data);
	return pako.gzip(json);
}

export function deserializeBackup(bytes: Uint8Array): BackupData {
	const json = pako.ungzip(bytes, { to: "string" });
	const raw = JSON.parse(json);
	const result = backupSchema.safeParse(raw);
	if (!result.success) {
		throw new Error("INVALID_BACKUP");
	}
	return raw as BackupData;
}

// ─── Restore ────────────────────────────────────────────────────────────────────

// Ordre de suppression : enfants → parents
const DELETE_ORDER = [
	schema.dailyMealLogs,
	schema.cachedApiFoods,
	schema.customFoods,
	schema.dietMealFoods,
	schema.dietMeals,
	schema.diets,
	schema.userAchievements,
	schema.xpLogs,
	schema.hydrationLogs,
	schema.goals,
	schema.bodyMeasurements,
	schema.weightLogs,
	schema.workoutSets,
	schema.workoutExercises,
	schema.workoutSessions,
	schema.sessionExercises,
	schema.sessions,
	schema.programs,
	schema.userLevel,
	schema.userProfile,
] as const;

// Ordre d'insertion : parents → enfants (avec clé correspondante dans BackupData)
const INSERT_ORDER: { table: (typeof DELETE_ORDER)[number]; key: keyof BackupData["tables"] }[] = [
	{ table: schema.userProfile, key: "userProfile" },
	{ table: schema.userLevel, key: "userLevel" },
	{ table: schema.programs, key: "programs" },
	{ table: schema.sessions, key: "sessions" },
	{ table: schema.sessionExercises, key: "sessionExercises" },
	{ table: schema.workoutSessions, key: "workoutSessions" },
	{ table: schema.workoutExercises, key: "workoutExercises" },
	{ table: schema.workoutSets, key: "workoutSets" },
	{ table: schema.weightLogs, key: "weightLogs" },
	{ table: schema.bodyMeasurements, key: "bodyMeasurements" },
	{ table: schema.goals, key: "goals" },
	{ table: schema.hydrationLogs, key: "hydrationLogs" },
	{ table: schema.xpLogs, key: "xpLogs" },
	{ table: schema.userAchievements, key: "userAchievements" },
	{ table: schema.diets, key: "diets" },
	{ table: schema.dietMeals, key: "dietMeals" },
	{ table: schema.dietMealFoods, key: "dietMealFoods" },
	{ table: schema.customFoods, key: "customFoods" },
	{ table: schema.cachedApiFoods, key: "cachedApiFoods" },
	{ table: schema.dailyMealLogs, key: "dailyMealLogs" },
];

export async function restoreAllData(db: Database, data: BackupData): Promise<void> {
	if (data.version > CURRENT_BACKUP_VERSION) {
		throw new Error("BACKUP_TOO_NEW");
	}

	await db.transaction(async (tx) => {
		tx.run(sql`PRAGMA foreign_keys = OFF`);

		for (const table of DELETE_ORDER) {
			tx.delete(table).run();
		}

		for (const { table, key } of INSERT_ORDER) {
			const rows = data.tables[key];
			if (rows.length === 0) continue;
			for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
				const chunk = rows.slice(i, i + CHUNK_SIZE);
				// biome-ignore lint/suspicious/noExplicitAny: generic insert across all table types
				tx.insert(table)
					.values(chunk as any[])
					.run();
			}
		}

		tx.run(sql`PRAGMA foreign_keys = ON`);
		const fkCheck = tx.all<{ table: string }>(sql`PRAGMA foreign_key_check`);
		if (fkCheck.length > 0) {
			throw new Error("FK_CHECK_FAILED");
		}
	});
}

// ─── Utils ──────────────────────────────────────────────────────────────────────

export function countEntries(data: BackupData): number {
	return Object.values(data.tables).reduce((sum, rows) => sum + rows.length, 0);
}
