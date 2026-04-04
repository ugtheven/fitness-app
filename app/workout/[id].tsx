import { Ionicons } from "@expo/vector-icons";
import { and, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAchievementToast } from "../../components/AchievementToast";
import { ScreenHeader } from "../../components/ScreenHeader";
import { db } from "../../db";
import { sessionExercises, workoutExercises, workoutSessions } from "../../db/schema";
import type { Equipment } from "../../lib/exerciseTypes";
import { EXERCISE_VARIANTS_BY_ID } from "../../lib/exerciseVariants";
import { palette } from "../../lib/palette";
import { borders, radius } from "../../lib/tokens";
import { useSessionTimer } from "../../lib/useSessionTimer";
import { XP_REWARDS } from "../../lib/xp";
import { checkAndGrantAchievements, grantXp } from "../../lib/xpQueries";

function equipmentIcon(equipment: Equipment): keyof typeof Ionicons.glyphMap {
	switch (equipment) {
		case "bodyweight":
			return "person-outline";
		case "dumbbell":
		case "barbell":
			return "barbell-outline";
		case "machine":
		case "cable":
			return "hardware-chip-outline";
	}
}

export default function WorkoutScreen() {
	const { t } = useTranslation();
	const { id } = useLocalSearchParams<{ id: string }>();
	const workoutSessionId = Number(id);
	const router = useRouter();
	const { showLevelUpToast } = useAchievementToast();

	const { data: workoutSessionData } = useLiveQuery(
		db.select().from(workoutSessions).where(eq(workoutSessions.id, workoutSessionId))
	);
	const workoutSession = workoutSessionData?.[0];
	const sessionName = workoutSession?.sessionName;
	const programName = workoutSession?.programName;

	const { data: exerciseRows = [] } = useLiveQuery(
		db
			.select({
				workoutExercise: workoutExercises,
				sessionExercise: sessionExercises,
			})
			.from(workoutExercises)
			.leftJoin(sessionExercises, eq(workoutExercises.sessionExerciseId, sessionExercises.id))
			.where(eq(workoutExercises.workoutSessionId, workoutSessionId))
			.orderBy(workoutExercises.id)
	);

	const scrollViewRef = useRef<ScrollView>(null);
	const itemLayoutsRef = useRef<Record<number, number>>({});
	const hasScrolledRef = useRef(false);

	// Safety net: if all exercises are done but session is still in_progress
	// (e.g. exercise screen navigated back before finalizing), mark it completed.
	// XP is granted in exercise/[id].tsx at finalization time.
	useEffect(() => {
		if (!workoutSession || workoutSession.status === "completed") return;
		if (exerciseRows.length === 0) return;

		const allDone = exerciseRows.every(
			({ workoutExercise }) => workoutExercise.status === "completed"
		);
		if (!allDone) return;

		async function finalize() {
			await db
				.update(workoutSessions)
				.set({ status: "completed", endedAt: new Date().toISOString() })
				.where(
					and(eq(workoutSessions.id, workoutSessionId), eq(workoutSessions.status, "in_progress"))
				);

			// Grant XP idempotently (may already have been granted by exercise screen)
			const date = workoutSession.date;
			const xpResult = await grantXp(XP_REWARDS.workout, "workout", String(workoutSessionId), date);
			if (xpResult.leveledUp) showLevelUpToast(xpResult.newLevel);
			await checkAndGrantAchievements(date);
		}
		finalize();
	}, [exerciseRows, workoutSession, workoutSessionId, showLevelUpToast]);

	const doneCount = exerciseRows.filter(
		({ workoutExercise }) => workoutExercise.status === "completed"
	).length;
	const totalCount = exerciseRows.length;
	const currentExerciseId = exerciseRows.find(
		({ workoutExercise }) => workoutExercise.status !== "completed"
	)?.workoutExercise.id;

	// Scroll to current exercise once on initial load
	useEffect(() => {
		if (hasScrolledRef.current || currentExerciseId == null) return;
		const y = itemLayoutsRef.current[currentExerciseId];
		if (y == null) return;
		hasScrolledRef.current = true;
		scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
	});

	const timerLabel = useSessionTimer(workoutSession?.startedAt, workoutSession?.status);

	if (!workoutSession) return null;

	if (exerciseRows.length === 0) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center" edges={["top"]}>
				<Text className="text-base" style={{ color: palette.muted.foreground }}>
					{t("home.emptySessionTitle")}
				</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader
				title={sessionName ?? "—"}
				subtitle={programName ?? undefined}
				onBack={() => router.back()}
				action={
					<View
						className="px-3 py-1.5 rounded-xl"
						style={{
							backgroundColor: palette.accent.muted,
							borderWidth: 1,
							borderColor: palette.accent.border,
						}}
					>
						<Text
							className="text-sm font-bold tabular-nums"
							style={{ color: palette.accent.DEFAULT }}
						>
							{timerLabel}
						</Text>
					</View>
				}
			/>

			<ScrollView
				ref={scrollViewRef}
				className="flex-1 px-6"
				contentContainerStyle={{ gap: 12, paddingTop: 4, paddingBottom: 24 }}
			>
				<Text className="text-xs font-medium" style={{ color: palette.muted.foreground }}>
					{t("workout.exerciseProgress", { done: doneCount, count: totalCount })}
				</Text>

				{exerciseRows.map(({ workoutExercise }) => {
					const variant = EXERCISE_VARIANTS_BY_ID[workoutExercise.exerciseVariantId];
					const name = variant
						? t(`exercises.names.${variant.id}`)
						: workoutExercise.exerciseVariantId;
					const isDone = workoutExercise.status === "completed";
					const isCurrent = workoutExercise.id === currentExerciseId;
					const icon = variant ? equipmentIcon(variant.equipment) : "barbell-outline";

					return (
						<Pressable
							key={workoutExercise.id}
							onPress={() => router.push(`/workout/exercise/${workoutExercise.id}`)}
							onLayout={(e) => {
								itemLayoutsRef.current[workoutExercise.id] = e.nativeEvent.layout.y;
							}}
							className="active:opacity-70"
						>
							<View
								className="flex-row items-center gap-3 px-5 py-4"
								style={{
									backgroundColor: palette.card.DEFAULT,
									borderRadius: radius.lg,
									opacity: isDone ? 0.45 : 1,
									borderWidth: isCurrent ? borders.emphasis : 0,
									borderColor: palette.accent.DEFAULT,
								}}
							>
								<View
									className="w-9 h-9 rounded-full items-center justify-center"
									style={{
										backgroundColor: isDone
											? palette.accent.muted
											: isCurrent
												? palette.accent.muted
												: palette.muted.DEFAULT,
									}}
								>
									<Ionicons
										name={isDone ? "checkmark" : icon}
										size={18}
										color={isDone || isCurrent ? palette.accent.DEFAULT : palette.muted.foreground}
									/>
								</View>
								<View className="flex-1">
									<Text className="text-base font-semibold text-foreground" numberOfLines={1}>
										{name}
									</Text>
									<Text className="text-xs mt-0.5" style={{ color: palette.muted.foreground }}>
										{workoutExercise.prescribedSets} × {workoutExercise.prescribedReps}
									</Text>
								</View>
								{!isDone && (
									<Ionicons
										name="chevron-forward"
										size={18}
										color={isCurrent ? palette.accent.DEFAULT : palette.muted.foreground}
									/>
								)}
							</View>
						</Pressable>
					);
				})}
			</ScrollView>
		</SafeAreaView>
	);
}
