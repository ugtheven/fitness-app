import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { palette } from "../../lib/palette";
import {
	getActiveGoalsQuery,
	getLatestMeasurementsQuery,
	getLatestWeightQuery,
	updateGoalStatus,
} from "../../lib/profileQueries";
import { borders, radius } from "../../lib/tokens";
import { useUnits } from "../../lib/units";
import { Button } from "../Button";
import { CreateGoalDrawer } from "./CreateGoalDrawer";

type GoalType =
	| "weight"
	| "bodyFat"
	| "shoulders"
	| "chest"
	| "waist"
	| "hips"
	| "neck"
	| "arms"
	| "thigh"
	| "calf";

function todayStr(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysUntil(deadline: string): number {
	const now = new Date(todayStr());
	const target = new Date(deadline);
	return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function getUnit(type: GoalType, weightUnit: string, lengthUnit: string): string {
	return type === "bodyFat" ? "%" : type === "weight" ? weightUnit : lengthUnit;
}

function computeProgress(startValue: number, currentValue: number, targetValue: number): number {
	const totalDelta = targetValue - startValue;
	if (totalDelta === 0) return currentValue === targetValue ? 1 : 0;
	const currentDelta = currentValue - startValue;
	return Math.min(1, Math.max(0, currentDelta / totalDelta));
}

function isGoalReached(currentValue: number, targetValue: number, startValue: number): boolean {
	// Goal is "going up" if target > start, "going down" if target < start
	if (targetValue > startValue) return currentValue >= targetValue;
	if (targetValue < startValue) return currentValue <= targetValue;
	return currentValue === targetValue;
}

export function GoalsTab() {
	const { t } = useTranslation();
	const { displayWeight, displayLength, weightUnit, lengthUnit } = useUnits();
	const [showDrawer, setShowDrawer] = useState(false);

	const { data: activeGoals = [] } = useLiveQuery(getActiveGoalsQuery());
	const { data: latestWeights = [] } = useLiveQuery(getLatestWeightQuery());
	const { data: latestMeasurements = [] } = useLiveQuery(getLatestMeasurementsQuery());

	const getCurrentValue = useMemo(() => {
		return (type: GoalType): number | null => {
			if (type === "weight") return latestWeights[0]?.weightKg ?? null;
			const m = latestMeasurements[0];
			if (!m) return null;
			return m[type as keyof typeof m] as number | null;
		};
	}, [latestWeights, latestMeasurements]);

	if (activeGoals.length === 0 && !showDrawer) {
		return (
			<>
				<View className="flex-1 items-center justify-center gap-3">
					<Ionicons name="flag-outline" size={40} color={palette.muted.foreground} />
					<Text className="text-base" style={{ color: palette.muted.foreground }}>
						{t("profile.noGoals")}
					</Text>
					<Text className="text-sm text-center" style={{ color: palette.muted.foreground }}>
						{t("profile.noGoalsHint")}
					</Text>
					<View className="mt-4">
						<Button
							variant="glow"
							label={t("profile.newGoal")}
							onPress={() => setShowDrawer(true)}
							startIcon={<Ionicons name="add" size={20} />}
						/>
					</View>
				</View>
				<CreateGoalDrawer visible={showDrawer} onClose={() => setShowDrawer(false)} />
			</>
		);
	}

	return (
		<>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingTop: 16, paddingBottom: 100, gap: 12 }}
			>
				{activeGoals.map((goal) => {
					const type = goal.type as GoalType;
					const currentValue = getCurrentValue(type);
					const unit = getUnit(type, weightUnit, lengthUnit);
					const displayValue = (v: number | null) => {
						if (v == null) return null;
						if (type === "bodyFat") return v;
						return type === "weight" ? displayWeight(v) : displayLength(v);
					};
					const days = daysUntil(goal.deadline);
					const progress =
						currentValue != null
							? computeProgress(goal.startValue, currentValue, goal.targetValue)
							: 0;
					const reached =
						currentValue != null && isGoalReached(currentValue, goal.targetValue, goal.startValue);

					return (
						<View
							key={goal.id}
							className="px-5 py-4"
							style={{
								backgroundColor: palette.card.DEFAULT,
								borderRadius: radius.lg,
								borderWidth: reached ? borders.emphasis : 0,
								borderColor: reached ? palette.accent.DEFAULT : "transparent",
							}}
						>
							{/* Header: type + days */}
							<View className="flex-row items-center justify-between mb-2">
								<View className="flex-row items-center gap-2">
									<Ionicons
										name={type === "weight" ? "scale-outline" : "body-outline"}
										size={18}
										color={reached ? palette.accent.DEFAULT : palette.foreground}
									/>
									<Text className="text-base font-semibold text-foreground">
										{t(`profile.${type === "weight" ? "weight" : type}`)}
									</Text>
								</View>
								{reached ? (
									<View
										className="flex-row items-center gap-1 px-2 py-1"
										style={{ backgroundColor: palette.accent.muted, borderRadius: radius.md }}
									>
										<Ionicons name="checkmark-circle" size={14} color={palette.accent.DEFAULT} />
										<Text
											className="text-xs font-semibold"
											style={{ color: palette.accent.DEFAULT }}
										>
											{t("profile.goalReached")}
										</Text>
									</View>
								) : (
									<View className="flex-row items-center gap-1">
										<Ionicons
											name="time-outline"
											size={14}
											color={days < 0 ? palette.destructive.DEFAULT : palette.muted.foreground}
										/>
										<Text
											className="text-xs"
											style={{
												color: days < 0 ? palette.destructive.DEFAULT : palette.muted.foreground,
											}}
										>
											{days < 0
												? t("profile.expired")
												: t("profile.daysRemaining", { count: days })}
										</Text>
									</View>
								)}
							</View>

							{/* Values: current → target */}
							<View className="flex-row items-baseline gap-1 mb-3">
								<Text className="text-2xl font-bold text-foreground">
									{displayValue(currentValue) ?? "—"}
								</Text>
								<Text className="text-sm" style={{ color: palette.muted.foreground }}>
									{unit}
								</Text>
								<Ionicons
									name="arrow-forward"
									size={14}
									color={palette.muted.foreground}
									style={{ marginHorizontal: 4 }}
								/>
								<Text className="text-2xl font-bold" style={{ color: palette.accent.DEFAULT }}>
									{displayValue(goal.targetValue)}
								</Text>
								<Text className="text-sm" style={{ color: palette.muted.foreground }}>
									{unit}
								</Text>
							</View>

							{/* Progress bar */}
							<View
								className="rounded-full overflow-hidden mb-3"
								style={{ height: 6, backgroundColor: palette.muted.DEFAULT }}
							>
								<View
									className="rounded-full"
									style={{
										height: 6,
										width: `${Math.round(progress * 100)}%`,
										backgroundColor: reached ? palette.foreground : palette.accent.DEFAULT,
									}}
								/>
							</View>

							{/* Actions */}
							{reached ? (
								<Pressable
									onPress={() => updateGoalStatus(goal.id, "achieved")}
									className="items-center py-2 active:opacity-70"
									style={{ backgroundColor: palette.accent.muted, borderRadius: radius.md }}
								>
									<Text className="text-sm font-semibold" style={{ color: palette.accent.DEFAULT }}>
										{t("profile.confirmAchieved")}
									</Text>
								</Pressable>
							) : (
								<Pressable
									onPress={() =>
										Alert.alert(t("profile.abandonTitle"), t("profile.abandonMessage"), [
											{ text: t("common.cancel"), style: "cancel" },
											{
												text: t("profile.abandon"),
												style: "destructive",
												onPress: () => updateGoalStatus(goal.id, "abandoned"),
											},
										])
									}
									className="items-center py-2 active:opacity-70"
								>
									<Text className="text-xs" style={{ color: palette.muted.foreground }}>
										{t("profile.abandon")}
									</Text>
								</Pressable>
							)}
						</View>
					);
				})}

				{/* New Goal button */}
				<Button
					variant="glow"
					label={t("profile.newGoal")}
					onPress={() => setShowDrawer(true)}
					fullWidth
					startIcon={<Ionicons name="add" size={20} />}
				/>
			</ScrollView>

			<CreateGoalDrawer visible={showDrawer} onClose={() => setShowDrawer(false)} />
		</>
	);
}
