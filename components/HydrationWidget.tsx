import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { computeHydrationGoal, formatLiters, todayStr } from "../lib/hydration";
import { addWater, removeWater, getTodayHydrationQuery } from "../lib/hydrationQueries";
import { palette } from "../lib/palette";
import { getLatestWeightQuery } from "../lib/profileQueries";
import { radius } from "../lib/tokens";
import { EditHydrationGoalDrawer } from "./EditHydrationGoalDrawer";

const HYDRATION_GOAL_KEY = "hydration_goal_ml";
const AMOUNTS = [150, 250, 500];

export function HydrationWidget() {
	const { t } = useTranslation();
	const today = todayStr();

	const { data: todayLogs = [] } = useLiveQuery(getTodayHydrationQuery(today));
	const { data: latestWeights = [] } = useLiveQuery(getLatestWeightQuery());

	const [customGoal, setCustomGoal] = useState<number | null>(null);
	const [showGoalDrawer, setShowGoalDrawer] = useState(false);
	const [undoAmount, setUndoAmount] = useState<number | null>(null);
	const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Load custom goal from AsyncStorage
	useEffect(() => {
		AsyncStorage.getItem(HYDRATION_GOAL_KEY).then((val) => {
			if (val != null) setCustomGoal(Number(val));
		});
	}, []);

	const autoGoal = useMemo(
		() => computeHydrationGoal(latestWeights[0]?.weightKg ?? null),
		[latestWeights],
	);
	const goalMl = customGoal ?? autoGoal;
	const volumeMl = todayLogs[0]?.volumeMl ?? 0;
	const progress = Math.min(1, volumeMl / goalMl);
	const isComplete = progress >= 1;

	function handleAdd(amount: number) {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		addWater(today, amount, goalMl);
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

	async function handleSaveGoal(value: number | null) {
		if (value != null) {
			setCustomGoal(value);
			await AsyncStorage.setItem(HYDRATION_GOAL_KEY, String(value));
		} else {
			setCustomGoal(null);
			await AsyncStorage.removeItem(HYDRATION_GOAL_KEY);
		}
		setShowGoalDrawer(false);
	}

	return (
		<>
			<View style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg, padding: 16, gap: 12 }}>
				{/* Header: icon + title + volume/goal */}
				<View className="flex-row items-center justify-between">
					<View className="flex-row items-center gap-2">
						<Ionicons name="water-outline" size={18} color={palette.accent.DEFAULT} />
						<Text className="text-sm font-semibold text-foreground">
							{t("hydration.title")}
						</Text>
					</View>
					<Pressable
						className="flex-row items-center gap-1 active:opacity-70"
						onPress={() => setShowGoalDrawer(true)}
					>
						<Text className="text-sm font-bold text-foreground">
							{formatLiters(volumeMl)}
						</Text>
						<Text className="text-xs" style={{ color: palette.muted.foreground }}>
							/ {formatLiters(goalMl)} L
						</Text>
						{volumeMl > goalMl && (
							<Text className="text-xs font-semibold" style={{ color: palette.accent.DEFAULT }}>
								+{formatLiters(volumeMl - goalMl)}
							</Text>
						)}
						{isComplete ? (
							<Ionicons name="checkmark-circle" size={14} color={palette.accent.DEFAULT} style={{ marginLeft: 4 }} />
						) : (
							<Ionicons name="pencil" size={12} color={palette.muted.foreground} style={{ marginLeft: 4 }} />
						)}
					</Pressable>
				</View>

				{/* Progress bar */}
				<View className="rounded-full overflow-hidden" style={{ height: 8, backgroundColor: palette.muted.DEFAULT }}>
					<View
						className="rounded-full"
						style={{
							height: 8,
							width: `${Math.round(progress * 100)}%`,
							backgroundColor: isComplete ? palette.foreground : palette.accent.DEFAULT,
						}}
					/>
				</View>

				{/* Quick add buttons */}
				<View className="flex-row gap-2">
					{AMOUNTS.map((ml) => (
						<Pressable
							key={ml}
							onPress={() => handleAdd(ml)}
							className="flex-1 items-center py-2.5 active:opacity-70"
							style={{
								backgroundColor: palette.muted.DEFAULT,
								borderRadius: radius.md,
							}}
						>
							<Text className="text-xs font-semibold" style={{ color: palette.foreground }}>
								+{ml}ml
							</Text>
						</Pressable>
					))}
				</View>

				{/* Undo toast */}
				{undoAmount != null && (
					<View
						className="flex-row items-center justify-between px-4 py-2.5"
						style={{ backgroundColor: palette.muted.DEFAULT, borderRadius: radius.md }}
					>
						<Text className="text-xs" style={{ color: palette.muted.foreground }}>
							+{undoAmount}ml
						</Text>
						<Pressable onPress={handleUndo} className="active:opacity-70">
							<Text className="text-xs font-bold" style={{ color: palette.accent.DEFAULT }}>
								{t("workout.undo")}
							</Text>
						</Pressable>
					</View>
				)}
			</View>

			<EditHydrationGoalDrawer
				visible={showGoalDrawer}
				onClose={() => setShowGoalDrawer(false)}
				currentGoal={goalMl}
				autoGoal={autoGoal}
				isCustom={customGoal != null}
				hasWeight={latestWeights[0]?.weightKg != null}
				onSave={handleSaveGoal}
			/>
		</>
	);
}
