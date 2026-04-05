import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { NumberField } from "../../components/NumberField";
import { ScreenHeader } from "../../components/ScreenHeader";
import { TextField } from "../../components/TextField";
import { db } from "../../db";
import { customFoods } from "../../db/schema";
import type { FoodCategory } from "../../lib/foodTypes";
import { palette } from "../../lib/palette";

const ALL_CATEGORIES: FoodCategory[] = [
	"protein",
	"carb",
	"fat",
	"vegetable",
	"fruit",
	"dairy",
	"other",
];

export default function CustomFoodScreen() {
	const { t } = useTranslation();
	const [name, setName] = useState("");
	const [category, setCategory] = useState<FoodCategory>("other");
	const [calories, setCalories] = useState(0);
	const [protein, setProtein] = useState(0);
	const [carbs, setCarbs] = useState(0);
	const [fat, setFat] = useState(0);

	async function handleCreate() {
		const trimmed = name.trim();
		if (!trimmed) return;
		try {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			await db.insert(customFoods).values({
				name: trimmed,
				category,
				caloriesPer100g: calories,
				proteinPer100g: protein,
				carbsPer100g: carbs,
				fatPer100g: fat,
			});
			router.back();
		} catch (e) {
			console.error("Failed to create custom food:", e);
		}
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader title={t("nutrition.createCustomFood")} onBack={() => router.back()} />
			<View className="flex-1 px-6 pt-4 gap-4">
				<TextField
					label={t("nutrition.customFoodName")}
					value={name}
					onChangeText={setName}
					placeholder={t("nutrition.customFoodName")}
					autoFocus
				/>
				<View className="gap-1.5">
					<Text className="text-sm font-medium text-foreground">
						{t("nutrition.categoryLabel")}
					</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ gap: 8 }}
					>
						{ALL_CATEGORIES.map((cat) => (
							<Pressable key={cat} onPress={() => setCategory(cat)} className="active:opacity-70">
								<View
									className="rounded-full px-3 py-1.5"
									style={{
										backgroundColor:
											category === cat ? palette.primary.DEFAULT : palette.muted.DEFAULT,
									}}
								>
									<Text
										className="text-xs font-semibold"
										style={{
											color:
												category === cat ? palette.primary.foreground : palette.muted.foreground,
										}}
									>
										{t(`nutrition.categories.${cat}`)}
									</Text>
								</View>
							</Pressable>
						))}
					</ScrollView>
				</View>
				<NumberField
					label={`${t("nutrition.calories")} ${t("nutrition.per100g")}`}
					value={calories}
					onValueChange={setCalories}
					min={0}
					step={5}
					endAdornment={t("nutrition.kcal")}
				/>
				<View className="flex-row gap-3">
					<View className="flex-1">
						<NumberField
							label={`${t("nutrition.protein")} ${t("nutrition.per100g")}`}
							value={protein}
							onValueChange={setProtein}
							min={0}
							step={1}
							endAdornment={t("nutrition.grams")}
						/>
					</View>
					<View className="flex-1">
						<NumberField
							label={`${t("nutrition.carbs")} ${t("nutrition.per100g")}`}
							value={carbs}
							onValueChange={setCarbs}
							min={0}
							step={1}
							endAdornment={t("nutrition.grams")}
						/>
					</View>
				</View>
				<NumberField
					label={`${t("nutrition.fat")} ${t("nutrition.per100g")}`}
					value={fat}
					onValueChange={setFat}
					min={0}
					step={1}
					endAdornment={t("nutrition.grams")}
				/>
				<Button
					variant="glow"
					fullWidth
					label={t("common.create")}
					onPress={handleCreate}
					disabled={!name.trim()}
				/>
			</View>
		</SafeAreaView>
	);
}
