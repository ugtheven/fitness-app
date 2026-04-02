import { Ionicons } from "@expo/vector-icons";
import { and, desc, eq, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomDrawer } from "../../components/BottomDrawer";
import { db } from "../../db";
import {
	programs,
	sessionExercises,
	sessions,
	workoutExercises,
	workoutSessions,
} from "../../db/schema";
import { palette } from "../../lib/palette";

export default function HomeScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const [drawerVisible, setDrawerVisible] = useState(false);
	const [launchingSessionId, setLaunchingSessionId] = useState<number | null>(null);

	const { data: activePrograms } = useLiveQuery(
		db.select().from(programs).where(eq(programs.isActive, true)).limit(1)
	);
	const activeProgram = activePrograms?.[0];

	const { data: programSessions } = useLiveQuery(
		db
			.select({
				sessions,
				exerciseCount: sql<number>`count(${sessionExercises.id})`,
			})
			.from(sessions)
			.innerJoin(programs, eq(sessions.programId, programs.id))
			.leftJoin(sessionExercises, eq(sessionExercises.sessionId, sessions.id))
			.where(eq(programs.isActive, true))
			.groupBy(sessions.id)
			.orderBy(sessions.order)
	);

	const sessionCount = programSessions?.length ?? 0;

	// Find the last completed workout for the active program to suggest the next session
	const { data: lastCompletedWorkouts } = useLiveQuery(
		db
			.select({ sessionId: workoutSessions.sessionId })
			.from(workoutSessions)
			.where(
				and(
					eq(workoutSessions.status, "completed"),
					eq(workoutSessions.programId, activeProgram?.id ?? -1),
				),
			)
			.orderBy(desc(workoutSessions.startedAt))
			.limit(1)
	);

	// Suggest next session in order (cycle back to first after last)
	const nextSession = (() => {
		if (!programSessions || programSessions.length === 0) return null;
		const lastSessionId = lastCompletedWorkouts?.[0]?.sessionId;
		if (lastSessionId == null) return programSessions[0];
		const lastIndex = programSessions.findIndex((s) => s.sessions.id === lastSessionId);
		if (lastIndex === -1) return programSessions[0];
		return programSessions[(lastIndex + 1) % programSessions.length];
	})();

	async function handleSessionSelect(sessionId: number) {
		if (launchingSessionId !== null) return;

		// Check for in-progress workout before overwriting
		const inProgress = await db
			.select({ id: workoutSessions.id })
			.from(workoutSessions)
			.where(eq(workoutSessions.status, "in_progress"))
			.limit(1);

		if (inProgress.length > 0) {
			Alert.alert(
				t("home.inProgressTitle"),
				t("home.inProgressMessage"),
				[
					{ text: t("common.cancel"), style: "cancel" },
					{
						text: t("home.startNew"),
						style: "destructive",
						onPress: () => launchSession(sessionId),
					},
				],
			);
			return;
		}

		launchSession(sessionId);
	}

	async function launchSession(sessionId: number) {
		setLaunchingSessionId(sessionId);
		try {
			const workoutSessionId = await db.transaction(async (tx) => {
				// Design choice: in-progress sessions are NOT resumable. Starting a new
				// session destroys any interrupted one (workoutExercises + workoutSets
				// are cascade-deleted). The user is warned via Alert before reaching here.
				await tx.delete(workoutSessions)
					.where(eq(workoutSessions.status, "in_progress"));

				// Read exercises inside the transaction for atomicity
				const exercises = await tx
					.select()
					.from(sessionExercises)
					.where(eq(sessionExercises.sessionId, sessionId))
					.orderBy(sessionExercises.order);

				if (exercises.length === 0) return "empty" as const;

				const nowDate = new Date();
				const now = nowDate.toISOString();
				const localDate = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, "0")}-${String(nowDate.getDate()).padStart(2, "0")}`;
				const [workoutSession] = await tx
					.insert(workoutSessions)
					.values({ sessionId, programId: activeProgram?.id ?? null, startedAt: now, date: localDate, status: "in_progress" })
					.returning();

				await tx.insert(workoutExercises).values(
					exercises.map((ex) => ({
						workoutSessionId: workoutSession.id,
						sessionExerciseId: ex.id,
						exerciseVariantId: ex.exerciseVariantId,
						isUnilateral: ex.isUnilateral,
						prescribedSets: ex.sets,
						prescribedReps: ex.reps,
						prescribedWeight: ex.defaultWeight ?? null,
						prescribedRestTime: ex.restTime,
						status: "pending" as const,
					}))
				);

				return workoutSession.id;
			});

			if (workoutSessionId === "empty") {
				Alert.alert(t("home.emptySessionTitle"), t("home.emptySessionMessage"));
				return;
			}
			if (workoutSessionId == null) return;

			setDrawerVisible(false);
			router.push(`/workout/${workoutSessionId}`);
		} finally {
			setLaunchingSessionId(null);
		}
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<View className="flex-1 px-6 pt-2">
				<Text className="text-2xl font-bold text-foreground">{t("tabs.home")}</Text>
			</View>

			{activeProgram ? (
				<View style={{ paddingHorizontal: 16, marginBottom: 112, gap: 10 }}>
					{/* Next session suggestion */}
					{nextSession && (
						<Pressable
							onPress={() => handleSessionSelect(nextSession.sessions.id)}
							className="active:opacity-80"
						>
							<View
								className="flex-row items-center gap-3 px-4 py-3"
								style={{
									backgroundColor: palette.card.DEFAULT,
									borderRadius: 18,
									borderWidth: 1.5,
									borderColor: palette.primary.DEFAULT,
								}}
							>
								<View
									className="rounded-xl p-2"
									style={{ backgroundColor: `${palette.primary.DEFAULT}26` }}
								>
									<Ionicons name="flash" size={18} color={palette.primary.DEFAULT} />
								</View>
								<View className="flex-1">
									<Text className="text-xs font-semibold" style={{ color: palette.primary.DEFAULT }}>
										{t("home.nextSession")} · {activeProgram.name}
									</Text>
									<Text className="text-base font-bold text-foreground">
										{nextSession.sessions.name}
									</Text>
								</View>
								{launchingSessionId === nextSession.sessions.id ? (
									<ActivityIndicator size="small" color={palette.primary.DEFAULT} />
								) : (
									<Ionicons name="chevron-forward" size={18} color={palette.primary.DEFAULT} />
								)}
							</View>
						</Pressable>
					)}

					{/* All sessions */}
					<Pressable
						onPress={() => setDrawerVisible(true)}
						className="active:opacity-80"
					>
						<View
							className="flex-row items-center justify-center gap-2 px-4 py-2.5"
							style={{
								backgroundColor: palette.muted.DEFAULT,
								borderRadius: 14,
							}}
						>
							<Text className="text-sm font-medium" style={{ color: palette.muted.foreground }}>
								{t("programs.sessionCount", { count: sessionCount })} · {t("programs.tapToStart")}
							</Text>
						</View>
					</Pressable>
				</View>
			) : (
				<View style={{ paddingHorizontal: 16, marginBottom: 112 }}>
					<View
						className="items-center gap-3 px-6 py-8"
						style={{
							backgroundColor: palette.card.DEFAULT,
							borderRadius: 18,
						}}
					>
						<Ionicons name="barbell-outline" size={32} color={palette.muted.foreground} />
						<Text className="text-base font-semibold" style={{ color: palette.muted.foreground }}>
							{t("home.emptyTitle")}
						</Text>
						<Text className="text-sm text-center" style={{ color: palette.muted.foreground }}>
							{t("home.emptyHint")}
						</Text>
						<Pressable
							onPress={() => router.push("/(tabs)/programs")}
							className="active:opacity-80 mt-1"
						>
							<View
								className="px-5 py-2.5 rounded-xl"
								style={{ backgroundColor: palette.primary.DEFAULT }}
							>
								<Text className="text-sm font-semibold text-foreground">
									{t("home.createProgram")}
								</Text>
							</View>
						</Pressable>
					</View>
				</View>
			)}

			<BottomDrawer
				visible={drawerVisible}
				onClose={() => setDrawerVisible(false)}
				title={t("sessions.chooseSession")}
			>
				<View className="gap-3">
					{programSessions?.map(({ sessions: session, exerciseCount }) => (
						<Pressable
							key={session.id}
							onPress={() => handleSessionSelect(session.id)}
							disabled={launchingSessionId !== null}
							className="active:opacity-70"
						>
							<View
								className="flex-row items-center gap-3 rounded-2xl px-4 py-4"
								style={{ backgroundColor: palette.muted.DEFAULT }}
							>
								<View className="flex-1">
									<Text className="text-base font-semibold text-foreground">
										{session.name}
									</Text>
									<Text className="text-xs mt-0.5" style={{ color: palette.muted.foreground }}>
										{t("sessions.exerciseCount", { count: exerciseCount })}
									</Text>
								</View>
								{launchingSessionId === session.id ? (
									<ActivityIndicator size="small" color={palette.primary.DEFAULT} />
								) : (
									<Ionicons name="chevron-forward" size={18} color={palette.muted.foreground} />
								)}
							</View>
						</Pressable>
					))}
				</View>
			</BottomDrawer>
		</SafeAreaView>
	);
}
