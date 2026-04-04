import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { insertWeightLog, upsertHeight } from "./profileQueries";
import { XP_REWARDS } from "./xp";
import { checkAndGrantAchievements, grantXp } from "./xpQueries";

const HEALTHKIT_ENABLED_KEY = "healthkit_enabled";

// ─── Preference ─────────────────────────────────────────────────────────────

export async function isHealthKitEnabled(): Promise<boolean> {
	const val = await AsyncStorage.getItem(HEALTHKIT_ENABLED_KEY);
	return val === "true";
}

export async function setHealthKitEnabled(enabled: boolean): Promise<void> {
	await AsyncStorage.setItem(HEALTHKIT_ENABLED_KEY, String(enabled));
}

// ─── Permissions ────────────────────────────────────────────────────────────

export async function requestHealthKitPermissions(): Promise<boolean> {
	if (Platform.OS !== "ios") return false;

	const { requestAuthorization } = await import("@kingstinct/react-native-healthkit");

	await requestAuthorization({
		toRead: [
			"HKQuantityTypeIdentifierBodyMass",
			"HKQuantityTypeIdentifierHeight",
			"HKQuantityTypeIdentifierStepCount",
		],
		toShare: ["HKQuantityTypeIdentifierBodyMass", "HKQuantityTypeIdentifierHeight"],
	});

	// HealthKit never tells if read was granted or denied — always returns true
	return true;
}

// ─── Write / Delete weight ──────────────────────────────────────────────────

export async function writeWeightToHealthKit(
	date: string,
	weightKg: number
): Promise<string | null> {
	if (Platform.OS !== "ios") return null;

	try {
		const { saveQuantitySample } = await import("@kingstinct/react-native-healthkit");
		const [y, m, d] = date.split("-").map(Number);
		const sampleDate = new Date(y, m - 1, d, 12);
		const sample = await saveQuantitySample(
			"HKQuantityTypeIdentifierBodyMass",
			"kg",
			weightKg,
			sampleDate,
			sampleDate
		);
		return sample?.uuid ?? null;
	} catch {
		return null;
	}
}

export async function deleteWeightFromHealthKit(uuid: string): Promise<void> {
	if (Platform.OS !== "ios") return;

	try {
		const { deleteObjects } = await import("@kingstinct/react-native-healthkit");
		await deleteObjects("HKQuantityTypeIdentifierBodyMass", { uuid });
	} catch {
		// Sample may already be deleted — ignore
	}
}

// ─── Sync weight + height ───────────────────────────────────────────────────

export async function syncHealthKitData(): Promise<void> {
	if (Platform.OS !== "ios") return;

	const { getMostRecentQuantitySample, queryQuantitySamples } = await import(
		"@kingstinct/react-native-healthkit"
	);

	// Sync all weight history (HealthKit → local, with UUID tracking)
	try {
		const samples = await queryQuantitySamples("HKQuantityTypeIdentifierBodyMass", {
			ascending: true,
			limit: 0,
		});
		if (__DEV__) console.log("[healthkit] weight samples:", samples.length);
		for (const sample of samples) {
			const weightKg = sample.quantity;
			const date = new Date(sample.startDate).toISOString().slice(0, 10);
			if (__DEV__) console.log("[healthkit] weight:", date, weightKg, "kg");
			await insertWeightLog(date, weightKg, {
				skipHealthKit: true,
				healthkitUuid: sample.uuid,
			});
		}
	} catch (e) {
		console.error("[healthkit] weight sync error:", e);
	}

	// Sync height (latest only)
	try {
		const heightSample = await getMostRecentQuantitySample("HKQuantityTypeIdentifierHeight");
		if (__DEV__) console.log("[healthkit] height sample:", heightSample);
		if (heightSample) {
			// HealthKit returns height in cm by default
			const heightCm = heightSample.quantity;
			if (__DEV__) console.log("[healthkit] height:", heightCm, "cm");
			await upsertHeight(heightCm);
		}
	} catch (e) {
		console.error("[healthkit] height sync error:", e);
	}
}

// ─── Steps ──────────────────────────────────────────────────────────────────

export async function grantStepsXpIfNeeded(
	steps: number,
	date: string
): Promise<{ leveledUp: boolean; newLevel: number } | null> {
	let leveledUp = false;
	let newLevel = 0;

	if (steps >= 5000) {
		const result = await grantXp(XP_REWARDS.steps5k, "steps", `${date}:5k`, date);
		if (result.granted) await checkAndGrantAchievements(date);
		if (result.leveledUp) {
			leveledUp = true;
			newLevel = result.newLevel;
		}
	}
	if (steps >= 10000) {
		const result = await grantXp(XP_REWARDS.steps10k, "steps", `${date}:10k`, date);
		if (result.granted) await checkAndGrantAchievements(date);
		if (result.leveledUp) {
			leveledUp = true;
			newLevel = result.newLevel;
		}
	}

	return leveledUp ? { leveledUp, newLevel } : null;
}

export async function fetchTodaySteps(): Promise<number> {
	if (Platform.OS !== "ios") return 0;

	try {
		const { queryStatisticsForQuantity } = await import("@kingstinct/react-native-healthkit");

		const now = new Date();
		const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		const result = await queryStatisticsForQuantity(
			"HKQuantityTypeIdentifierStepCount",
			["cumulativeSum"],
			{
				filter: {
					date: { startDate: startOfDay, endDate: now },
				},
			}
		);

		return Math.round(result?.sumQuantity?.quantity ?? 0);
	} catch {
		return 0;
	}
}
