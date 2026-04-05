export type FoodCategory = "protein" | "carb" | "fat" | "vegetable" | "fruit" | "dairy" | "other";

export type FoodBase = {
	id: string;
	nameKey: string;
	category: FoodCategory;
	caloriesPer100g: number;
	proteinPer100g: number;
	carbsPer100g: number;
	fatPer100g: number;
	defaultQuantity: number;
};
