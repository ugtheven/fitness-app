import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "../../components/Calendar";
import { palette } from "../../lib/palette";
import { radius, spacing } from "../../lib/tokens";
import { useUnits } from "../../lib/units";
import { getSessionPRs, getWorkoutsByMonthQuery } from "../../lib/workoutHistory";

function formatDuration(startedAt: string, endedAt: string | null): string {
	const startMs = new Date(startedAt).getTime();
	const endMs = endedAt ? new Date(endedAt).getTime() : Date.now();
	const totalSeconds = Math.floor((endMs - startMs) / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	}
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatVolume(volume: number, unit: string): string {
	if (volume === 0) return "—";
	if (volume >= 1000) {
		const thousands = Math.floor(volume / 1000);
		const remainder = Math.round((volume % 1000) / 10) * 10;
		if (remainder === 0) return `${thousands} 000 ${unit}`;
		return `${thousands} ${String(remainder).padStart(3, "0")} ${unit}`;
	}
	return `${Math.round(volume)} ${unit}`;
}

/** Format a YYYY-MM-DD local date for display */
function formatWorkoutDate(dateStr: string, locale: string): string {
	// Parse as local date (noon avoids any DST edge case)
	const [y, m, d] = dateStr.split("-").map(Number);
	const date = new Date(y, m - 1, d, 12);
	const fmt = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" });
	const label = fmt.format(date);
	return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function ActivityScreen() {
	const { t, i18n } = useTranslation();
	const { displayWeight, weightUnit } = useUnits();
	const router = useRouter();

	const now = new Date();
	const [displayMonth, setDisplayMonth] = useState(
		() => new Date(now.getFullYear(), now.getMonth(), 1)
	);
	const [selectedDate, setSelectedDate] = useState<string | null>(null);

	const year = displayMonth.getFullYear();
	const month = displayMonth.getMonth();

	const { data: workouts = [] } = useLiveQuery(getWorkoutsByMonthQuery(year, month));

	const [prCounts, setPrCounts] = useState<Map<number, number>>(new Map());
	const loadedIdsRef = useRef<Set<number>>(new Set());
	const hasAutoSelectedRef = useRef(false);

	// Auto-select the most recent workout date on first load
	useEffect(() => {
		if (hasAutoSelectedRef.current || workouts.length === 0) return;
		const mostRecent = workouts.reduce(
			(latest, w) => (w.date > latest ? w.date : latest),
			workouts[0].date
		);
		setSelectedDate(mostRecent);
		hasAutoSelectedRef.current = true;
	}, [workouts]);

	// Load PRs for new workouts
	useEffect(() => {
		const newIds = workouts.filter((w) => !loadedIdsRef.current.has(w.id));
		if (newIds.length === 0) return;

		for (const w of newIds) {
			loadedIdsRef.current.add(w.id);
		}

		let cancelled = false;
		Promise.all(newIds.map((w) => getSessionPRs(w.id).then((prs) => [w.id, prs.length] as const)))
			.then((results) => {
				if (cancelled) return;
				setPrCounts((prev) => {
					const next = new Map(prev);
					for (const [id, count] of results) {
						if (count > 0) next.set(id, count);
					}
					return next;
				});
			})
			.catch(() => {});

		return () => {
			cancelled = true;
		};
	}, [workouts]);

	// Build Set<string> of dates with workouts for the calendar dots
	const workoutDates = useMemo(() => {
		const dates = new Set<string>();
		for (const w of workouts) {
			dates.add(w.date);
		}
		return dates;
	}, [workouts]);

	// Filter workouts by selected date (or show all for the month)
	const filteredWorkouts = useMemo(() => {
		if (selectedDate === null) return [];
		return workouts.filter((w) => w.date === selectedDate);
	}, [workouts, selectedDate]);

	function handleChangeMonth(date: Date) {
		setDisplayMonth(date);
		setSelectedDate(null);
		setPrCounts(new Map());
		loadedIdsRef.current = new Set();
	}

	// Determine empty state
	const hasAnyWorkoutsEver = workouts.length > 0 || selectedDate !== null;
	const emptyMessage = selectedDate
		? t("activity.noWorkoutsThisDay")
		: workouts.length === 0
			? t("activity.noWorkouts")
			: t("activity.noWorkoutsThisMonth");
	const emptyHint = !hasAnyWorkoutsEver ? t("activity.noWorkoutsHint") : "";

	// Monthly stats
	const monthStats = useMemo(() => {
		let totalVolume = 0;
		let totalTimeMs = 0;
		for (const w of workouts) {
			totalVolume += w.totalVolume;
			if (w.endedAt) {
				totalTimeMs += new Date(w.endedAt).getTime() - new Date(w.startedAt).getTime();
			}
		}
		const totalHours = Math.round((totalTimeMs / 3_600_000) * 10) / 10;
		const displayedVolume = displayWeight(totalVolume);
		let volumeLabel: string;
		let volumeUnit: string;
		if (displayedVolume === 0) {
			volumeLabel = "—";
			volumeUnit = "";
		} else if (displayedVolume < 1000) {
			volumeLabel = String(Math.round(displayedVolume));
			volumeUnit = weightUnit;
		} else {
			volumeLabel = String(Math.round(displayedVolume / 100) / 10);
			volumeUnit = "t";
		}
		return { sessions: workouts.length, volumeLabel, volumeUnit, hours: totalHours };
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
					<Text className="text-sm mt-1" style={{ color: palette.muted.foreground }}>
						{t("activity.subtitle")}
					</Text>
				</View>

				{/* Stat cards */}
				<View className="flex-row px-6 gap-3 mb-5">
					<View
						className="flex-1 px-4 py-3"
						style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
					>
						<Text className="text-xs font-medium mb-1" style={{ color: palette.muted.foreground }}>
							{t("activity.statSessions")}
						</Text>
						<Text className="text-2xl font-bold text-foreground">{monthStats.sessions}</Text>
					</View>
					<View
						className="flex-1 px-4 py-3"
						style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
					>
						<Text className="text-xs font-medium mb-1" style={{ color: palette.muted.foreground }}>
							{t("activity.statVolume")}
						</Text>
						<View className="flex-row items-baseline">
							<Text className="text-2xl font-bold text-foreground">{monthStats.volumeLabel}</Text>
							{monthStats.volumeUnit !== "" && (
								<Text className="text-sm ml-1" style={{ color: palette.muted.foreground }}>
									{monthStats.volumeUnit}
								</Text>
							)}
						</View>
					</View>
					<View
						className="flex-1 px-4 py-3"
						style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
					>
						<Text className="text-xs font-medium mb-1" style={{ color: palette.muted.foreground }}>
							{t("activity.statTime")}
						</Text>
						<View className="flex-row items-baseline">
							<Text className="text-2xl font-bold text-foreground">{monthStats.hours}</Text>
							<Text className="text-sm ml-1" style={{ color: palette.muted.foreground }}>
								hrs
							</Text>
						</View>
					</View>
				</View>

				{/* Calendar card */}
				<View
					className="mx-6 mb-5"
					style={{
						backgroundColor: palette.card.DEFAULT,
						borderRadius: radius.lg,
						borderWidth: 1,
						borderColor: palette.border,
					}}
				>
					<Calendar
						selectedDate={selectedDate}
						onSelectDate={setSelectedDate}
						workoutDates={workoutDates}
						displayMonth={displayMonth}
						onChangeMonth={handleChangeMonth}
					/>
				</View>

				{/* Workouts list or hint */}
				{filteredWorkouts.length === 0 ? (
					<View className="items-center justify-center px-6 py-12 gap-2">
						{selectedDate ? (
							<Text className="text-base" style={{ color: palette.muted.foreground }}>
								{emptyMessage}
							</Text>
						) : (
							<Text className="text-sm text-center" style={{ color: palette.muted.foreground }}>
								{t("activity.calendarHint")}
							</Text>
						)}
						{emptyHint !== "" && (
							<Text className="text-sm" style={{ color: palette.muted.foreground }}>
								{emptyHint}
							</Text>
						)}
					</View>
				) : (
					<View style={{ gap: 10, paddingHorizontal: 24, paddingTop: 0 }}>
						{filteredWorkouts.map((workout) => (
							<Pressable
								key={workout.id}
								onPress={() => router.push(`/history/${workout.id}`)}
								className="active:opacity-70"
							>
								<View
									className="px-5 py-4"
									style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
								>
									<View className="flex-row items-center justify-between mb-1.5">
										<Text
											className="text-base font-semibold text-foreground flex-1 mr-3"
											numberOfLines={1}
										>
											{workout.sessionName ?? t("activity.deletedSession")}
										</Text>
										<Text className="text-xs" style={{ color: palette.muted.foreground }}>
											{formatWorkoutDate(workout.date, i18n.language)}
										</Text>
									</View>
									<View className="flex-row items-center gap-2">
										<Text className="text-xs" style={{ color: palette.muted.foreground }}>
											{formatDuration(workout.startedAt, workout.endedAt)}
										</Text>
										<Text className="text-xs" style={{ color: palette.muted.foreground }}>
											·
										</Text>
										<Text className="text-xs" style={{ color: palette.muted.foreground }}>
											{workout.setCount} sets
										</Text>
										<Text className="text-xs" style={{ color: palette.muted.foreground }}>
											·
										</Text>
										<Text className="text-xs" style={{ color: palette.muted.foreground }}>
											{formatVolume(displayWeight(workout.totalVolume), weightUnit)}
										</Text>
										{(prCounts.get(workout.id) ?? 0) > 0 && (
											<>
												<Text className="text-xs" style={{ color: palette.muted.foreground }}>
													·
												</Text>
												<View className="flex-row items-center gap-1">
													<Ionicons name="flash" size={12} color={palette.accent.DEFAULT} />
													<Text
														className="text-xs font-semibold"
														style={{ color: palette.accent.DEFAULT }}
													>
														{prCounts.get(workout.id)} PR
													</Text>
												</View>
											</>
										)}
									</View>
								</View>
							</Pressable>
						))}
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
