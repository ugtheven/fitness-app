import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext } from "react";

export type UnitSystem = "metric" | "imperial";
const UNIT_KEY = "app_unit_system";

// ── Persistence ──

export async function loadUnitSystem(): Promise<UnitSystem> {
	const stored = await AsyncStorage.getItem(UNIT_KEY);
	return (stored as UnitSystem) ?? "metric";
}

export async function saveUnitSystem(system: UnitSystem): Promise<void> {
	await AsyncStorage.setItem(UNIT_KEY, system);
}

// ── Context ──

type UnitContextValue = {
	system: UnitSystem;
	setSystem: (s: UnitSystem) => void;
	// Weight (kg ↔ lbs)
	displayWeight: (kg: number) => number;
	toStorageWeight: (displayed: number) => number;
	weightUnit: string;
	weightStep: number;
	weightMin: number;
	weightMax: number;
	// Length (cm ↔ in)
	displayLength: (cm: number) => number;
	toStorageLength: (displayed: number) => number;
	lengthUnit: string;
	lengthStep: number;
	// Height (cm → "175 cm" or "5'9\"")
	displayHeight: (cm: number) => string;
	heightUnit: string;
	heightStep: number;
	heightMin: number;
	heightMax: number;
};

const KG_TO_LBS = 2.20462;
const CM_TO_IN = 1 / 2.54;

function round1(n: number): number {
	return Math.round(n * 10) / 10;
}

/** 2-decimal precision for storage — absorbs float conversion drift */
function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

function round05(n: number): number {
	return Math.round(n * 2) / 2;
}

function buildContextValue(
	system: UnitSystem,
	setSystem: (s: UnitSystem) => void
): UnitContextValue {
	const isImperial = system === "imperial";

	return {
		system,
		setSystem,
		// Weight
		displayWeight: (kg) => round1(isImperial ? kg * KG_TO_LBS : kg),
		toStorageWeight: (displayed) => round2(isImperial ? displayed / KG_TO_LBS : displayed),
		weightUnit: isImperial ? "lbs" : "kg",
		weightStep: isImperial ? 5 : 2.5,
		weightMin: isImperial ? 44 : 20,
		weightMax: isImperial ? 660 : 300,
		// Length
		displayLength: (cm) => round05(isImperial ? cm * CM_TO_IN : cm),
		toStorageLength: (displayed) => round2(isImperial ? displayed / CM_TO_IN : displayed),
		lengthUnit: isImperial ? "in" : "cm",
		lengthStep: isImperial ? 0.5 : 0.5,
		// Height (ft'in" for imperial, cm for metric)
		displayHeight: (cm) => {
			if (!isImperial) return `${Math.round(cm)}`;
			const totalInches = cm * CM_TO_IN;
			const feet = Math.floor(totalInches / 12);
			const inches = Math.round(totalInches % 12);
			return `${feet}'${inches}"`;
		},
		heightUnit: isImperial ? "" : "cm",
		heightStep: isImperial ? 0.5 : 1,
		heightMin: isImperial ? 39 : 100,
		heightMax: isImperial ? 98 : 250,
	};
}

export const UnitContext = createContext<UnitContextValue>(buildContextValue("metric", () => {}));

export function useUnits(): UnitContextValue {
	return useContext(UnitContext);
}

export { buildContextValue };
