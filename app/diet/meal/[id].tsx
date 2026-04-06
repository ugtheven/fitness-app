import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarcodeScanner } from "../../../components/BarcodeScanner";
import { BottomDrawer } from "../../../components/BottomDrawer";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { FoodCard } from "../../../components/FoodCard";
import { NumberField } from "../../../components/NumberField";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { SearchField } from "../../../components/SearchField";
import { db } from "../../../db";
import { dietMealFoods, dietMeals, diets } from "../../../db/schema";
import { normalizeFoodNames } from "../../../lib/api";
import { FOOD_BASES } from "../../../lib/foodCatalog";
import { cacheApiFood, getCachedFood } from "../../../lib/foodQueries";
import type { FoodBase, FoodCategory } from "../../../lib/foodTypes";
import { i18n } from "../../../lib/i18n";
import { importMealFoods } from "../../../lib/nutritionQueries";
import type { OffProduct } from "../../../lib/openFoodFacts";
import { searchByBarcode } from "../../../lib/openFoodFacts";
import { palette } from "../../../lib/palette";
import { radius } from "../../../lib/tokens";

type FoodRow = typeof dietMealFoods.$inferSelect;
type SourceTab = "local" | "scan" | "import";

type SelectedFood = {
	source: "local" | "api";
	id: string;
	nameKey: string;
	name: string;
	nameEn: string | null;
	nameFr: string | null;
	category: string;
	caloriesPer100g: number;
	proteinPer100g: number;
	carbsPer100g: number;
	fatPer100g: number;
	defaultQuantity: number;
};

const ALL_CATEGORIES: FoodCategory[] = [
	"protein",
	"carb",
	"fat",
	"vegetable",
	"fruit",
	"dairy",
	"other",
];

const SOURCE_TABS: { key: SourceTab; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
	{ key: "local", icon: "list-outline" },
	{ key: "scan", icon: "barcode-outline" },
	{ key: "import", icon: "download-outline" },
];

function getFoodDisplayName(item: FoodRow): string {
	if (item.foodSource === "local") {
		return i18n.t(`nutrition.foods.${item.foodId}`);
	}
	const lang = i18n.language?.slice(0, 2);
	if (lang === "fr" && item.nameFr) return item.nameFr;
	if (lang === "en" && item.nameEn) return item.nameEn;
	return item.name;
}

