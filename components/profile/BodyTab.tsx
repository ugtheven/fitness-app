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
import { LogMeasurementsDrawer } from "./LogMeasurementsDrawer";
import { LogWeightDrawer } from "./LogWeightDrawer";
import { WeightChart } from "./WeightChart";

type MeasurementKey = "bodyFat" | "shoulders" | "chest" | "waist" | "hips" | "neck" | "arms" | "thigh" | "calf";

const MEASUREMENT_FIELDS: { key: MeasurementKey; unit: string; color: string }[] = [
	{ key: "bodyFat", unit: "%", color: "#4CAF50" },
	{ key: "shoulders", unit: "cm", color: "#2196F3" },
	{ key: "chest", unit: "cm", color: "#2196F3" },
	{ key: "waist", unit: "cm", color: "#2196F3" },
	{ key: "hips", unit: "cm", color: "#2196F3" },
	{ key: "neck", unit: "cm", color: "#2196F3" },
	{ key: "arms", unit: "cm", color: "#2196F3" },
	{ key: "thigh", unit: "cm", color: "#2196F3" },
	{ key: "calf", unit: "cm", color: "#2196F3" },
];

export function BodyTab() {
	const { t } = useTranslation();

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
								{latestWeight != null ? latestWeight : "—"}
							</Text>
							{latestWeight != null && (
								<Text className="text-sm ml-1" style={{ color: palette.muted.foreground }}>kg</Text>
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
									{weightDelta >= 0 ? "+" : ""}{Math.round(weightDelta * 10) / 10} kg
								</Text>
							</View>
						)}
					</View>

					<Pressable className="flex-1 active:opacity-70" onPress={() => setShowHeightDrawer(true)}>
						<View className="rounded-2xl px-4 py-3" style={{ backgroundColor: palette.card.DEFAULT }}>
							<Text className="text-xs font-medium mb-1" style={{ color: palette.muted.foreground }}>
								{t("profile.height")}
							</Text>
							<View className="flex-row items-baseline">
								<Text className="text-2xl font-bold text-foreground">
									{heightCm != null ? heightCm : "—"}
								</Text>
								{heightCm != null && (
									<Text className="text-sm ml-1" style={{ color: palette.muted.foreground }}>cm</Text>
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
					{MEASUREMENT_FIELDS.map((field) => {
						const value = latestMeasurements?.[field.key] ?? null;
						return (
							<View
								key={field.key}
								className="rounded-2xl px-3 py-3 items-center"
								style={{
									backgroundColor: palette.card.DEFAULT,
									width: "31%",
									flexGrow: 1,
								}}
							>
								<Text className="text-xs font-medium mb-1" style={{ color: palette.muted.foreground }}>
									{t(`profile.${field.key}`)}
								</Text>
								<Text className="text-xl font-bold text-foreground">
									{value != null ? value : "—"}
								</Text>
								<View className="flex-row items-center gap-1 mt-0.5">
									<Text className="text-xs" style={{ color: palette.muted.foreground }}>
										{field.unit}
									</Text>
									<View
										style={{
											width: 5,
											height: 5,
											borderRadius: 2.5,
											backgroundColor: field.color,
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
