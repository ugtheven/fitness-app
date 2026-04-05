import { Ionicons } from "@expo/vector-icons";
import { desc, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomDrawer } from "../../components/BottomDrawer";
import { Button } from "../../components/Button";
import { DietCard } from "../../components/DietCard";
import { EmptyState } from "../../components/EmptyState";
import { TextField } from "../../components/TextField";
import { db } from "../../db";
import { dietMeals, diets } from "../../db/schema";
import { palette } from "../../lib/palette";
import { borders, spacing } from "../../lib/tokens";

const MAX_CHIPS = 3;

export default function NutritionScreen() {
	const { t } = useTranslation();
	const [newDrawerOpen, setNewDrawerOpen] = useState(false);
	const [switchDrawerOpen, setSwitchDrawerOpen] = useState(false);
	const [dietName, setDietName] = useState("");

	const { data = [] } = useLiveQuery(
		db.select().from(diets).orderBy(desc(diets.isActive), desc(diets.createdAt))
	);

	const { data: allMeals = [] } = useLiveQuery(
		db
			.select({
				id: dietMeals.id,
				dietId: dietMeals.dietId,
				name: dietMeals.name,
				targetTime: dietMeals.targetTime,
			})
			.from(dietMeals)
			.orderBy(dietMeals.order)
	);

	const activeDiet = data.find((d) => d.isActive) ?? null;
	const otherDiets = data.filter((d) => !d.isActive);
	const activeMeals = activeDiet ? getDietMeals(activeDiet.id) : [];
	const activeOverflow = activeMeals.length - MAX_CHIPS;

	function getDietMeals(dietId: number) {
		return allMeals.filter((m) => m.dietId === dietId);
	}

	async function handleCreate() {
		const name = dietName.trim();
		if (!name) return;
		try {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			const isFirst = data.length === 0;
			const result = await db
				.insert(diets)
				.values({ name, isActive: isFirst })
				.returning({ id: diets.id });
			const newId = result[0]?.id;
			setDietName("");
			setNewDrawerOpen(false);
			if (newId) router.push(`/diet/${newId}`);
		} catch (e) {
			console.error("Failed to create diet:", e);
		}
	}

	async function handleSetActive(id: number) {
		await db.transaction(async (tx) => {
			await tx.update(diets).set({ isActive: false });
			await tx.update(diets).set({ isActive: true }).where(eq(diets.id, id));
		});
		setSwitchDrawerOpen(false);
	}

	function handleDelete(id: number, name: string) {
		Alert.alert(t("nutrition.deleteDietTitle"), t("nutrition.deleteDietMessage", { name }), [
			{ text: t("common.cancel"), style: "cancel" },
			{
				text: t("common.delete"),
				style: "destructive",
				onPress: async () => {
					await db.delete(diets).where(eq(diets.id, id));
				},
			},
		]);
	}

	function formatMacroGoals() {
		if (!activeDiet?.calorieGoal) return null;
		const parts = [`${activeDiet.calorieGoal} ${t("nutrition.kcal")}`];
		if (activeDiet.proteinGoal) parts.push(`P: ${activeDiet.proteinGoal}g`);
		if (activeDiet.carbGoal) parts.push(`G: ${activeDiet.carbGoal}g`);
		if (activeDiet.fatGoal) parts.push(`L: ${activeDiet.fatGoal}g`);
		return parts.join(" · ");
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<View className="flex-1 px-6 pt-2">
				{/* Header */}
				<View className="flex-row items-center justify-between gap-3">
					<Text className="min-w-0 shrink text-2xl font-bold text-foreground" numberOfLines={1}>
						{t("nutrition.title")}
					</Text>
					<View className="flex-row items-center gap-2">
						{data.length > 0 && (
							<Pressable
								onPress={() => setSwitchDrawerOpen(true)}
								className="rounded-full p-2 active:opacity-70"
								hitSlop={8}
							>
								<Ionicons name="swap-horizontal" size={22} color={palette.foreground} />
							</Pressable>
						)}
						<Button
							variant="glow"
							label={t("common.diet")}
							startIcon={<Ionicons name="add" size={20} />}
							onPress={() => setNewDrawerOpen(true)}
						/>
					</View>
				</View>

				{data.length === 0 ? (
					<EmptyState message={t("nutrition.empty")} hint={t("nutrition.emptyHint")} />
				) : (
					<ScrollView
						contentContainerStyle={{
							paddingTop: 20,
							paddingBottom: spacing.navbarClearance,
							gap: 12,
						}}
						showsVerticalScrollIndicator={false}
					>
						{/* Active diet */}
						{activeDiet && (
							<Pressable
								onPress={() => router.push(`/diet/${activeDiet.id}`)}
								className="active:opacity-70"
							>
								<View
									className="rounded-2xl bg-card p-5"
									style={{ borderWidth: borders.emphasis, borderColor: palette.accent.DEFAULT }}
								>
									{/* Card header */}
									<View className="mb-4 flex-row items-center gap-3">
										<View
											className="rounded-xl p-2"
											style={{ backgroundColor: palette.accent.muted }}
										>
											<Ionicons name="restaurant" size={18} color={palette.accent.DEFAULT} />
										</View>
										<Text
											className="flex-1 text-xs font-bold tracking-widest"
											style={{ color: palette.accent.DEFAULT }}
										>
											{t("nutrition.activeDiet").toUpperCase()}
										</Text>
										<Ionicons name="chevron-forward" size={18} color={palette.muted.foreground} />
									</View>

									{/* Diet name */}
									<Text className="mb-3 text-2xl font-bold text-foreground">{activeDiet.name}</Text>

									{/* Stats */}
									<View className="mb-3 flex-row items-center gap-4">
										<View className="flex-row items-center gap-1.5">
											<View
												className="h-2 w-2 rounded-full"
												style={{ backgroundColor: palette.accent.DEFAULT }}
											/>
											<Text className="text-sm font-medium text-foreground">
												{t("nutrition.mealCount", { count: activeMeals.length })}
											</Text>
										</View>
									</View>

									{/* Macro goals */}
									{formatMacroGoals() && (
										<Text className="mb-3 text-sm text-muted-foreground">{formatMacroGoals()}</Text>
									)}

									{/* Meal chips */}
									{activeMeals.length > 0 && (
										<View className="flex-row flex-wrap gap-2">
											{activeMeals.slice(0, MAX_CHIPS).map((m) => (
												<View
													key={m.id}
													className="flex-row items-center rounded-full border border-border bg-background px-3 py-1"
												>
													<Text className="text-xs font-medium text-foreground">
														{m.name}
														{m.targetTime ? ` · ${m.targetTime}` : ""}
													</Text>
												</View>
											))}
											{activeOverflow > 0 && (
												<View className="rounded-full border border-border bg-background px-3 py-1">
													<Text className="text-xs font-medium text-muted-foreground">
														+{activeOverflow}
													</Text>
												</View>
											)}
										</View>
									)}
								</View>
							</Pressable>
						)}

						{/* Other diets */}
						{otherDiets.length > 0 && (
							<>
								<Text className="mt-2 text-xs font-bold tracking-widest text-muted-foreground">
									{t("nutrition.otherDiets").toUpperCase()}
								</Text>
								{otherDiets.map((item) => (
									<DietCard
										key={item.id}
										name={item.name}
										mealCount={getDietMeals(item.id).length}
										meals={getDietMeals(item.id)}
										onPress={() => router.push(`/diet/${item.id}`)}
										onDelete={() => handleDelete(item.id, item.name)}
									/>
								))}
							</>
						)}
					</ScrollView>
				)}
			</View>

			{/* New diet drawer */}
			<BottomDrawer
				visible={newDrawerOpen}
				onClose={() => setNewDrawerOpen(false)}
				title={t("nutrition.newDiet")}
			>
				<View className="gap-4">
					<TextField
						label={t("common.name")}
						value={dietName}
						onChangeText={setDietName}
						placeholder={t("nutrition.namePlaceholder")}
						autoFocus
						returnKeyType="done"
						onSubmitEditing={handleCreate}
					/>
					<Button
						variant="glow"
						fullWidth
						label={t("common.create")}
						onPress={handleCreate}
						disabled={!dietName.trim()}
					/>
				</View>
			</BottomDrawer>

			{/* Switch diet drawer */}
			<BottomDrawer
				visible={switchDrawerOpen}
				onClose={() => setSwitchDrawerOpen(false)}
				title={t("nutrition.switchDiet")}
			>
				<View className="gap-3">
					{data.map((item) => {
						const count = getDietMeals(item.id).length;
						return (
							<Pressable
								key={item.id}
								onPress={() => handleSetActive(item.id)}
								className="active:opacity-70"
							>
								<View className="flex-row items-center gap-4 rounded-2xl bg-card px-5 py-4">
									<View
										className="h-6 w-6 items-center justify-center rounded-full border-2"
										style={
											item.isActive
												? {
														borderColor: palette.primary.DEFAULT,
														backgroundColor: palette.primary.DEFAULT,
													}
												: { borderColor: palette.muted.foreground }
										}
									>
										{item.isActive && (
											<Ionicons name="checkmark" size={14} color={palette.primary.foreground} />
										)}
									</View>
									<View className="flex-1">
										<Text className="text-base font-semibold text-foreground">{item.name}</Text>
										<Text className="mt-0.5 text-xs text-muted-foreground">
											{t("nutrition.mealCount", { count })}
										</Text>
									</View>
								</View>
							</Pressable>
						);
					})}
				</View>
			</BottomDrawer>
		</SafeAreaView>
	);
}
