import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import {
	fetchTodaySteps,
	grantStepsXpIfNeeded,
	isHealthKitEnabled,
	requestHealthKitPermissions,
	setHealthKitEnabled,
	syncHealthKitData,
} from "../lib/healthkit";
import { todayStr } from "../lib/hydration";
import { palette } from "../lib/palette";
import { radius } from "../lib/tokens";
import { XP_REWARDS } from "../lib/xp";
import { useAchievementToast } from "./AchievementToast";

const GOAL_5K = 5000;
const GOAL_10K = 10000;

export function StepsWidget() {
	const { t } = useTranslation();
	const { showLevelUpToast } = useAchievementToast();
	const [steps, setSteps] = useState<number | null>(null);
	const [hkEnabled, setHkEnabled] = useState<boolean | null>(null);

	const loadSteps = useCallback(() => {
		isHealthKitEnabled().then(setHkEnabled);
		fetchTodaySteps().then(async (s) => {
			setSteps(s);
			if (s > 0) {
				const result = await grantStepsXpIfNeeded(s, todayStr());
				if (result?.leveledUp) showLevelUpToast(result.newLevel);
			}
		});
	}, [showLevelUpToast]);

	// Fetch on mount
	useEffect(() => {
		loadSteps();
	}, [loadSteps]);

	// Refresh when app comes back to foreground
	useEffect(() => {
		const sub = AppState.addEventListener("change", (state) => {
			if (state === "active") loadSteps();
		});
		return () => sub.remove();
	}, [loadSteps]);

	// Animated progress bar
	const progress = steps != null ? Math.min(1, steps / GOAL_10K) : 0;
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

	async function handleEnableHealthKit() {
		await requestHealthKitPermissions();
		await setHealthKitEnabled(true);
		setHkEnabled(true);
		syncHealthKitData();
		loadSteps();
	}

	// Theme: orange in progress, green at 10K
	const reached5k = steps != null && steps >= GOAL_5K;
	const reached10k = steps != null && steps >= GOAL_10K;
	const themeColor = reached10k ? palette.green.DEFAULT : palette.orange.DEFAULT;
	const themeMuted = reached10k ? palette.green.muted : palette.orange.muted;

	// HealthKit not enabled — show prompt with activate button
	if (hkEnabled === false) {
		return (
			<View
				style={{
					backgroundColor: palette.orange.muted,
					borderRadius: radius.lg,
					padding: 16,
					gap: 12,
				}}
			>
				<View className="flex-row items-center gap-3">
					<View
						style={{
							backgroundColor: `${palette.orange.DEFAULT}20`,
							borderRadius: radius.md,
							padding: 8,
						}}
					>
						<Ionicons name="footsteps" size={20} color={palette.orange.DEFAULT} />
					</View>
					<Text className="text-base font-bold text-foreground">{t("home.steps")}</Text>
				</View>
				<Pressable
					onPress={handleEnableHealthKit}
					className="flex-row items-center gap-2 py-2.5 justify-center active:opacity-70"
					style={{
						backgroundColor: `${palette.orange.DEFAULT}15`,
						borderRadius: radius.md,
						borderWidth: 1,
						borderColor: `${palette.orange.DEFAULT}30`,
					}}
				>
					<Ionicons name="heart-outline" size={16} color={palette.orange.DEFAULT} />
					<Text className="text-xs font-semibold" style={{ color: palette.orange.DEFAULT }}>
						{t("steps.enableHealthKit")}
					</Text>
				</Pressable>
			</View>
		);
	}

	// Still loading
	if (steps == null) return null;

	const formatted = steps.toLocaleString();
	const pct = Math.round(progress * 100);

	// XP badge: show total earned XP for steps milestones reached
	const xpEarned = (reached5k ? XP_REWARDS.steps5k : 0) + (reached10k ? XP_REWARDS.steps10k : 0);

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
							<Ionicons name="footsteps" size={20} color={themeColor} />
						</View>
						<View>
							<View className="flex-row items-center gap-1.5">
								<Text className="text-base font-bold text-foreground">{t("home.steps")}</Text>
								{reached10k && <Ionicons name="checkmark-circle" size={16} color={themeColor} />}
							</View>
							<Text className="text-xs" style={{ color: palette.muted.foreground }}>
								{pct}% — {formatted} / {GOAL_10K.toLocaleString()}
							</Text>
						</View>
					</View>
					{xpEarned > 0 && (
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
								+{xpEarned} XP
							</Text>
						</View>
					)}
				</View>

				{/* Progress bar with midpoint marker */}
				<View>
					<View
						className="rounded-full overflow-hidden"
						style={{ height: 6, backgroundColor: `${themeColor}30` }}
					>
						<Animated.View
							className="rounded-full"
							style={[{ height: 6, backgroundColor: themeColor }, barStyle]}
						/>
					</View>

					{/* Midpoint marker at 50% (5K) */}
					<View
						style={{
							position: "absolute",
							left: "50%",
							top: 0,
							width: 2,
							height: 6,
							backgroundColor: `${themeColor}50`,
							marginLeft: -1,
						}}
					/>
				</View>

				{/* Milestone labels */}
				<View className="flex-row justify-between" style={{ paddingHorizontal: 4 }}>
					<View
						className="flex-row items-center gap-1"
						style={{ position: "absolute", left: "50%", transform: [{ translateX: -20 }] }}
					>
						{reached5k && <Ionicons name="checkmark" size={12} color={themeColor} />}
						<Text
							className="text-xs"
							style={{ color: reached5k ? themeColor : palette.muted.foreground }}
						>
							{t("home.stepsGoal5k")}
						</Text>
					</View>
					<View style={{ flex: 1 }} />
					<View className="flex-row items-center gap-1">
						{reached10k && <Ionicons name="checkmark" size={12} color={themeColor} />}
						<Text
							className="text-xs"
							style={{ color: reached10k ? themeColor : palette.muted.foreground }}
						>
							{t("home.stepsGoal10k")}
						</Text>
					</View>
				</View>
			</View>
		</View>
	);
}
