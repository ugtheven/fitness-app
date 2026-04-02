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
import { sessions, workoutExercises, workoutSessions, workoutSets } from "../../../db/schema";
import { EXERCISE_VARIANTS_BY_ID } from "../../../lib/exerciseVariants";
import { palette } from "../../../lib/palette";
import { useUnits } from "../../../lib/units";
import { getSessionPRs } from "../../../lib/workoutHistory";

export default function WorkoutSummaryScreen() {
	const { t } = useTranslation();
	const { displayWeight, weightUnit } = useUnits();
	const { id } = useLocalSearchParams<{ id: string }>();
	const workoutSessionId = Number(id);
	const router = useRouter();

	const { data: sessionData } = useLiveQuery(
		db
			.select({ workoutSession: workoutSessions, session: sessions })
			.from(workoutSessions)
			.leftJoin(sessions, eq(workoutSessions.sessionId, sessions.id))
			.where(eq(workoutSessions.id, workoutSessionId))
	);
	const row = sessionData?.[0];
	const workoutSession = row?.workoutSession;
	const sessionName = row?.session?.name;

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
	const volumeLabel = totalVolume > 0 ? `${Math.round(displayWeight(totalVolume))} ${weightUnit}` : "—";

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
			<View className="flex-1 items-center justify-center px-6 gap-8">
				{/* Completion icon */}
				<View
					className="w-24 h-24 rounded-full items-center justify-center"
					style={{ backgroundColor: `${palette.primary.DEFAULT}20` }}
				>
					<Ionicons name="checkmark" size={52} color={palette.primary.DEFAULT} />
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
					<Text className="text-xs font-semibold uppercase tracking-widest" style={{ color: palette.muted.foreground }}>
						{t("workout.duration")}
					</Text>
					<Text className="font-bold tabular-nums" style={{ fontSize: 48, color: palette.foreground, lineHeight: 56 }}>
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
					<ActivityIndicator size="small" color={palette.primary.DEFAULT} />
				) : prs.length === 0 ? null : (
					<View className="w-full gap-2">
						<View className="flex-row items-center gap-2 justify-center">
							<Ionicons name="flash" size={16} color={palette.primary.DEFAULT} />
							<Text className="text-sm font-bold" style={{ color: palette.primary.DEFAULT }}>
								{t("pr.prsBeaten")}
							</Text>
						</View>
						{prs.map((pr) => {
							const variant = EXERCISE_VARIANTS_BY_ID[pr.exerciseVariantId];
							const name = variant ? t(`exercises.names.${variant.id}`) : pr.exerciseVariantId;
							return (
								<View
									key={pr.exerciseVariantId}
									className="flex-row items-center justify-between rounded-2xl px-4 py-3"
									style={{ backgroundColor: `${palette.primary.DEFAULT}15` }}
								>
									<Text className="text-sm font-semibold text-foreground flex-1 mr-3" numberOfLines={1}>
										{name}
									</Text>
									<View className="items-end">
										<Text className="text-sm font-bold" style={{ color: palette.primary.DEFAULT }}>
											{displayWeight(pr.newWeight)} {weightUnit}
										</Text>
										<Text className="text-xs" style={{ color: palette.muted.foreground }}>
											{pr.previousWeight != null
												? t("pr.previousRecord", { weight: displayWeight(pr.previousWeight), unit: weightUnit })
												: t("pr.firstRecord")}
										</Text>
									</View>
								</View>
							);
						})}
					</View>
				)}
			</View>

			{/* CTA */}
			<View className="px-6 pb-6">
				<Button
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
			className="flex-1 items-center justify-center rounded-2xl py-4"
			style={{ backgroundColor: palette.card.DEFAULT }}
		>
			<Text
				className="font-bold"
				style={{ fontSize: 28, color: muted ? palette.muted.foreground : palette.foreground, lineHeight: 34 }}
			>
				{value}
			</Text>
			<Text className="text-xs mt-1 text-center" style={{ color: palette.muted.foreground }}>
				{label}
			</Text>
		</View>
	);
}
