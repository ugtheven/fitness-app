import { db } from "../db";
import { bodyMeasurements, weightLogs } from "../db/schema";

/**
 * Seeds weight + measurement data for testing.
 * Uses onConflictDoUpdate so it's safe to call multiple times.
 */
export async function seedWeightLogs() {
	const today = new Date();

	// Weight: 7 days
	const weightEntries = [
		{ daysAgo: 7, weight: 77.2 },
		{ daysAgo: 6, weight: 77.4 },
		{ daysAgo: 5, weight: 77.1 },
		{ daysAgo: 4, weight: 77.5 },
		{ daysAgo: 3, weight: 77.3 },
		{ daysAgo: 2, weight: 77.8 },
		{ daysAgo: 1, weight: 77.6 },
	];

	for (const { daysAgo, weight } of weightEntries) {
		const date = dateStr(today, daysAgo);
		await db
			.insert(weightLogs)
			.values({ date, weightKg: weight })
			.onConflictDoUpdate({ target: weightLogs.date, set: { weightKg: weight } });
	}

	// Measurements: 5 entries spread over ~4 months
	const measurementEntries = [
		{
			daysAgo: 120,
			bodyFat: 18, shoulders: 114, chest: 98, waist: 82, hips: 95,
			neck: 38, arms: 33, thigh: 56, calf: 37,
		},
		{
			daysAgo: 90,
			bodyFat: 17.5, shoulders: 115, chest: 99, waist: 81, hips: 95,
			neck: 38.5, arms: 33.5, thigh: 56.5, calf: 37,
		},
		{
			daysAgo: 60,
			bodyFat: 16.8, shoulders: 116, chest: 100, waist: 80.5, hips: 94.5,
			neck: 38.5, arms: 34, thigh: 57, calf: 37.5,
		},
		{
			daysAgo: 30,
			bodyFat: 16.2, shoulders: 117, chest: 101, waist: 80, hips: 94,
			neck: 39, arms: 34.5, thigh: 57.5, calf: 37.5,
		},
		{
			daysAgo: 1,
			bodyFat: 15.5, shoulders: 118, chest: 102, waist: 79, hips: 94,
			neck: 39, arms: 35, thigh: 58, calf: 38,
		},
	];

	for (const { daysAgo, ...fields } of measurementEntries) {
		const date = dateStr(today, daysAgo);
		await db
			.insert(bodyMeasurements)
			.values({ date, ...fields })
			.onConflictDoUpdate({ target: bodyMeasurements.date, set: { ...fields } });
	}
}

function dateStr(from: Date, daysAgo: number): string {
	const d = new Date(from);
	d.setDate(d.getDate() - daysAgo);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
