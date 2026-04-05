import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "../../components/ScreenHeader";
import { db } from "../../db";
import { workoutExercises, workoutSessions, workoutSets } from "../../db/schema";
import { type DaySummary, getDaySummary } from "../../lib/activityQueries";
import { palette } from "../../lib/palette";
import { radius, spacing } from "../../lib/tokens";
import { useUnits } from "../../lib/units";
import { getSessionPRs } from "../../lib/workoutHistory";

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

function formatDisplayDate(dateStr: string, locale: string): string {
	const [y, m, d] = dateStr.split("-").map(Number);
	const date = new Date(y, m - 1, d, 12);
	const fmt = new Intl.DateTimeFormat(locale, {
		weekday: "long",
		day: "numeric",
		month: "long",
	});
	const label = fmt.format(date);
	return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function DayDetailScreen() {
	const { t, i18n } = useTranslation();
	const { displayWeight, weightUnit } = useUnits();
	const router = useRouter();
	const { date } = useLocalSearchParams<{ date: string }>();

	const [daySummary, setDaySummary] = useState<DaySummary | null>(null);
	const [prCounts, setPrCounts] = useState<Map<number, number>>(new Map());

	// Workouts for this date (reactive)
	const { data: workouts = [] } = useLiveQuery(
		db
			.select({
				id: workoutSessions.id,
				sessionName: workoutSessions.sessionName,
				startedAt: workoutSessions.startedAt,
				endedAt: workoutSessions.endedAt,
				date: workoutSessions.date,
			})
			.from(workoutSessions)
			.where(eq(workoutSessions.date, date))
			.orderBy(workoutSessions.startedAt)
	);

	// Load workout details (sets, volume) for each workout
	const [workoutDetails, setWorkoutDetails] = useState<
		Map<number, { setCount: number; totalVolume: number }>
	>(new Map());

	useEffect(() => {
		async function loadDetails() {
			const details = new Map<number, { setCount: number; totalVolume: number }>();
			for (const w of workouts) {
				const exercises = await db
					.select({ id: workoutExercises.id })
					.from(workoutExercises)
					.where(eq(workoutExercises.workoutSessionId, w.id));

				let setCount = 0;
				let totalVolume = 0;
				for (const ex of exercises) {
					const sets = await db
						.select({
							reps: workoutSets.reps,
							repsLeft: workoutSets.repsLeft,
							repsRight: workoutSets.repsRight,
							weight: workoutSets.weight,
						})
						.from(workoutSets)
						.where(eq(workoutSets.workoutExerciseId, ex.id));
					setCount += sets.length;
					for (const s of sets) {
						const reps = s.reps ?? (s.repsLeft ?? 0) + (s.repsRight ?? 0);
						totalVolume += reps * (s.weight ?? 0);
					}
				}
				details.set(w.id, { setCount, totalVolume });
			}
			setWorkoutDetails(details);
		}
		if (workouts.length > 0) loadDetails();
	}, [workouts]);

	// Load PRs
	useEffect(() => {
		if (workouts.length === 0) return;
		let cancelled = false;
		Promise.all(
			workouts.map((w) => getSessionPRs(w.id).then((prs) => [w.id, prs.length] as const))
		).then((results) => {
			if (cancelled) return;
			const map = new Map<number, number>();
			for (const [id, count] of results) {
				if (count > 0) map.set(id, count);
			}
			setPrCounts(map);
		});
		return () => {
			cancelled = true;
		};
	}, [workouts]);

	// Load day summary (nutrition, hydration, steps)
	useEffect(() => {
		let cancelled = false;
		getDaySummary(date).then((s) => {
			if (!cancelled) setDaySummary(s);
		});
		return () => {
			cancelled = true;
		};
	}, [date]);

	const title = formatDisplayDate(date, i18n.language);

	const hasWorkouts = workouts.length > 0;
	const hasNutrition = daySummary?.nutrition != null;
	const hasHydration = daySummary?.hydration != null;
	const hasSteps = (daySummary?.steps ?? 0) > 0;
	const hasAnything = hasWorkouts || hasNutrition || hasHydration || hasSteps;

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader title={title} onBack={() => router.back()} />

			<ScrollView
				className="flex-1"
				contentContainerStyle={{
					paddingHorizontal: spacing.screenPx,
					paddingTop: 8,
					paddingBottom: spacing.navbarClearance,
					gap: 12,
				}}
				showsVerticalScrollIndicator={false}
			>
				{!hasAnything ? (
					<View className="items-center justify-center py-16 gap-3">
						<Ionicons name="calendar-outline" size={40} color={palette.muted.foreground} />
						<Text className="text-base font-semibold" style={{ color: palette.muted.foreground }}>
							{t("activity.nothingThisDay")}
						</Text>
					</View>
				) : (
					<>
						{/* Workouts */}
						{workouts.map((workout) => {
							const details = workoutDetails.get(workout.id);
							return (
								<Pressable
									key={workout.id}
									onPress={() => router.push(`/history/${workout.id}`)}
									className="active:opacity-70"
								>
									<View
										className="px-5 py-4"
										style={{
											backgroundColor: palette.card.DEFAULT,
											borderRadius: radius.lg,
										}}
									>
										<View className="flex-row items-center gap-3 mb-1.5">
											<Ionicons name="barbell-outline" size={16} color={palette.foreground} />
											<Text
												className="text-base font-semibold text-foreground flex-1 mr-3"
												numberOfLines={1}
											>
												{workout.sessionName ?? t("activity.deletedSession")}
											</Text>
											<Ionicons name="chevron-forward" size={16} color={palette.muted.foreground} />
										</View>
										<View className="flex-row items-center gap-2 pl-7">
											<Text className="text-xs" style={{ color: palette.muted.foreground }}>
												{formatDuration(workout.startedAt, workout.endedAt)}
											</Text>
											{details && (
												<>
													<Text className="text-xs" style={{ color: palette.muted.foreground }}>
														·
													</Text>
													<Text className="text-xs" style={{ color: palette.muted.foreground }}>
														{details.setCount} sets
													</Text>
													<Text className="text-xs" style={{ color: palette.muted.foreground }}>
														·
													</Text>
													<Text className="text-xs" style={{ color: palette.muted.foreground }}>
														{formatVolume(displayWeight(details.totalVolume), weightUnit)}
													</Text>
												</>
											)}
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
							);
						})}

						{/* Nutrition */}
						{hasNutrition && daySummary?.nutrition && (
							<View
								className="px-5 py-4"
								style={{
									backgroundColor: palette.card.DEFAULT,
									borderRadius: radius.lg,
								}}
							>
								<View className="flex-row items-center gap-3 mb-2">
									<Ionicons name="restaurant-outline" size={16} color={palette.foreground} />
									<Text className="text-base font-semibold text-foreground">
										{t("activity.statDiet")}
									</Text>
								</View>
								<View className="pl-7 gap-1">
									<Text className="text-sm text-foreground">
										{daySummary.nutrition.calories} {t("nutrition.kcal")} · P:{" "}
										{daySummary.nutrition.protein}
										{t("nutrition.grams")} · G: {daySummary.nutrition.carbs}
										{t("nutrition.grams")} · L: {daySummary.nutrition.fat}
										{t("nutrition.grams")}
									</Text>
									<Text className="text-xs" style={{ color: palette.muted.foreground }}>
										{t("activity.mealsConfirmed", {
											count: daySummary.nutrition.mealCount,
										})}
									</Text>
								</View>
							</View>
						)}

						{/* Hydration */}
						{hasHydration && daySummary?.hydration && (
							<View
								className="px-5 py-4"
								style={{
									backgroundColor: palette.card.DEFAULT,
									borderRadius: radius.lg,
								}}
							>
								<View className="flex-row items-center gap-3 mb-2">
									<Ionicons name="water-outline" size={16} color={palette.foreground} />
									<Text className="text-base font-semibold text-foreground">
										{t("activity.statHydration")}
									</Text>
								</View>
								<View className="pl-7">
									<Text className="text-sm text-foreground">
										{(daySummary.hydration.volumeMl / 1000).toFixed(1)}L /{" "}
										{(daySummary.hydration.goalMl / 1000).toFixed(1)}L (
										{Math.round(
											(daySummary.hydration.volumeMl / daySummary.hydration.goalMl) * 100
										)}
										%)
									</Text>
								</View>
							</View>
						)}

						{/* Steps */}
						{hasSteps && daySummary && (
							<View
								className="px-5 py-4"
								style={{
									backgroundColor: palette.card.DEFAULT,
									borderRadius: radius.lg,
								}}
							>
								<View className="flex-row items-center gap-3">
									<Ionicons name="footsteps" size={16} color={palette.foreground} />
									<Text className="text-base font-semibold text-foreground">
										{t("activity.steps", {
											count: daySummary.steps.toLocaleString(),
										})}
									</Text>
								</View>
							</View>
						)}
					</>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