export default function MealScreen() {
	const { t } = useTranslation();
	const { id } = useLocalSearchParams<{ id: string }>();
	const mealId = Number(id);

	// Drawer state
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [step, setStep] = useState<1 | 2>(1);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [selected, setSelected] = useState<SelectedFood | null>(null);
	const [quantity, setQuantity] = useState(100);

	// Step 1 state
	const [sourceTab, setSourceTab] = useState<SourceTab>("local");
	const [search, setSearch] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<FoodCategory | null>(null);

	// Scanner state
	const [scannerOpen, setScannerOpen] = useState(false);
	const [scanLoading, setScanLoading] = useState(false);
	const [scanResult, setScanResult] = useState<OffProduct | null>(null);
	const [scanNotFound, setScanNotFound] = useState(false);

	// Import state
	const [importDietId, setImportDietId] = useState<number | null>(null);

	// DB queries
	const { data: mealData } = useLiveQuery(
		db.select().from(dietMeals).where(eq(dietMeals.id, mealId))
	);
	const meal = mealData?.[0];

	const { data: foodRows = [] } = useLiveQuery(
		db
			.select()
			.from(dietMealFoods)
			.where(eq(dietMealFoods.dietMealId, mealId))
			.orderBy(dietMealFoods.order)
	);

	// Import queries
	const { data: allDiets = [] } = useLiveQuery(db.select().from(diets));
	const { data: importMeals = [] } = useLiveQuery(
		db
			.select()
			.from(dietMeals)
			.where(eq(dietMeals.dietId, importDietId ?? -1))
			.orderBy(dietMeals.order)
	);

	function openDrawer() {
		setEditingId(null);
		setStep(1);
		setSelected(null);
		setQuantity(100);
		setSearch("");
		setCategoryFilter(null);
		setSourceTab("local");
		setScanResult(null);
		setScanNotFound(false);
		setImportDietId(null);
		setDrawerOpen(true);
	}

	const openEditDrawer = useCallback((item: FoodRow) => {
		setEditingId(item.id);
		setSelected({
			source: item.foodSource as SelectedFood["source"],
			id: item.foodId,
			nameKey: item.foodId,
			name: item.name,
			nameEn: item.nameEn,
			nameFr: item.nameFr,
			category: "other",
			caloriesPer100g: item.caloriesPer100g,
			proteinPer100g: item.proteinPer100g,
			carbsPer100g: item.carbsPer100g,
			fatPer100g: item.fatPer100g,
			defaultQuantity: item.quantity,
		});
		setQuantity(item.quantity);
		setStep(2);
		setDrawerOpen(true);
	}, []);

	const confirmDelete = useCallback(
		(itemId: number) => {
			Alert.alert(t("nutrition.deleteFoodTitle"), t("nutrition.deleteFoodMessage"), [
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("common.delete"),
					style: "destructive",
					onPress: async () => {
						await db.delete(dietMealFoods).where(eq(dietMealFoods.id, itemId));
					},
				},
			]);
		},
		[t]
	);

	function pickLocalFood(food: FoodBase) {
		setSelected({
			source: "local",
			id: food.id,
			nameKey: food.nameKey,
			name: t(`nutrition.foods.${food.nameKey}`),
			nameEn: null,
			nameFr: null,
			category: food.category,
			caloriesPer100g: food.caloriesPer100g,
			proteinPer100g: food.proteinPer100g,
			carbsPer100g: food.carbsPer100g,
			fatPer100g: food.fatPer100g,
			defaultQuantity: food.defaultQuantity,
		});
		setQuantity(food.defaultQuantity);
		setStep(2);
	}

	function pickApiFood(product: OffProduct) {
		cacheApiFood(product);
		setSelected({
			source: "api",
			id: product.barcode,
			nameKey: product.barcode,
			name: product.name,
			nameEn: product.nameEn,
			nameFr: product.nameFr,
			category: "other",
			caloriesPer100g: product.caloriesPer100g ?? 0,
			proteinPer100g: product.proteinPer100g ?? 0,
			carbsPer100g: product.carbsPer100g ?? 0,
			fatPer100g: product.fatPer100g ?? 0,
			defaultQuantity: 100,
		});
		setQuantity(100);
		setStep(2);
	}

	async function handleBarcodeScan(barcode: string) {
		setScannerOpen(false);
		setScanLoading(true);
		setScanNotFound(false);
		setSourceTab("scan");
		// Reopen drawer after scanner closes
		setTimeout(() => setDrawerOpen(true), 300);
		// Check cache first to avoid unnecessary network calls
		const cached = await getCachedFood(barcode);
		let product: OffProduct | null = null;
		if (cached) {
			product = {
				barcode: cached.barcode,
				name: cached.name,
				nameEn: null,
				nameFr: null,
				caloriesPer100g: cached.caloriesPer100g,
				proteinPer100g: cached.proteinPer100g,
				carbsPer100g: cached.carbsPer100g,
				fatPer100g: cached.fatPer100g,
				imageUrl: cached.imageUrl,
			};
			// Normalize cached product names
			const [n] = await normalizeFoodNames([product.name]);
			if (n) {
				const lang = i18n.language?.slice(0, 2) ?? "en";
				product = { ...product, name: lang === "fr" ? n.fr : n.en, nameEn: n.en, nameFr: n.fr };
			}
		} else {
			product = await searchByBarcode(barcode);
		}
		setScanLoading(false);
		if (product) {
			setScanResult(product);
		} else {
			setScanNotFound(true);
		}
	}

	async function handleAdd() {
		if (!selected) return;
		try {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			const nextOrder = foodRows.length;
			await db.insert(dietMealFoods).values({
				dietMealId: mealId,
				foodSource: selected.source,
				foodId: selected.id,
				name: selected.name,
				nameEn: selected.nameEn,
				nameFr: selected.nameFr,
				quantity,
				caloriesPer100g: selected.caloriesPer100g,
				proteinPer100g: selected.proteinPer100g,
				carbsPer100g: selected.carbsPer100g,
				fatPer100g: selected.fatPer100g,
				order: nextOrder,
			});
			setDrawerOpen(false);
		} catch (e) {
			console.error("Failed to add food:", e);
		}
	}

	async function handleUpdate() {
		if (!editingId || !selected) return;
		try {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			await db.update(dietMealFoods).set({ quantity }).where(eq(dietMealFoods.id, editingId));
			setDrawerOpen(false);
		} catch (e) {
			console.error("Failed to update food:", e);
		}
	}

	async function handleImportMeal(sourceMealId: number) {
		try {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			const count = await importMealFoods(sourceMealId, mealId);
			setDrawerOpen(false);
			if (count > 0) {
				Alert.alert(t("nutrition.imported", { count }));
			}
		} catch (e) {
			console.error("Failed to import meal:", e);
		}
	}

	if (!meal) return null;

	const totalCalories = foodRows.reduce(
		(sum, f) => sum + (f.caloriesPer100g * f.quantity) / 100,
		0
	);

	// Local tab filtering
	const filteredFoods = FOOD_BASES.filter((f) => {
		const matchesSearch = t(`nutrition.foods.${f.nameKey}`)
			.toLowerCase()
			.includes(search.toLowerCase());
		const matchesCategory = categoryFilter === null || f.category === categoryFilter;
		return matchesSearch && matchesCategory;
	});

	// Step 2 computed macros
	const computedCalories = selected ? (selected.caloriesPer100g * quantity) / 100 : 0;
	const computedProtein = selected ? (selected.proteinPer100g * quantity) / 100 : 0;
	const computedCarbs = selected ? (selected.carbsPer100g * quantity) / 100 : 0;
	const computedFat = selected ? (selected.fatPer100g * quantity) / 100 : 0;

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader
				title={meal.name}
				subtitle={
					totalCalories > 0
						? `${foodRows.length} ${t("nutrition.food").toLowerCase()} · ${Math.round(totalCalories)} ${t("nutrition.kcal")}`
						: `${foodRows.length} ${t("nutrition.food").toLowerCase()}`
				}
				onBack={() => router.back()}
				action={
					<Button
						variant="glow"
						label={t("common.food")}
						startIcon={<Ionicons name="add" size={20} />}
						onPress={openDrawer}
					/>
				}
			/>

			<View className="flex-1 px-6 pt-2">
				{foodRows.length === 0 ? (
					<EmptyState message={t("nutrition.emptyFoods")} hint={t("nutrition.emptyFoodsHint")} />
				) : (
					<ScrollView
						contentContainerStyle={{ paddingTop: 8, paddingBottom: 24, gap: 12 }}
						showsVerticalScrollIndicator={false}
					>
						{foodRows.map((item) => (
							<FoodCard
								key={item.id}
								name={getFoodDisplayName(item)}
								quantity={item.quantity}
								calories={(item.caloriesPer100g * item.quantity) / 100}
								protein={(item.proteinPer100g * item.quantity) / 100}
								carbs={(item.carbsPer100g * item.quantity) / 100}
								fat={(item.fatPer100g * item.quantity) / 100}
								onEdit={() => openEditDrawer(item)}
								onDelete={() => confirmDelete(item.id)}
							/>
						))}
					</ScrollView>
				)}
			</View>

			<BottomDrawer
				visible={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				onBack={step === 2 && !editingId ? () => setStep(1) : undefined}
				title={step === 1 ? t("nutrition.addFood") : selected ? selected.name : t("nutrition.food")}
			>
				{step === 1 ? (
					<View className="gap-3">
						{/* Source tabs — icon only for density */}
						<View className="flex-row gap-2">
							{SOURCE_TABS.map((tab) => (
								<Pressable
									key={tab.key}
									onPress={() => {
										if (tab.key === "scan") {
											setScanResult(null);
											setScanNotFound(false);
											setDrawerOpen(false);
											setTimeout(() => setScannerOpen(true), 300);
											return;
										}
										setSourceTab(tab.key);
										setSearch("");
										setCategoryFilter(null);
										setImportDietId(null);
									}}
									className="flex-1 active:opacity-70"
								>
									<View
										className="items-center rounded-xl py-3"
										style={{
											backgroundColor:
												sourceTab === tab.key ? palette.primary.DEFAULT : palette.muted.DEFAULT,
										}}
									>
										<Ionicons
											name={tab.icon}
											size={20}
											color={
												sourceTab === tab.key
													? palette.primary.foreground
													: palette.muted.foreground
											}
										/>
									</View>
								</Pressable>
							))}
						</View>

						{/* LOCAL TAB */}
						{sourceTab === "local" && (
							<>
								<SearchField
									value={search}
									onChangeText={setSearch}
									placeholder={t("nutrition.searchFood")}
								/>
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={{ gap: 8 }}
								>
									<Pressable onPress={() => setCategoryFilter(null)} className="active:opacity-70">
										<View
											className="rounded-full px-3 py-1.5"
											style={{
												backgroundColor:
													categoryFilter === null ? palette.primary.DEFAULT : palette.muted.DEFAULT,
											}}
										>
											<Text
												className="text-xs font-semibold"
												style={{
													color:
														categoryFilter === null
															? palette.primary.foreground
															: palette.muted.foreground,
												}}
											>
												{t("nutrition.allCategories")}
											</Text>
										</View>
									</Pressable>
									{ALL_CATEGORIES.map((cat) => (
										<Pressable
											key={cat}
											onPress={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
											className="active:opacity-70"
										>
											<View
												className="rounded-full px-3 py-1.5"
												style={{
													backgroundColor:
														categoryFilter === cat
															? palette.primary.DEFAULT
															: palette.muted.DEFAULT,
												}}
											>
												<Text
													className="text-xs font-semibold"
													style={{
														color:
															categoryFilter === cat
																? palette.primary.foreground
																: palette.muted.foreground,
													}}
												>
													{t(`nutrition.categories.${cat}`)}
												</Text>
											</View>
										</Pressable>
									))}
								</ScrollView>
								<ScrollView showsVerticalScrollIndicator={false}>
									<View className="gap-2">
										{filteredFoods.map((food) => (
											<Pressable
												key={food.id}
												onPress={() => pickLocalFood(food)}
												className="active:opacity-70"
											>
												<View
													className="flex-row items-center bg-background px-4 py-3"
													style={{ borderRadius: radius.md }}
												>
													<View className="flex-1 gap-1">
														<Text className="text-base font-semibold text-foreground">
															{t(`nutrition.foods.${food.nameKey}`)}
														</Text>
														<Text className="text-xs text-muted-foreground">
															{food.caloriesPer100g} {t("nutrition.kcal")} · P:{" "}
															{food.proteinPer100g}
															{t("nutrition.grams")} · G: {food.carbsPer100g}
															{t("nutrition.grams")} · L: {food.fatPer100g}
															{t("nutrition.grams")}
														</Text>
													</View>
													<Ionicons
														name="chevron-forward"
														size={18}
														color={palette.muted.foreground}
													/>
												</View>
											</Pressable>
										))}
									</View>
								</ScrollView>
							</>
						)}

						{/* SCAN TAB — shows results after scanning */}
						{sourceTab === "scan" && (
							<View className="items-center gap-4 py-4">
								{scanLoading ? (
									<>
										<ActivityIndicator color={palette.muted.foreground} />
										<Text className="text-sm text-muted-foreground">
											{t("nutrition.searching")}
										</Text>
									</>
								) : scanResult ? (
									<View className="w-full gap-3">
										<Pressable
											onPress={() => pickApiFood(scanResult)}
											className="active:opacity-70"
										>
											<View className="bg-background px-5 py-4" style={{ borderRadius: radius.lg }}>
												<Text className="text-base font-semibold text-foreground">
													{scanResult.name}
												</Text>
												<Text className="mt-1 text-xs text-muted-foreground">
													{scanResult.caloriesPer100g ?? "?"} {t("nutrition.kcal")} · P:{" "}
													{scanResult.proteinPer100g ?? "?"}
													{t("nutrition.grams")} · G: {scanResult.carbsPer100g ?? "?"}
													{t("nutrition.grams")} · L: {scanResult.fatPer100g ?? "?"}
													{t("nutrition.grams")}
												</Text>
											</View>
										</Pressable>
										<Button
											variant="glow"
											fullWidth
											label={t("nutrition.scanBarcode")}
											startIcon={<Ionicons name="barcode-outline" size={20} />}
											onPress={() => {
												setScanResult(null);
												setScanNotFound(false);
												setDrawerOpen(false);
												setTimeout(() => setScannerOpen(true), 300);
											}}
										/>
									</View>
								) : scanNotFound ? (
									<>
										<Text className="text-sm" style={{ color: palette.orange.DEFAULT }}>
											{t("nutrition.productNotFound")}
										</Text>
										<Button
											variant="glow"
											label={t("nutrition.scanBarcode")}
											startIcon={<Ionicons name="barcode-outline" size={20} />}
											onPress={() => {
												setScanNotFound(false);
												setDrawerOpen(false);
												setTimeout(() => setScannerOpen(true), 300);
											}}
										/>
									</>
								) : null}
							</View>
						)}

						{/* IMPORT TAB */}
						{sourceTab === "import" && (
							<ScrollView showsVerticalScrollIndicator={false}>
								{importDietId == null ? (
									<View className="gap-2">
										{allDiets
											.filter((d) => d.id !== meal?.dietId)
											.map((d) => (
												<Pressable
													key={d.id}
													onPress={() => setImportDietId(d.id)}
													className="active:opacity-70"
												>
													<View
														className="flex-row items-center bg-background px-4 py-3"
														style={{ borderRadius: radius.md }}
													>
														<View className="flex-1">
															<Text className="text-base font-semibold text-foreground">
																{d.name}
															</Text>
														</View>
														<Ionicons
															name="chevron-forward"
															size={18}
															color={palette.muted.foreground}
														/>
													</View>
												</Pressable>
											))}
										{allDiets.filter((d) => d.id !== meal?.dietId).length === 0 && (
											<Text className="py-4 text-center text-sm text-muted-foreground">
												{t("nutrition.noOtherDiets")}
											</Text>
										)}
									</View>
								) : (
									<View className="gap-2">
										<Pressable onPress={() => setImportDietId(null)} className="active:opacity-70">
											<View className="flex-row items-center gap-2 pb-2">
												<Ionicons name="arrow-back" size={18} color={palette.muted.foreground} />
												<Text className="text-sm text-muted-foreground">
													{t("nutrition.selectDiet")}
												</Text>
											</View>
										</Pressable>
										{importMeals.map((m) => (
											<Pressable
												key={m.id}
												onPress={() => handleImportMeal(m.id)}
												className="active:opacity-70"
											>
												<View
													className="flex-row items-center bg-background px-4 py-3"
													style={{ borderRadius: radius.md }}
												>
													<View className="flex-1 gap-0.5">
														<Text className="text-base font-semibold text-foreground">
															{m.name}
														</Text>
														{m.targetTime && (
															<Text className="text-xs text-muted-foreground">{m.targetTime}</Text>
														)}
													</View>
													<Ionicons
														name="download-outline"
														size={18}
														color={palette.muted.foreground}
													/>
												</View>
											</Pressable>
										))}
										{importMeals.length === 0 && (
											<Text className="py-4 text-center text-sm text-muted-foreground">
												{t("nutrition.emptyMeals")}
											</Text>
										)}
									</View>
								)}
							</ScrollView>
						)}
					</View>
				) : (
					<View className="gap-4">
						{/* Food info card */}
						{selected && (
							<View className="rounded-2xl bg-background px-5 py-4">
								<Text className="text-base font-semibold text-foreground">{selected.name}</Text>
								<Text className="mt-1 text-xs text-muted-foreground">
									{selected.caloriesPer100g} {t("nutrition.kcal")} · P: {selected.proteinPer100g}
									{t("nutrition.grams")} · G: {selected.carbsPer100g}
									{t("nutrition.grams")} · L: {selected.fatPer100g}
									{t("nutrition.grams")} {t("nutrition.per100g")}
								</Text>
							</View>
						)}

						{/* Quantity */}
						<NumberField
							label={t("nutrition.quantity")}
							value={quantity}
							onValueChange={setQuantity}
							min={1}
							step={10}
							endAdornment={t("nutrition.grams")}
						/>

						{/* Computed macros */}
						<View className="rounded-2xl bg-background px-5 py-4">
							<Text className="mb-2 text-sm font-semibold text-foreground">
								{t("nutrition.macros")}
							</Text>
							<View className="flex-row justify-between">
								<View className="items-center">
									<Text className="text-lg font-bold text-foreground">
										{Math.round(computedCalories)}
									</Text>
									<Text className="text-xs text-muted-foreground">{t("nutrition.kcal")}</Text>
								</View>
								<View className="items-center">
									<Text className="text-lg font-bold" style={{ color: palette.blue.DEFAULT }}>
										{Math.round(computedProtein)}
									</Text>
									<Text className="text-xs text-muted-foreground">{t("nutrition.protein")}</Text>
								</View>
								<View className="items-center">
									<Text className="text-lg font-bold" style={{ color: palette.orange.DEFAULT }}>
										{Math.round(computedCarbs)}
									</Text>
									<Text className="text-xs text-muted-foreground">{t("nutrition.carbs")}</Text>
								</View>
								<View className="items-center">
									<Text className="text-lg font-bold" style={{ color: palette.green.DEFAULT }}>
										{Math.round(computedFat)}
									</Text>
									<Text className="text-xs text-muted-foreground">{t("nutrition.fat")}</Text>
								</View>
							</View>
						</View>

						<Button
							variant="glow"
							fullWidth
							label={editingId ? t("common.save") : t("nutrition.addFood")}
							onPress={editingId ? handleUpdate : handleAdd}
						/>
					</View>
				)}
			</BottomDrawer>

			<BarcodeScanner
				visible={scannerOpen}
				onScanned={handleBarcodeScan}
				onClose={() => setScannerOpen(false)}
			/>
		</SafeAreaView>
	);
}
