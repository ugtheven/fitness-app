import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { eq, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomDrawer } from "../../components/BottomDrawer";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { MealCard } from "../../components/MealCard";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SortableList } from "../../components/SortableList";
import { TextField } from "../../components/TextField";
import { db } from "../../db";
import { dietMealFoods, dietMeals, diets } from "../../db/schema";
import { palette } from "../../lib/palette";

type MealRow = typeof dietMeals.$inferSelect;

export default function DietScreen() {
	const { t } = useTranslation();
	const { id } = useLocalSearchParams<{ id: string }>();
	const dietId = Number(id);

	const [drawerOpen, setDrawerOpen] = useState(false);
	const [mealName, setMealName] = useState("");
	const [targetTime, setTargetTime] = useState<Date | null>(null);
	const [showTimePicker, setShowTimePicker] = useState(false);

	const { data: dietData } = useLiveQuery(db.select().from(diets).where(eq(diets.id, dietId)));
	const diet = dietData?.[0];

	const { data: mealData = [] } = useLiveQuery(
		db.select().from(dietMeals).where(eq(dietMeals.dietId, dietId)).orderBy(dietMeals.order)
	);

	const { data: mealFoodStats = [] } = useLiveQuery(
		db
			.select({
				dietMealId: dietMealFoods.dietMealId,
				foodCount: sql<number>`count(*)`,
				totalCalories: sql<number>`sum(calories_per_100g * quantity / 100)`,
				totalProtein: sql<number>`sum(protein_per_100g * quantity / 100)`,
				totalCarbs: sql<number>`sum(carbs_per_100g * quantity / 100)`,
				totalFat: sql<number>`sum(fat_per_100g * quantity / 100)`,
			})
			.from(dietMealFoods)
			.innerJoin(dietMeals, eq(dietMealFoods.dietMealId, dietMeals.id))
			.where(eq(dietMeals.dietId, dietId))
			.groupBy(dietMealFoods.dietMealId)
	);

	const getMealStats = useCallback(
		(mealId: number) => mealFoodStats.find((s) => s.dietMealId === mealId),
		[mealFoodStats]
	);

	const totalCalories = mealFoodStats.reduce((sum, s) => sum + (s.totalCalories ?? 0), 0);
	const totalProtein = mealFoodStats.reduce((sum, s) => sum + (s.totalProtein ?? 0), 0);
	const totalCarbs = mealFoodStats.reduce((sum, s) => sum + (s.totalCarbs ?? 0), 0);
	const totalFat = mealFoodStats.reduce((sum, s) => sum + (s.totalFat ?? 0), 0);

	async function handleCreate() {
		const name = mealName.trim();
		if (!name) return;
		try {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			const nextOrder = mealData.length;
			const time = targetTime
				? `${String(targetTime.getHours()).padStart(2, "0")}:${String(targetTime.getMinutes()).padStart(2, "0")}`
				: null;
			const result = await db
				.insert(dietMeals)
				.values({ dietId, name, order: nextOrder, targetTime: time })
				.returning({ id: dietMeals.id });
			const newId = result[0]?.id;
			setMealName("");
			setTargetTime(null);
			setShowTimePicker(false);
			setDrawerOpen(false);
			if (newId) router.push(`/diet/meal/${newId}`);
		} catch (e) {
			console.error("Failed to create meal:", e);
		}
	}

	async function handleReorder(newData: MealRow[]) {
		try {
			await Promise.all(
				newData.map((meal, index) =>
					db.update(dietMeals).set({ order: index }).where(eq(dietMeals.id, meal.id))
				)
			);
		} catch (e) {
			console.error("Failed to reorder meals:", e);
		}
	}

	const handleDelete = useCallback(
		(mealId: number, name: string) => {
			Alert.alert(t("nutrition.deleteMealTitle"), t("nutrition.deleteMealMessage", { name }), [
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("common.delete"),
					style: "destructive",
					onPress: async () => {
						await db.delete(dietMeals).where(eq(dietMeals.id, mealId));
					},
				},
			]);
		},
		[t]
	);

	const renderItem = useCallback(
		({ item, isDragging }: { item: MealRow; isDragging: boolean }) => {
			const stats = getMealStats(item.id);
			return (
				<MealCard
					name={item.name}
					targetTime={item.targetTime}
					foodCount={stats?.foodCount ?? 0}
					calories={stats?.totalCalories ?? 0}
					isDragging={isDragging}
					onPress={() => router.push(`/diet/meal/${item.id}`)}
					onDelete={() => handleDelete(item.id, item.name)}
				/>
			);
		},
		[getMealStats, handleDelete]
	);

	if (!diet) return null;

	const hasGoals = diet.calorieGoal || diet.proteinGoal || diet.carbGoal || diet.fatGoal;
	const caloriesOver = diet.calorieGoal ? totalCalories > diet.calorieGoal : false;

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader
				title={diet.name}
				subtitle={t("nutrition.mealCount", { count: mealData.length })}
				onBack={() => router.back()}
				action={
					<Button
						variant="glow"
						label={t("common.meal")}
						startIcon={<Ionicons name="add" size={20} />}
						onPress={() => setDrawerOpen(true)}
					/>
				}
			/>

			<View className="flex-1 px-6 pt-2">
				{/* Macro summary */}
				{(hasGoals || totalCalories > 0) && (
					<View className="mb-3 gap-1">
						{hasGoals && (
							<Text className="text-xs text-muted-foreground">
								{t("nutrition.goalMacros")} : {diet.calorieGoal ?? "—"} {t("nutrition.kcal")}
								{diet.proteinGoal ? ` · P: ${diet.proteinGoal}g` : ""}
								{diet.carbGoal ? ` · G: ${diet.carbGoal}g` : ""}
								{diet.fatGoal ? ` · L: ${diet.fatGoal}g` : ""}
							</Text>
						)}
						{totalCalories > 0 && (
							<Text
								className="text-xs font-medium"
								style={{ color: caloriesOver ? palette.destructive.DEFAULT : palette.foreground }}
							>
								{t("nutrition.totalMacros")} : {Math.round(totalCalories)} {t("nutrition.kcal")}
								{` · P: ${Math.round(totalProtein)}g`}
								{` · G: ${Math.round(totalCarbs)}g`}
								{` · L: ${Math.round(totalFat)}g`}
							</Text>
						)}
					</View>
				)}

				{mealData.length === 0 ? (
					<EmptyState message={t("nutrition.emptyMeals")} hint={t("nutrition.emptyMealsHint")} />
				) : (
					<SortableList
						data={mealData}
						keyExtractor={(item) => String(item.id)}
						renderItem={renderItem}
						onReorder={handleReorder}
						estimatedItemHeight={80}
						itemGap={12}
						contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
					/>
				)}
			</View>

			<BottomDrawer
				visible={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				title={t("nutrition.newMeal")}
			>
				<View className="gap-4">
					<TextField
						label={t("common.name")}
						value={mealName}
						onChangeText={setMealName}
						placeholder={t("nutrition.mealNamePlaceholder")}
						autoFocus
						returnKeyType="next"
					/>
					<View className="gap-1">
						<Text className="text-sm font-medium text-muted-foreground">
							{t("nutrition.targetTime")}
						</Text>
						<Pressable
							onPress={() => {
								if (!targetTime) setTargetTime(new Date());
								setShowTimePicker(true);
							}}
							className="flex-row items-center justify-between rounded-xl px-4 py-3"
							style={{
								backgroundColor: palette.muted.DEFAULT,
								borderWidth: 1,
								borderColor: palette.border,
							}}
						>
							<Text
								style={{
									color: targetTime ? palette.foreground : palette.muted.foreground,
								}}
								className="text-base"
							>
								{targetTime
									? `${String(targetTime.getHours()).padStart(2, "0")}:${String(targetTime.getMinutes()).padStart(2, "0")}`
									: "08:00"}
							</Text>
							{targetTime && (
								<Pressable
									hitSlop={12}
									onPress={() => {
										setTargetTime(null);
										setShowTimePicker(false);
									}}
								>
									<Ionicons name="close-circle" size={18} color={palette.muted.foreground} />
								</Pressable>
							)}
						</Pressable>
						{showTimePicker && (
							<DateTimePicker
								value={targetTime ?? new Date()}
								mode="time"
								display="spinner"
								is24Hour
								themeVariant="dark"
								onChange={(_e, date) => {
									if (date) setTargetTime(date);
								}}
							/>
						)}
					</View>
					<Button
						variant="glow"
						fullWidth
						label={t("common.create")}
						onPress={handleCreate}
						disabled={!mealName.trim()}
					/>
				</View>
			</BottomDrawer>
		</SafeAreaView>
	);
}
