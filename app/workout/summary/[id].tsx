import { Ionicons } from "@expo/vector-icons";
import { eq, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../../components/Button";
import { db } from "../../../db";
import { workoutExercises, workoutSessions, workoutSets, xpLogs } from "../../../db/schema";
import { EXERCISE_VARIANTS_BY_ID } from "../../../lib/exerciseVariants";
import { palette } from "../../../lib/palette";
import { radius, typography } from "../../../lib/tokens";
import { useUnits } from "../../../lib/units";
import { getSessionPRs } from "../../../lib/workoutHistory";
import { XP_REWARDS } from "../../../lib/xp";

export default function WorkoutSummaryScreen() {
	const { t } = useTranslation();
	const { displayWeight, weightUnit } = useUnits();
	const { id } = useLocalSearchParams<{ id: string }>();
	const workoutSessionId = Number(id);
	const router = useRouter();

	const { data: sessionData } = useLiveQuery(
		db.select().from(workoutSessions).where(eq(workoutSessions.id, workoutSessionId))
	);
	const workoutSession = sessionData?.[0];
	const sessionName = workoutSession?.sessionName;

	const { data: exerciseStats } = useLiveQuery(
		db
			.select({
				total: sql<number>`count(*)`,
				completed: sql<number>`sum(case when ${workoutExercises.status} = 'completed' then 1 else 0 end)`,
			})
			.from(workoutExercises)
			.where(eq(workoutExercises.workoutSessionId, workoutSessionId))
	);

	const { data: setStats } = useLiveQuery(
		db
			.select({
				total: sql<number>`count(${workoutSets.id})`,
				volume: sql<number>`coalesce(sum(
					coalesce(${workoutSets.reps}, coalesce(${workoutSets.repsLeft}, 0) + coalesce(${workoutSets.repsRight}, 0))
					* coalesce(${workoutSets.weight}, 0)
				), 0)`,
			})
			.from(workoutSets)
			.innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
			.where(eq(workoutExercises.workoutSessionId, workoutSessionId))
	);

	const [prs, setPrs] = useState<Awaited<ReturnType<typeof getSessionPRs>>>([]);
	const [prsLoading, setPrsLoading] = useState(true);

	// XP earned for this workout
	const { data: workoutXpLogs = [] } = useLiveQuery(
		db
			.select()
			.from(xpLogs)
			.where(sql`${xpLogs.source} = 'workout' AND ${xpLogs.sourceId} = ${workoutSessionId}`)
	);
	const workoutXp = workoutXpLogs[0]?.amount ?? XP_REWARDS.workout;

	// Achievements unlocked during this workout (by matching date)
	const { data: achievementXpLogs = [] } = useLiveQuery(
		db
			.select()
			.from(xpLogs)
			.where(
				sql`${xpLogs.source} = 'achievement' AND ${xpLogs.date} = ${workoutSession?.date ?? ""}`
			)
	);

	useEffect(() => {
		getSessionPRs(workoutSessionId).then((result) => {
			setPrs(result);
			setPrsLoading(false);
		});
	}, [workoutSessionId]);

	if (!workoutSession) return null;

	// Duration
	const startMs = new Date(workoutSession.startedAt).getTime();
	const endMs = workoutSession.endedAt ? new Date(workoutSession.endedAt).getTime() : Date.now();
	const totalSeconds = Math.floor((endMs - startMs) / 1000);
	const dHours = Math.floor(totalSeconds / 3600);
	const dMinutes = Math.floor((totalSeconds % 3600) / 60);
	const dSeconds = totalSeconds % 60;
	const durationLabel =
		dHours > 0
			? `${dHours}:${String(dMinutes).padStart(2, "0")}:${String(dSeconds).padStart(2, "0")}`
			: `${String(dMinutes).padStart(2, "0")}:${String(dSeconds).padStart(2, "0")}`;

	const completedExercises = exerciseStats?.[0]?.completed ?? 0;
	const totalSets = setStats?.[0]?.total ?? 0;
	const totalVolume = setStats?.[0]?.volume ?? 0;
	const volumeLabel =
		totalVolume > 0 ? `${Math.round(displayWeight(totalVolume))} ${weightUnit}` : "—";

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
			<View className="flex-1 items-center justify-center px-6 gap-8">
				{/* Completion icon */}
				<View
					className="w-24 h-24 rounded-full items-center justify-center"
					style={{ backgroundColor: palette.accent.muted }}
				>
					<Ionicons name="checkmark" size={52} color={palette.accent.DEFAULT} />
				</View>

				{/* Title & session name */}
				<View className="items-center gap-2">
					<Text className="text-3xl font-bold text-foreground text-center">
						{t("workout.sessionCompleted")}
					</Text>
					{sessionName && (
						<Text className="text-base" style={{ color: palette.muted.foreground }}>
							{sessionName}
						</Text>
					)}
				</View>

				{/* Duration */}
				<View className="items-center gap-1">
					<Text
						className="text-xs font-semibold uppercase tracking-widest"
						style={{ color: palette.muted.foreground }}
					>
						{t("workout.duration")}
					</Text>
					<Text
						className="font-bold tabular-nums"
						style={{ ...typography.displaySm, color: palette.foreground }}
					>
						{durationLabel}
					</Text>
				</View>

				{/* Stats row */}
				<View className="flex-row gap-3 w-full">
					<StatCard label={t("workout.totalExercises")} value={String(completedExercises)} />
					<StatCard label={t("workout.totalSets")} value={String(totalSets)} />
					<StatCard label={t("workout.volume")} value={volumeLabel} muted={totalVolume === 0} />
				</View>

				{/* PRs beaten */}
				{prsLoading ? (
					<ActivityIndicator size="small" color={palette.accent.DEFAULT} />
				) : prs.length === 0 ? null : (
					<View className="w-full gap-2">
						<View className="flex-row items-center gap-2 justify-center">
							<Ionicons name="flash" size={16} color={palette.accent.DEFAULT} />
							<Text className="text-sm font-bold" style={{ color: palette.accent.DEFAULT }}>
								{t("pr.prsBeaten")}
							</Text>
						</View>
						{prs.map((pr) => {
							const variant = EXERCISE_VARIANTS_BY_ID[pr.exerciseVariantId];
							const name = variant ? t(`exercises.names.${variant.id}`) : pr.exerciseVariantId;
							return (
								<View
									key={pr.exerciseVariantId}
									className="flex-row items-center justify-between px-4 py-3"
									style={{ backgroundColor: palette.accent.muted, borderRadius: radius.lg }}
								>
									<Text
										className="text-sm font-semibold text-foreground flex-1 mr-3"
										numberOfLines={1}
									>
										{name}
									</Text>
									<View className="items-end">
										<Text className="text-sm font-bold" style={{ color: palette.accent.DEFAULT }}>
											{displayWeight(pr.newWeight)} {weightUnit}
										</Text>
										<Text className="text-xs" style={{ color: palette.muted.foreground }}>
											{pr.previousWeight != null
												? t("pr.previousRecord", {
														weight: displayWeight(pr.previousWeight),
														unit: weightUnit,
													})
												: t("pr.firstRecord")}
										</Text>
									</View>
								</View>
							);
						})}
					</View>
				)}

				{/* XP earned */}
				<View className="w-full gap-2">
					<View className="flex-row items-center gap-2 justify-center">
						<Ionicons name="star" size={16} color={palette.accent.DEFAULT} />
						<Text className="text-sm font-bold" style={{ color: palette.accent.DEFAULT }}>
							{t("xp.earned", { amount: workoutXp })}
						</Text>
					</View>
					{achievementXpLogs.map((log) => (
						<View
							key={log.id}
							className="flex-row items-center justify-between px-4 py-2"
							style={{ backgroundColor: palette.accent.muted, borderRadius: radius.lg }}
						>
							<Text className="text-xs text-foreground">{t("achievements.title")}</Text>
							<Text className="text-xs font-bold" style={{ color: palette.accent.DEFAULT }}>
								+{log.amount} XP
							</Text>
						</View>
					))}
				</View>
			</View>

			{/* CTA */}
			<View className="px-6 pb-6">
				<Button
					variant="glow"
					fullWidth
					label={t("workout.backToHome")}
					onPress={() => router.replace("/(tabs)")}
				/>
			</View>
		</SafeAreaView>
	);
}

function StatCard({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
	return (
		<View
			className="flex-1 items-center justify-center py-4"
			style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
		>
			<Text
				className="font-bold"
				style={{
					...typography.statLg,
					color: muted ? palette.muted.foreground : palette.foreground,
				}}
			>
				{value}
			</Text>
			<Text className="text-xs mt-1 text-center" style={{ color: palette.muted.foreground }}>
				{label}
			</Text>
		</View>
	);
}
