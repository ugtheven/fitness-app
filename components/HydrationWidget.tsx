import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Pressable, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { computeHydrationGoal, formatLiters, todayStr } from "../lib/hydration";
import { addWater, getTodayHydrationQuery, removeWater } from "../lib/hydrationQueries";
import { palette } from "../lib/palette";
import { getLatestWeightQuery } from "../lib/profileQueries";
import { radius } from "../lib/tokens";
import { XP_REWARDS } from "../lib/xp";
import { useAchievementToast } from "./AchievementToast";

const AMOUNTS = [150, 250, 500];

export function HydrationWidget() {
	const { t } = useTranslation();
	const { showLevelUpToast } = useAchievementToast();
	const [today, setToday] = useState(todayStr);

	const { data: todayLogs = [] } = useLiveQuery(getTodayHydrationQuery(today));
	const { data: latestWeights = [] } = useLiveQuery(getLatestWeightQuery());

	// Refresh date when app comes back to foreground
	useEffect(() => {
		const sub = AppState.addEventListener("change", (state) => {
			if (state === "active") setToday(todayStr());
		});
		return () => sub.remove();
	}, []);

	const goalMl = useMemo(
		() => computeHydrationGoal(latestWeights[0]?.weightKg ?? null),
		[latestWeights]
	);
	const volumeMl = todayLogs[0]?.volumeMl ?? 0;
	const progress = Math.min(1, volumeMl / goalMl);
	const isComplete = progress >= 1;
	const pct = Math.round(progress * 100);

	// Micro-feedback on add
	const [feedbackAmount, setFeedbackAmount] = useState<number | null>(null);
	const feedbackOpacity = useSharedValue(0);
	const feedbackStyle = useAnimatedStyle(() => ({ opacity: feedbackOpacity.value }));

	// Undo state
	const [undoAmount, setUndoAmount] = useState<number | null>(null);
	const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Theme color: blue in progress, green when complete
	const themeColor = palette.blue.DEFAULT;
	const themeMuted = palette.blue.muted;

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
		// Minimum 15% so the effect is visible at low progress
		// Scale to 150% max so the gradient color covers the full card at 100% progress
		const clamped = pctValue > 0 ? Math.max(15, pctValue * 1.5) : 0;
		return { height: `${Math.round(clamped)}%` };
	});

	async function handleAdd(amount: number) {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		const xpResult = await addWater(today, amount, goalMl);
		if (xpResult?.leveledUp) showLevelUpToast(xpResult.newLevel);

		// Micro-feedback
		setFeedbackAmount(amount);
		feedbackOpacity.value = 1;
		feedbackOpacity.value = withDelay(600, withTiming(0, { duration: 800 }));

		// Undo
		if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
		setUndoAmount(amount);
		undoTimerRef.current = setTimeout(() => setUndoAmount(null), 5000);
	}

	function handleUndo() {
		if (undoAmount == null) return;
		removeWater(today, undoAmount);
		if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
		setUndoAmount(null);
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
	}

	return (
		<View
			style={{
				backgroundColor: palette.card.DEFAULT,
				borderRadius: radius.lg,
				overflow: "hidden",
			}}
		>
			{/* Animated background fill with gradient fade at top */}
			<Animated.View
				style={[
					{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
					},
					bgFillStyle,
				]}
			>
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
							<Ionicons name="water" size={20} color={themeColor} />
						</View>
						<View>
							<View className="flex-row items-center gap-1.5">
								<Text className="text-base font-bold text-foreground">{t("hydration.title")}</Text>
								{isComplete && <Ionicons name="checkmark-circle" size={16} color={themeColor} />}
							</View>
							<Text className="text-xs" style={{ color: palette.muted.foreground }}>
								{pct}% — {formatLiters(volumeMl)} / {formatLiters(goalMl)} L
							</Text>
						</View>
					</View>
					<View className="flex-row items-center gap-2">
						{undoAmount != null && (
							<Pressable
								onPress={handleUndo}
								className="active:opacity-70"
								style={{
									backgroundColor: `${themeColor}15`,
									borderRadius: radius.sm,
									padding: 8,
									borderWidth: 1,
									borderColor: `${themeColor}30`,
								}}
							>
								<Ionicons name="arrow-undo" size={16} color={themeColor} />
							</Pressable>
						)}
						{isComplete && (
							<View
								style={{
									backgroundColor: `${themeColor}20`,
									borderRadius: radius.sm,
									paddingHorizontal: 8,
									paddingVertical: 4,
									borderWidth: 1,
									borderColor: `${themeColor}40`,
								}}
							>
								<Text className="text-xs font-bold" style={{ color: themeColor }}>
									+{XP_REWARDS.hydration} XP
								</Text>
							</View>
						)}
					</View>
				</View>

				{/* Progress bar */}
				<View style={{ position: "relative" }}>
					{feedbackAmount != null && (
						<Animated.View
							style={[
								{
									position: "absolute",
									top: -20,
									alignSelf: "center",
								},
								feedbackStyle,
							]}
						>
							<Text className="text-xs font-bold" style={{ color: themeColor }}>
								+{feedbackAmount}ml
							</Text>
						</Animated.View>
					)}
					<View
						className="rounded-full overflow-hidden"
						style={{ height: 6, backgroundColor: `${themeColor}30` }}
					>
						<Animated.View
							className="rounded-full"
							style={[{ height: 6, backgroundColor: themeColor }, barStyle]}
						/>
					</View>
				</View>

				{/* Quick add buttons */}
				<View className="flex-row gap-2">
					{AMOUNTS.map((ml) => (
						<Pressable
							key={ml}
							onPress={() => handleAdd(ml)}
							className="flex-1 items-center py-2.5 active:opacity-70"
							style={{
								backgroundColor: `${themeColor}15`,
								borderRadius: radius.md,
								borderWidth: 1,
								borderColor: `${themeColor}30`,
							}}
						>
							<Text className="text-xs font-semibold" style={{ color: themeColor }}>
								+{ml}ml
							</Text>
						</Pressable>
					))}
				</View>

			</View>
		</View>
	);
}
