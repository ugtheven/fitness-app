const DEFAULT_GOAL_ML = 2500;
const ML_PER_KG = 35;

/**
 * Compute daily hydration goal from body weight.
 * Formula: weight (kg) × 35ml, rounded to nearest 100ml.
 * Falls back to 2500ml if weight is unknown.
 */
export function computeHydrationGoal(weightKg: number | null): number {
	if (weightKg == null) return DEFAULT_GOAL_ML;
	return Math.round((weightKg * ML_PER_KG) / 100) * 100;
}

export function formatLiters(ml: number): string {
	return (ml / 1000).toFixed(1);
}

export function todayStr(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
