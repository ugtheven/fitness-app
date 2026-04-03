import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "../Button";
import { palette } from "../../lib/palette";
import { radius } from "../../lib/tokens";
import {
	getMeasurementHistoryQuery,
	getTwoLatestWeightsQuery,
	getUserProfileQuery,
	getWeightLogsQuery,
} from "../../lib/profileQueries";
import { EditHeightDrawer } from "./EditHeightDrawer";
import { useUnits } from "../../lib/units";
import { LogWeightDrawer } from "./LogWeightDrawer";
import { MeasurementDetailDrawer } from "./MeasurementDetailDrawer";
import { WeightChart } from "./WeightChart";

type MeasurementKey = "bodyFat" | "shoulders" | "chest" | "waist" | "hips" | "neck" | "arms" | "thigh" | "calf";

const MEASUREMENT_KEYS: MeasurementKey[] = ["bodyFat", "shoulders", "chest", "waist", "hips", "neck", "arms", "thigh", "calf"];
const MEASUREMENT_COLORS: Record<MeasurementKey, string> = {
	bodyFat: palette.accent.DEFAULT,
	shoulders: palette.secondary.DEFAULT, chest: palette.secondary.DEFAULT, waist: palette.secondary.DEFAULT, hips: palette.secondary.DEFAULT,
	neck: palette.secondary.DEFAULT, arms: palette.secondary.DEFAULT, thigh: palette.secondary.DEFAULT, calf: palette.secondary.DEFAULT,
};

