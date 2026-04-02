import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { palette } from "../../lib/palette";
import { getLatestMeasurementsQuery, getLatestWeightQuery, insertGoal } from "../../lib/profileQueries";
import { BottomDrawer } from "../BottomDrawer";
import { Button } from "../Button";
import { NumberField } from "../NumberField";

type GoalType = "weight" | "bodyFat" | "shoulders" | "chest" | "waist" | "hips" | "neck" | "arms" | "thigh" | "calf";
type Category = "weight" | "measurement";

const MEASUREMENT_KEYS: GoalType[] = ["bodyFat", "shoulders", "chest", "waist", "hips", "neck", "arms", "thigh", "calf"];

function todayStr(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysUntil(deadline: string): number {
	const now = new Date(todayStr());
	const target = new Date(deadline);
	return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
}

function getUnit(type: GoalType): string {
	return type === "bodyFat" ? "%" : type === "weight" ? "kg" : "cm";
}

function getStep(type: GoalType): number {
	return type === "bodyFat" ? 0.1 : type === "weight" ? 0.1 : 0.5;
}

type Props = {
	visible: boolean;
	onClose: () => void;
};

export function CreateGoalDrawer({ visible, onClose }: Props) {
	const { t } = useTranslation();
	const [category, setCategory] = useState<Category>("weight");
	const [measurementKey, setMeasurementKey] = useState<GoalType>("chest");
	const [targetValue, setTargetValue] = useState(80);
	const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);
	const [showPicker, setShowPicker] = useState(false);
	const [saving, setSaving] = useState(false);

	const { data: latestWeights = [] } = useLiveQuery(getLatestWeightQuery());
	const { data: latestMeasurements = [] } = useLiveQuery(getLatestMeasurementsQuery());

	const goalType: GoalType = category === "weight" ? "weight" : measurementKey;

	const currentValue = useMemo(() => {
		if (goalType === "weight") return latestWeights[0]?.weightKg ?? null;
		const m = latestMeasurements[0];
		if (!m) return null;
		return m[goalType as keyof typeof m] as number | null;
	}, [goalType, latestWeights, latestMeasurements]);

	const unit = getUnit(goalType);
	const deadline = deadlineDate
		? `${deadlineDate.getFullYear()}-${String(deadlineDate.getMonth() + 1).padStart(2, "0")}-${String(deadlineDate.getDate()).padStart(2, "0")}`
		: "";
	const days = deadline ? daysUntil(deadline) : null;

	async function handleCreate() {
		if (!deadline) return;
		setSaving(true);
		try {
			await insertGoal({
				type: goalType,
				targetValue,
				startValue: currentValue ?? targetValue,
				deadline,
			});
			onClose();
		} finally {
			setSaving(false);
		}
	}

	return (
		<BottomDrawer visible={visible} onClose={onClose} title={t("profile.newGoal")}>
			<View className="gap-4">
				{/* Category toggle */}
				<View>
					<Text className="text-sm font-medium text-foreground mb-2">{t("profile.goalType")}</Text>
					<View className="flex-row gap-2">
						{(["weight", "measurement"] as const).map((cat) => {
							const isActive = category === cat;
							return (
								<Pressable
									key={cat}
									onPress={() => setCategory(cat)}
									className="flex-1 items-center py-3 rounded-xl"
									style={{
										backgroundColor: isActive ? palette.primary.DEFAULT : palette.muted.DEFAULT,
									}}
								>
									<Text
										className="text-sm font-semibold"
										style={{ color: isActive ? palette.primary.foreground : palette.muted.foreground }}
									>
										{cat === "weight" ? t("profile.goalWeight") : t("profile.goalMeasurement")}
									</Text>
								</Pressable>
							);
						})}
					</View>
				</View>

				{/* Measurement picker */}
				{category === "measurement" && (
					<View>
						<Text className="text-sm font-medium text-foreground mb-2">{t("profile.goalMeasurement")}</Text>
						<View className="flex-row flex-wrap" style={{ gap: 8 }}>
							{MEASUREMENT_KEYS.map((key) => {
								const isActive = measurementKey === key;
								return (
									<Pressable
										key={key}
										onPress={() => setMeasurementKey(key)}
										className="px-3 py-2 rounded-xl"
										style={{
											backgroundColor: isActive ? palette.primary.DEFAULT : palette.muted.DEFAULT,
										}}
									>
										<Text
											className="text-xs font-semibold"
											style={{ color: isActive ? palette.primary.foreground : palette.muted.foreground }}
										>
											{t(`profile.${key}`)}
										</Text>
									</Pressable>
								);
							})}
						</View>
					</View>
				)}

				{/* Current value display */}
				<View
					className="flex-row items-center justify-between rounded-2xl px-4 py-3"
					style={{ backgroundColor: palette.muted.DEFAULT }}
				>
					<Text className="text-sm" style={{ color: palette.muted.foreground }}>
						{t("profile.current")} {t(`profile.${goalType === "weight" ? "weight" : goalType}`)}
					</Text>
					<Text className="text-base font-bold text-foreground">
						{currentValue != null ? `${currentValue} ${unit}` : "—"}
					</Text>
				</View>

				{/* Target value */}
				<NumberField
					label={`${t("profile.target")} ${t(`profile.${goalType === "weight" ? "weight" : goalType}`)}`}
					value={targetValue}
					onValueChange={setTargetValue}
					min={0}
					max={goalType === "bodyFat" ? 60 : 300}
					step={getStep(goalType)}
					endAdornment={unit}
				/>

				{/* Deadline */}
				<View className="gap-1.5">
					<Text className="text-sm font-medium text-foreground">{t("profile.deadline")}</Text>
					<Pressable
						onPress={() => setShowPicker(true)}
						className="flex-row items-center rounded-2xl border border-border bg-background px-4"
						style={{ height: 52 }}
					>
						<Text
							className="flex-1 text-base"
							style={{ color: deadline ? palette.foreground : palette.muted.foreground }}
						>
							{deadline || t("profile.selectDate")}
						</Text>
						<Ionicons name="calendar-outline" size={20} color={palette.muted.foreground} />
					</Pressable>
					{showPicker && (
						<DateTimePicker
							value={deadlineDate ?? new Date()}
							mode="date"
							display="inline"
							minimumDate={new Date()}
							themeVariant="dark"
							accentColor={palette.primary.DEFAULT}
							onChange={(_event, selected) => {
								if (selected) setDeadlineDate(selected);
								setShowPicker(false);
							}}
						/>
					)}
				</View>

				{/* Days remaining */}
				{days != null && (
					<View className="flex-row items-center gap-2">
						<Ionicons name="time-outline" size={16} color={palette.muted.foreground} />
						<Text className="text-sm" style={{ color: palette.muted.foreground }}>
							{t("profile.daysRemaining", { count: days })}
						</Text>
					</View>
				)}

				{/* Create button */}
				<Button
					label={t("profile.createGoal")}
					onPress={handleCreate}
					loading={saving}
					fullWidth
					disabled={!deadline}
				/>
			</View>
		</BottomDrawer>
	);
}
