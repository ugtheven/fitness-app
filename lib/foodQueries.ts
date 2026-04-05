import { eq } from "drizzle-orm";
import { db } from "../db";
import { cachedApiFoods } from "../db/schema";
import type { OffProduct } from "./openFoodFacts";

export async function cacheApiFood(product: OffProduct): Promise<void> {
	if (!product.barcode) return;
	await db
		.insert(cachedApiFoods)
		.values({
			barcode: product.barcode,
			name: product.name,
			caloriesPer100g: product.caloriesPer100g,
			proteinPer100g: product.proteinPer100g,
			carbsPer100g: product.carbsPer100g,
			fatPer100g: product.fatPer100g,
			imageUrl: product.imageUrl,
		})
		.onConflictDoUpdate({
			target: cachedApiFoods.barcode,
			set: {
				name: product.name,
				caloriesPer100g: product.caloriesPer100g,
				proteinPer100g: product.proteinPer100g,
				carbsPer100g: product.carbsPer100g,
				fatPer100g: product.fatPer100g,
				imageUrl: product.imageUrl,
				cachedAt: new Date().toISOString(),
			},
		});
}

const CACHE_TTL_DAYS = 30;

export async function getCachedFood(barcode: string) {
	const rows = await db
		.select()
		.from(cachedApiFoods)
		.where(eq(cachedApiFoods.barcode, barcode))
		.limit(1);
	const food = rows[0] ?? null;
	if (!food) return null;

	// Ignore stale cache entries
	if (food.cachedAt) {
		const age = Date.now() - new Date(food.cachedAt).getTime();
		if (age > CACHE_TTL_DAYS * 86_400_000) return null;
	}
	return food;
}
