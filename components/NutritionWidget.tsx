import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AppState, Pressable, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { db } from "../db";
import { dailyMealLogs, dietMeals, diets } from "../db/schema";
import { todayStr } from "../lib/hydration";
import { cheatMeal, confirmMeal, skipMeal, undoMealLog } from "../lib/nutritionQueries";
import { palette } from "../lib/palette";
import { radius } from "../lib/tokens";

const themeColor = palette.green.DEFAULT;
const themeMuted = palette.green.muted;

export function NutritionWidget() {
	const { t } = useTranslation();
	const [today, setToday] = useState(todayStr);

	// Refresh date on foreground
	useEffect(() => {
		const sub = AppState.addEventListener("change", (state) => {
			if (state === "active") setToday(todayStr());
		});
		return () => sub.remove();
	}, []);

	// Active diet
	const { data: activeDiets = [] } = useLiveQuery(
		db.select().from(diets).where(eq(diets.isActive, true)).limit(1)
	);
	const diet = activeDiets[0] ?? null;

	// All meals (filtered client-side to avoid stale query reference bug)
	const { data: allMeals = [] } = useLiveQuery(
		db.select().from(dietMeals).orderBy(dietMeals.order)
	);
	const meals = useMemo(
		() => (diet ? allMeals.filter((m) => m.dietId === diet.id) : []),
		[allMeals, diet]
	);

	// Today's logs
	const { data: todayLogs = [] } = useLiveQuery(
		db.select().from(dailyMealLogs).where(eq(dailyMealLogs.date, today))
	);

	// Logged meal IDs for today
	const loggedMealIds = useMemo(() => new Set(todayLogs.map((l) => l.dietMealId)), [todayLogs]);

	// Next meal (first unlogged)
	const nextMeal = useMemo(
		() => meals.find((m) => !loggedMealIds.has(m.id)) ?? null,
		[meals, loggedMealIds]
	);

	// Total logged macros (confirmed + cheat only)
	const totalLogged = useMemo(() => {
		const counted = todayLogs.filter((l) => l.status !== "skipped");
		return {
			calories: counted.reduce((s, l) => s + l.totalCalories, 0),
			protein: counted.reduce((s, l) => s + l.totalProtein, 0),
			carbs: counted.reduce((s, l) => s + l.totalCarbs, 0),
			fat: counted.reduce((s, l) => s + l.totalFat, 0),
		};
	}, [todayLogs]);

	// Progress
	const progress = diet?.calorieGoal
		? Math.min(1, totalLogged.calories / diet.calorieGoal)
		: meals.length > 0
			? Math.min(1, todayLogs.length / meals.length)
			: 0;
	const isComplete = diet?.calorieGoal
		? totalLogged.calories >= diet.calorieGoal
		: todayLogs.length >= meals.length && meals.length > 0;

	// Micro-feedback
	const [feedbackText, setFeedbackText] = useState<string | null>(null);
	const feedbackOpacity = useSharedValue(0);
	const feedbackStyle = useAnimatedStyle(() => ({ opacity: feedbackOpacity.value }));

	// Undo state with animated countdown
	const [undoLogId, setUndoLogId] = useState<number | null>(null);
	const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const undoProgress = useSharedValue(1);
	const undoBarStyle = useAnimatedStyle(() => ({
		width: `${Math.round(undoProgress.value * 100)}%`,
	}));

	// Animated progress bar + background fill
	const progressAnim = useSharedValue(0);
	useEffect(() => {
		progressAnim.value = withTiming(progress, { duration: 300 });
	}, [progress, progressAnim]);
	const barStyle = useAnimatedStyle(() => ({
		width: `${Math.round(progressAnim.value * 100)}%`,
	}));
	const bgFillStyle = useAnimatedStyle(() => {
		const pctValue = progressAnim.value * 100;
		const clamped = pctValue > 0 ? Math.max(15, pctValue * 1.5) : 0;
		return { height: `${Math.round(clamped)}%` };
	});

	function showFeedback(text: string) {
		setFeedbackText(text);
		feedbackOpacity.value = 1;
		feedbackOpacity.value = withDelay(600, withTiming(0, { duration: 800 }));
	}

	function startUndoTimer(mealId: number) {
		if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
		setUndoLogId(mealId);
		undoProgress.value = 1;
		undoProgress.value = withTiming(0, { duration: 5000 });
		undoTimerRef.current = setTimeout(() => setUndoLogId(null), 5000);
	}

	async function handleConfirm(meal: (typeof meals)[0]) {
		if (!diet) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		await confirmMeal(today, diet.id, meal.id, meal.name, meal.order);
		showFeedback(t("nutrition.widget.mealConfirmed"));
		startUndoTimer(meal.id);
	}

	async function handleSkip(meal: (typeof meals)[0]) {
		if (!diet) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		await skipMeal(today, diet.id, meal.id, meal.name, meal.order);
		showFeedback(t("nutrition.skipped"));
		startUndoTimer(meal.id);
	}

	async function handleCheat(meal: (typeof meals)[0]) {
		if (!diet) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		await cheatMeal(today, diet.id, meal.id, meal.name, meal.order);
		showFeedback(t("nutrition.cheat"));
		startUndoTimer(meal.id);
	}

	// Actions for unlogged meals (tap = confirm, long press = options)
	function showMealActions(meal: (typeof meals)[0]) {
		Alert.alert(t("nutrition.widget.mealActions"), meal.name, [
			{ text: t("nutrition.widget.confirmAction"), onPress: () => handleConfirm(meal) },
			{ text: t("nutrition.widget.skipAction"), onPress: () => handleSkip(meal) },
			{
				text: `${t("nutrition.widget.cheatAction")} (${t("nutrition.widget.cheatHint")})`,
				onPress: () => handleCheat(meal),
			},
			{ text: t("common.cancel"), style: "cancel" },
		]);
	}

	// Actions for already logged meals (tap = modify/cancel)
	function showLoggedMealActions(meal: (typeof meals)[0], logId: number, currentStatus: string) {
		const options: { text: string; onPress?: () => void; style?: "cancel" | "destructive" }[] = [];
		if (currentStatus !== "confirmed") {
			options.push({
				text: t("nutrition.widget.confirmAction"),
				onPress: async () => {
					await undoMealLog(logId);
					handleConfirm(meal);
				},
			});
		}
		if (currentStatus !== "skipped") {
			options.push({
				text: t("nutrition.widget.skipAction"),
				onPress: async () => {
					await undoMealLog(logId);
					handleSkip(meal);
				},
			});
		}
		if (currentStatus !== "cheat") {
			options.push({
				text: t("nutrition.widget.cheatAction"),
				onPress: async () => {
					await undoMealLog(logId);
					handleCheat(meal);
				},
			});
		}
		options.push({
			text: t("nutrition.widget.cancelLog"),
			style: "destructive",
			onPress: () => {
				undoMealLog(logId);
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
			},
		});
		options.push({ text: t("common.cancel"), style: "cancel" });
		Alert.alert(t("nutrition.widget.mealActions"), meal.name, options);
	}

	// No active diet
	if (!diet) {
		return (
			<View
				style={{
					backgroundColor: palette.card.DEFAULT,
					borderRadius: radius.lg,
					padding: 16,
					gap: 8,
				}}
			>
				<View className="flex-row items-center gap-3">
					<View style={{ backgroundColor: `${themeColor}20`, borderRadius: radius.md, padding: 8 }}>
						<Ionicons name="restaurant" size={20} color={themeColor} />
					</View>
					<View>
						<Text className="text-base font-bold text-foreground">
							{t("nutrition.widget.title")}
						</Text>
						<Text className="text-xs" style={{ color: palette.muted.foreground }}>
							{t("nutrition.widget.noActiveDiet")}
						</Text>
					</View>
				</View>
			</View>
		);
	}

	// No meals configured
	if (meals.length === 0) {
		return (
			<View
				style={{
					backgroundColor: palette.card.DEFAULT,
					borderRadius: radius.lg,
					padding: 16,
					gap: 8,
				}}
			>
				<View className="flex-row items-center gap-3">
					<View style={{ backgroundColor: `${themeColor}20`, borderRadius: radius.md, padding: 8 }}>
						<Ionicons name="restaurant" size={20} color={themeColor} />
					</View>
					<View>
						<Text className="text-base font-bold text-foreground">{diet.name}</Text>
						<Text className="text-xs" style={{ color: palette.muted.foreground }}>
							{t("nutrition.emptyMeals")}
						</Text>
					</View>
				</View>
			</View>
		);
	}

	const doneCount = todayLogs.length;
	const calStr = diet.calorieGoal
		? `${Math.round(totalLogged.calories)} / ${diet.calorieGoal} ${t("nutrition.kcal")}`
		: `${Math.round(totalLogged.calories)} ${t("nutrition.kcal")}`;

	return (
		<View
			style={{
				backgroundColor: palette.card.DEFAULT,
				borderRadius: radius.lg,
				overflow: "hidden",
			}}
		>
			{/* Animated background fill */}
			<Animated.View style={[{ position: "absolute", bottom: 0, left: 0, right: 0 }, bgFillStyle]}>
				<LinearGradient colors={["transparent", themeMuted]} style={{ flex: 1 }} />
			</Animated.View>

			<View style={{ padding: 16, gap: 12 }}>
				{/* Header */}
				<View className="flex-row items-center justify-between">
					<View className="flex-row items-center gap-3">
						<View
							style={{
								backgroundColor: `${themeColor}20`,
								borderRadius: radius.md,
								padding: 8,
							}}
						>
							<Ionicons name="restaurant" size={20} color={themeColor} />
						</View>
						<View>
							<View className="flex-row items-center gap-1.5">
								<Text className="text-base font-bold text-foreground">{diet.name}</Text>
								{isComplete && <Ionicons name="checkmark-circle" size={16} color={themeColor} />}
							</View>
							<Text className="text-xs" style={{ color: palette.muted.foreground }}>
								{t("nutrition.widget.mealsProgress", {
									done: doneCount,
									total: meals.length,
								})}{" "}
								— {calStr}
							</Text>
						</View>
					</View>
					{undoLogId != null && (
						<Pressable
							onPress={() => {
								const log = todayLogs.find((l) => l.dietMealId === undoLogId);
								if (log) undoMealLog(log.id);
								if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
								setUndoLogId(null);
								Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
							}}
							className="active:opacity-70"
							style={{
								backgroundColor: `${themeColor}15`,
								borderRadius: radius.sm,
								paddingHorizontal: 10,
								paddingVertical: 8,
								borderWidth: 1,
								borderColor: `${themeColor}30`,
								overflow: "hidden",
							}}
						>
							{/* Countdown bar */}
							<Animated.View
								style={[
									{
										position: "absolute",
										bottom: 0,
										left: 0,
										height: 2,
										backgroundColor: `${themeColor}50`,
									},
									undoBarStyle,
								]}
							/>
							<Ionicons name="arrow-undo" size={16} color={themeColor} />
						</Pressable>
					)}
				</View>

				{/* Progress bar */}
				<View style={{ position: "relative" }}>
					{feedbackText != null && (
						<Animated.View
							style={[{ position: "absolute", top: -20, alignSelf: "center" }, feedbackStyle]}
						>
							<Text className="text-xs font-bold" style={{ color: themeColor }}>
								{feedbackText}
							</Text>
						</Animated.View>
					)}
					<View
						className="overflow-hidden rounded-full"
						style={{ height: 6, backgroundColor: `${themeColor}30` }}
					>
						<Animated.View
							className="rounded-full"
							style={[{ height: 6, backgroundColor: themeColor }, barStyle]}
						/>
					</View>
				</View>

				{/* Macro summary */}
				{totalLogged.calories > 0 && (
					<View className="flex-row gap-3">
						<Text className="text-xs font-medium" style={{ color: palette.blue.DEFAULT }}>
							P: {Math.round(totalLogged.protein)}g
						</Text>
						<Text className="text-xs font-medium" style={{ color: palette.orange.DEFAULT }}>
							G: {Math.round(totalLogged.carbs)}g
						</Text>
						<Text className="text-xs font-medium" style={{ color: themeColor }}>
							L: {Math.round(totalLogged.fat)}g
						</Text>
					</View>
				)}

				{/* Meal list */}
				<View className="gap-1.5">
					{meals.map((meal) => {
						const log = todayLogs.find((l) => l.dietMealId === meal.id);
						const isNext = nextMeal?.id === meal.id;

						if (log) {
							// Already logged — tap to modify
							return (
								<Pressable
									key={meal.id}
									onPress={() => showLoggedMealActions(meal, log.id, log.status)}
									className="active:opacity-70"
								>
									<View className="flex-row items-center gap-2 py-1.5">
										<Ionicons
											name={
												log.status === "confirmed"
													? "checkmark-circle"
													: log.status === "skipped"
														? "close-circle"
														: "flame"
											}
											size={16}
											color={
												log.status === "cheat" ? palette.orange.DEFAULT : palette.muted.foreground
											}
										/>
										<Text
											className="flex-1 text-sm"
											style={{
												color: palette.muted.foreground,
												textDecorationLine: log.status === "skipped" ? "line-through" : "none",
											}}
										>
											{meal.name}
										</Text>
										{meal.targetTime && (
											<Text className="text-xs" style={{ color: palette.muted.foreground }}>
												{meal.targetTime}
											</Text>
										)}
									</View>
								</Pressable>
							);
						}

						if (isNext) {
							// Next meal — prominent, with hint
							return (
								<Pressable
									key={meal.id}
									onPress={() => handleConfirm(meal)}
									onLongPress={() => showMealActions(meal)}
									className="active:opacity-70"
								>
									<View
										className="flex-row items-center gap-2 rounded-xl px-3 py-2.5"
										style={{
											backgroundColor: `${themeColor}15`,
											borderWidth: 1,
											borderColor: `${themeColor}30`,
										}}
									>
										<Ionicons name="arrow-forward-circle" size={18} color={themeColor} />
										<View className="flex-1">
											<Text className="text-sm font-semibold" style={{ color: themeColor }}>
												{meal.name}
											</Text>
											<Text className="text-xs" style={{ color: `${themeColor}90` }}>
												{t("nutrition.widget.longPressHint")}
											</Text>
										</View>
										{meal.targetTime && (
											<Text className="text-xs font-medium" style={{ color: themeColor }}>
												{meal.targetTime}
											</Text>
										)}
										<Ionicons name="ellipsis-horizontal" size={16} color={themeColor} />
									</View>
								</Pressable>
							);
						}

						// Future meal — also interactive
						return (
							<Pressable
								key={meal.id}
								onPress={() => showMealActions(meal)}
								className="active:opacity-70"
							>
								<View className="flex-row items-center gap-2 py-1.5">
									<Ionicons name="ellipse-outline" size={16} color={palette.muted.foreground} />
									<Text className="flex-1 text-sm text-muted-foreground">{meal.name}</Text>
									{meal.targetTime && (
										<Text className="text-xs" style={{ color: palette.muted.foreground }}>
											{meal.targetTime}
										</Text>
									)}
								</View>
							</Pressable>
						);
					})}
				</View>
			</View>
		</View>
	);
}