export function BodyTab() {
	const { t } = useTranslation();
	const { displayWeight, weightUnit, displayLength, displayHeight, lengthUnit, heightUnit } = useUnits();

	const { data: twoWeights = [] } = useLiveQuery(getTwoLatestWeightsQuery());
	const { data: weightLogs = [] } = useLiveQuery(getWeightLogsQuery());
	const { data: profileRows = [] } = useLiveQuery(getUserProfileQuery());
	const { data: allMeasurementRows = [] } = useLiveQuery(getMeasurementHistoryQuery());

	const [showWeightDrawer, setShowWeightDrawer] = useState(false);
	const [showHeightDrawer, setShowHeightDrawer] = useState(false);
	const [selectedMeasurement, setSelectedMeasurement] = useState<MeasurementKey | null>(null);

	const latestWeight = twoWeights[0]?.weightKg ?? null;
	const previousWeight = twoWeights[1]?.weightKg ?? null;
	const weightDelta = latestWeight != null && previousWeight != null ? latestWeight - previousWeight : null;
	const heightCm = profileRows[0]?.heightCm ?? null;

	// For each measurement key, find the latest and previous non-null values (rows sorted ASC by date)
	const { latestPerKey, deltaPerKey } = useMemo(() => {
		const latest: Partial<Record<MeasurementKey, number>> = {};
		const previous: Partial<Record<MeasurementKey, number>> = {};
		for (const row of allMeasurementRows) {
			for (const key of MEASUREMENT_KEYS) {
				const v = row[key];
				if (v != null) {
					previous[key] = latest[key];
					latest[key] = v;
				}
			}
		}
		const delta: Partial<Record<MeasurementKey, number>> = {};
		for (const key of MEASUREMENT_KEYS) {
			const l = latest[key];
			const p = previous[key];
			if (l != null && p != null) {
				delta[key] = Math.round((l - p) * 10) / 10;
			}
		}
		return { latestPerKey: latest, deltaPerKey: delta };
	}, [allMeasurementRows]);

	return (
		<>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingTop: 16, paddingBottom: 100, gap: 16 }}
			>
				{/* Weight + Height cards */}
				<View className="flex-row gap-3" style={{ alignItems: "stretch" }}>
					<View className="flex-1 px-4 py-3" style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}>
						<Text className="text-xs font-medium mb-1" style={{ color: palette.muted.foreground }}>
							{t("profile.weight")}
						</Text>
						<View className="flex-row items-baseline">
							<Text className="text-2xl font-bold text-foreground">
								{latestWeight != null ? displayWeight(latestWeight) : "—"}
							</Text>
							{latestWeight != null && (
								<Text className="text-sm ml-1" style={{ color: palette.muted.foreground }}>{weightUnit}</Text>
							)}
						</View>
						{weightDelta != null && (
							<View className="flex-row items-center mt-1 gap-1">
								<Ionicons
									name={weightDelta >= 0 ? "trending-up" : "trending-down"}
									size={14}
									color={palette.accent.DEFAULT}
								/>
								<Text className="text-xs font-semibold" style={{ color: palette.accent.DEFAULT }}>
									{weightDelta >= 0 ? "+" : ""}{displayWeight(Math.abs(weightDelta))} {weightUnit}
								</Text>
							</View>
						)}
					</View>

					<Pressable className="flex-1 active:opacity-70" onPress={() => setShowHeightDrawer(true)}>
						<View className="flex-1 px-4 py-3" style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}>
							<View className="flex-row items-center justify-between mb-1">
								<Text className="text-xs font-medium" style={{ color: palette.muted.foreground }}>
									{t("profile.height")}
								</Text>
								<Ionicons name="pencil" size={12} color={palette.muted.foreground} />
							</View>
							<View className="flex-row items-baseline">
								<Text className="text-2xl font-bold text-foreground">
									{heightCm != null ? displayHeight(heightCm) : "—"}
								</Text>
								{heightCm != null && (
									<Text className="text-sm ml-1" style={{ color: palette.muted.foreground }}>{heightUnit}</Text>
								)}
							</View>
						</View>
					</Pressable>
				</View>

				{/* Weight Chart */}
				<WeightChart data={weightLogs.map((w) => ({ date: w.date, weightKg: w.weightKg }))} />

				{/* Log Weight button */}
				<Button
					variant="glow"
					label={t("profile.logWeight")}
					onPress={() => setShowWeightDrawer(true)}
					fullWidth
					startIcon={<Ionicons name="add" size={20} />}
				/>

				{/* Measurements section */}
				<View className="flex-row items-center gap-2 mt-2">
					<Ionicons name="body-outline" size={20} color={palette.foreground} />
					<Text className="text-lg font-bold text-foreground">{t("profile.measurements")}</Text>
				</View>

				<View className="flex-row flex-wrap" style={{ gap: 10 }}>
					{MEASUREMENT_KEYS.map((key) => {
						const rawValue = latestPerKey[key] ?? null;
						const unit = key === "bodyFat" ? "%" : lengthUnit;
						const value = rawValue != null
							? (key === "bodyFat" ? rawValue : displayLength(rawValue))
							: null;
						const d = deltaPerKey[key] ?? null;
						const displayDelta = d != null && key !== "bodyFat" ? displayLength(Math.abs(d)) : d != null ? Math.abs(d) : null;
						return (
							<Pressable
								key={key}
								onPress={() => setSelectedMeasurement(key)}
								className="active:opacity-70"
								style={{
									width: "31%",
									flexGrow: 1,
								}}
							>
								<View
									className="px-3 py-4 items-center"
									style={{
										backgroundColor: palette.card.DEFAULT,
										borderRadius: radius.lg,
									}}
								>
									<Text className="text-xs font-medium mb-1" style={{ color: palette.muted.foreground }}>
										{t(`profile.${key}`)}
									</Text>
									<View className="flex-row items-baseline">
										<Text className="text-xl font-bold text-foreground">
											{value != null ? value : "—"}
										</Text>
										{value != null && (
											<Text className="text-xs ml-1" style={{ color: palette.muted.foreground }}>{unit}</Text>
										)}
									</View>
									{d != null && d !== 0 ? (
										<View className="flex-row items-center gap-1 mt-0.5">
											<Ionicons
												name={d >= 0 ? "trending-up" : "trending-down"}
												size={12}
												color={palette.accent.DEFAULT}
											/>
											<Text className="text-xs font-semibold" style={{ color: palette.accent.DEFAULT }}>
												{d >= 0 ? "+" : "−"}{displayDelta} {unit}
											</Text>
										</View>
									) : (
										<View className="flex-row items-center gap-1 mt-0.5">
											<Text className="text-xs" style={{ color: palette.muted.foreground }}>
												{unit}
											</Text>
										</View>
									)}
								</View>
							</Pressable>
						);
					})}
				</View>
			</ScrollView>

			{/* Drawers */}
			<LogWeightDrawer
				visible={showWeightDrawer}
				onClose={() => setShowWeightDrawer(false)}
				lastWeight={latestWeight}
			/>
			<EditHeightDrawer
				visible={showHeightDrawer}
				onClose={() => setShowHeightDrawer(false)}
				currentHeight={heightCm ?? 170}
			/>
			<MeasurementDetailDrawer
				visible={selectedMeasurement != null}
				onClose={() => setSelectedMeasurement(null)}
				measurementKey={selectedMeasurement}
			/>
		</>
	);
}
