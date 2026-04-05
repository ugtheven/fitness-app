import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "../../components/Calendar";
import type { DayModules } from "../../components/Calendar";
import { getDayModules } from "../../lib/activityQueries";
import { palette } from "../../lib/palette";
import { spacing } from "../../lib/tokens";
import { useUnits } from "../../lib/units";
import { getWorkoutsByMonthQuery } from "../../lib/workoutHistory";

export default function ActivityScreen() {
	const { t } = useTranslation();
	const { displayWeight, weightUnit } = useUnits();
	const router = useRouter();

	const now = new Date();
	const [displayMonth, setDisplayMonth] = useState(
		() => new Date(now.getFullYear(), now.getMonth(), 1)
	);

	const year = displayMonth.getFullYear();
	const month = displayMonth.getMonth();

	// Workout data (reactive, for volume/time stats)
	const { data: workouts = [] } = useLiveQuery(getWorkoutsByMonthQuery(year, month));

	// Day completions
	const [dayModules, setDayModules] = useState<Map<string, DayModules>>(new Map());

	const loadMonthData = useCallback(async () => {
		const modules = await getDayModules(year, month);
		setDayModules(modules);
	}, [year, month]);

	useEffect(() => {
		loadMonthData();
	}, [loadMonthData]);

	function handleChangeMonth(date: Date) {
		setDisplayMonth(date);
	}

	function handleSelectDate(date: string) {
		router.push(`/activity/${date}`);
	}

	// Monthly volume & time
	const { volumeLabel, monthHours } = useMemo(() => {
		let totalVolume = 0;
		let totalTimeMs = 0;
		for (const w of workouts) {
			totalVolume += w.totalVolume;
			if (w.endedAt) {
				totalTimeMs += new Date(w.endedAt).getTime() - new Date(w.startedAt).getTime();
			}
		}
		const hours = Math.round((totalTimeMs / 3_600_000) * 10) / 10;
		const displayed = displayWeight(totalVolume);
		let label: string;
		if (displayed === 0) {
			label = "—";
		} else if (displayed < 1000) {
			label = `${Math.round(displayed)} ${weightUnit}`;
		} else {
			label = `${(Math.round(displayed / 100) / 10).toFixed(1)}t`;
		}
		return { volumeLabel: label, monthHours: hours };
	}, [workouts, displayWeight, weightUnit]);

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: spacing.navbarClearance }}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View className="px-6 pt-2 pb-4">
					<Text className="text-2xl font-bold text-foreground">{t("activity.title")}</Text>
				</View>

				{/* Monthly workout summary */}
				{workouts.length > 0 && (
					<View className="px-6 mb-2">
						<Text className="text-xs" style={{ color: palette.muted.foreground }}>
							{t("activity.monthSummary", {
								count: workouts.length,
								hours: monthHours,
								volume: volumeLabel,
							})}
						</Text>
					</View>
				)}

				{/* Calendar */}
				<View className="mb-4">
					<Calendar
						onSelectDate={handleSelectDate}
						dayModules={dayModules}
						displayMonth={displayMonth}
						onChangeMonth={handleChangeMonth}
					/>
				</View>

				{/* Hint */}
				<View className="items-center px-6">
					<Text className="text-xs text-center" style={{ color: palette.muted.foreground }}>
						{t("activity.calendarHint")}
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
