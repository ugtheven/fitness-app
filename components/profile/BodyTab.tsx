import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "../Button";
import { palette } from "../../lib/palette";
import {
	getLatestMeasurementsQuery,
	getTwoLatestWeightsQuery,
	getUserProfileQuery,
	getWeightLogsQuery,
} from "../../lib/profileQueries";
import { EditHeightDrawer } from "./EditHeightDrawer";
import { useUnits } from "../../lib/units";
import { LogMeasurementsDrawer } from "./LogMeasurementsDrawer";
import { LogWeightDrawer } from "./LogWeightDrawer";
import { WeightChart } from "./WeightChart";

type MeasurementKey = "bodyFat" | "shoulders" | "chest" | "waist" | "hips" | "neck" | "arms" | "thigh" | "calf";

const MEASUREMENT_KEYS: MeasurementKey[] = ["bodyFat", "shoulders", "chest", "waist", "hips", "neck", "arms", "thigh", "calf"];
const MEASUREMENT_COLORS: Record<MeasurementKey, string> = {
	bodyFat: "#4CAF50",
	shoulders: "#2196F3", chest: "#2196F3", waist: "#2196F3", hips: "#2196F3",
	neck: "#2196F3", arms: "#2196F3", thigh: "#2196F3", calf: "#2196F3",
};

export function BodyTab() {
	const { t } = useTranslation();
	const { displayWeight, weightUnit, displayLength, displayHeight, lengthUnit, heightUnit } = useUnits();

	const { data: twoWeights = [] } = useLiveQuery(getTwoLatestWeightsQuery());
	const { data: weightLogs = [] } = useLiveQuery(getWeightLogsQuery());
	const { data: profileRows = [] } = useLiveQuery(getUserProfileQuery());
	const { data: measurementRows = [] } = useLiveQuery(getLatestMeasurementsQuery());

	const [showWeightDrawer, setShowWeightDrawer] = useState(false);
	const [showMeasurementsDrawer, setShowMeasurementsDrawer] = useState(false);
	const [showHeightDrawer, setShowHeightDrawer] = useState(false);

	const latestWeight = twoWeights[0]?.weightKg ?? null;
	const previousWeight = twoWeights[1]?.weightKg ?? null;
	const weightDelta = latestWeight != null && previousWeight != null ? latestWeight - previousWeight : null;
	const heightCm = profileRows[0]?.heightCm ?? null;
	const latestMeasurements = measurementRows[0] ?? null;

	return (
		<>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingTop: 16, paddingBottom: 100, gap: 16 }}
			>
				{/* Weight + Height cards */}
				<View className="flex-row gap-3">
					<View className="flex-1 rounded-2xl px-4 py-3" style={{ backgroundColor: palette.card.DEFAULT }}>
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
									color={palette.primary.DEFAULT}
								/>
								<Text className="text-xs font-semibold" style={{ color: palette.primary.DEFAULT }}>
									{weightDelta >= 0 ? "+" : ""}{displayWeight(Math.abs(weightDelta))} {weightUnit}
								</Text>
							</View>
						)}
					</View>

					<Pressable className="flex-1 active:opacity-70" onPress={() => setShowHeightDrawer(true)}>
						<View className="rounded-2xl px-4 py-3" style={{ backgroundColor: palette.card.DEFAULT }}>
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
					label={t("profile.logWeight")}
					onPress={() => setShowWeightDrawer(true)}
					fullWidth
					startIcon={<Ionicons name="add" size={20} color={palette.primary.foreground} />}
				/>

				{/* Measurements section */}
				<View className="flex-row items-center gap-2 mt-2">
					<Ionicons name="body-outline" size={20} color={palette.foreground} />
					<Text className="text-lg font-bold text-foreground">{t("profile.measurements")}</Text>
				</View>

				<View className="flex-row flex-wrap" style={{ gap: 10 }}>
					{MEASUREMENT_KEYS.map((key) => {
						const rawValue = latestMeasurements?.[key] ?? null;
						const unit = key === "bodyFat" ? "%" : lengthUnit;
						const value = rawValue != null
							? (key === "bodyFat" ? rawValue : displayLength(rawValue))
							: null;
						return (
							<View
								key={key}
								className="rounded-2xl px-3 py-3 items-center"
								style={{
									backgroundColor: palette.card.DEFAULT,
									width: "31%",
									flexGrow: 1,
								}}
							>
								<Text className="text-xs font-medium mb-1" style={{ color: palette.muted.foreground }}>
									{t(`profile.${key}`)}
								</Text>
								<Text className="text-xl font-bold text-foreground">
									{value != null ? value : "—"}
								</Text>
								<View className="flex-row items-center gap-1 mt-0.5">
									<Text className="text-xs" style={{ color: palette.muted.foreground }}>
										{unit}
									</Text>
									<View
										style={{
											width: 5,
											height: 5,
											borderRadius: 2.5,
											backgroundColor: MEASUREMENT_COLORS[key],
										}}
									/>
								</View>
							</View>
						);
					})}
				</View>

				{/* Log Measurements button */}
				<Button
					label={t("profile.logMeasurements")}
					onPress={() => setShowMeasurementsDrawer(true)}
					fullWidth
					startIcon={<Ionicons name="add" size={20} color={palette.primary.foreground} />}
				/>
			</ScrollView>

			{/* Drawers */}
			<LogWeightDrawer
				visible={showWeightDrawer}
				onClose={() => setShowWeightDrawer(false)}
				lastWeight={latestWeight}
			/>
			<LogMeasurementsDrawer
				visible={showMeasurementsDrawer}
				onClose={() => setShowMeasurementsDrawer(false)}
				lastValues={latestMeasurements ?? {}}
			/>
			<EditHeightDrawer
				visible={showHeightDrawer}
				onClose={() => setShowHeightDrawer(false)}
				currentHeight={heightCm ?? 170}
			/>
		</>
	);
}
