import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "../../components/ScreenHeader";
import { db } from "../../db";
import { programs, sessionExercises, sessions, workoutExercises, workoutSessions } from "../../db/schema";
import { EXERCISE_VARIANTS_BY_ID } from "../../lib/exerciseVariants";
import type { Equipment } from "../../lib/exerciseTypes";
import { useSessionTimer } from "../../lib/useSessionTimer";
import { palette } from "../../lib/palette";

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

	const { data: workoutSessionData } = useLiveQuery(
		db
			.select({
				workoutSession: workoutSessions,
				session: sessions,
				program: programs,
			})
			.from(workoutSessions)
			.leftJoin(sessions, eq(workoutSessions.sessionId, sessions.id))
			.leftJoin(programs, eq(sessions.programId, programs.id))
			.where(eq(workoutSessions.id, workoutSessionId))
	);
	const workoutSessionRow = workoutSessionData?.[0];
	const workoutSession = workoutSessionRow?.workoutSession;
	const sessionName = workoutSessionRow?.session?.name;
	const programName = workoutSessionRow?.program?.name;

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

	// Auto-finalize when all exercises are completed
	useEffect(() => {
		if (!workoutSession || workoutSession.status === "completed") return;
		if (exerciseRows.length === 0) return;

		const allDone = exerciseRows.every(({ workoutExercise }) => workoutExercise.status === "completed");
		if (!allDone) return;

		async function finalize() {
			await db
				.update(workoutSessions)
				.set({ status: "completed", endedAt: new Date().toISOString() })
				.where(eq(workoutSessions.id, workoutSessionId));
		}
		finalize();
	}, [exerciseRows, workoutSession, workoutSessionId]);


	const doneCount = exerciseRows.filter(({ workoutExercise }) => workoutExercise.status === "completed").length;
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

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader
				title={sessionName ?? "—"}
				subtitle={programName}
				onBack={() => router.back()}
				action={
					<View
						className="px-3 py-1.5 rounded-xl"
						style={{
							backgroundColor: `${palette.primary.DEFAULT}20`,
							borderWidth: 1,
							borderColor: `${palette.primary.DEFAULT}40`,
						}}
					>
						<Text className="text-sm font-bold tabular-nums" style={{ color: palette.primary.DEFAULT }}>
							{timerLabel}
						</Text>
					</View>
				}
			/>


			<ScrollView
				ref={scrollViewRef}
				className="flex-1 px-6"
				contentContainerStyle={{ gap: 10, paddingTop: 4, paddingBottom: 24 }}
			>
				<Text className="text-xs font-medium" style={{ color: palette.muted.foreground }}>
					{t("workout.exerciseProgress", { done: doneCount, count: totalCount })}
				</Text>

				{exerciseRows.map(({ workoutExercise }) => {
					const variant = EXERCISE_VARIANTS_BY_ID[workoutExercise.exerciseVariantId];
					const name = variant ? t(`exercises.names.${variant.id}`) : workoutExercise.exerciseVariantId;
					const isDone = workoutExercise.status === "completed";
					const isCurrent = workoutExercise.id === currentExerciseId;
					const icon = variant ? equipmentIcon(variant.equipment) : "barbell-outline";

					return (
						<Pressable
							key={workoutExercise.id}
							onPress={() => router.push(`/workout/exercise/${workoutExercise.id}`)}
							onLayout={(e) => { itemLayoutsRef.current[workoutExercise.id] = e.nativeEvent.layout.y; }}
							className="active:opacity-70"
							disabled={isDone}
						>
							<View
								className="flex-row items-center gap-3 rounded-2xl px-4 py-4"
								style={{
									backgroundColor: palette.card.DEFAULT,
									opacity: isDone ? 0.45 : 1,
									borderWidth: isCurrent ? 1.5 : 0,
									borderColor: palette.primary.DEFAULT,
								}}
							>
								<View
									className="w-9 h-9 rounded-full items-center justify-center"
									style={{
										backgroundColor: isDone
											? `${palette.primary.DEFAULT}26`
											: isCurrent
												? `${palette.primary.DEFAULT}20`
												: palette.muted.DEFAULT,
									}}
								>
									<Ionicons
										name={isDone ? "checkmark" : icon}
										size={18}
										color={isDone || isCurrent ? palette.primary.DEFAULT : palette.muted.foreground}
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
										color={isCurrent ? palette.primary.DEFAULT : palette.muted.foreground}
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
