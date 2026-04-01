import { Ionicons } from "@expo/vector-icons";
import { eq, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
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

	async function handleSessionSelect(sessionId: number) {
		if (launchingSessionId !== null) return;
		setLaunchingSessionId(sessionId);
		try {
			const workoutSessionId = await db.transaction(async (tx) => {
				// Delete ALL interrupted sessions (not resumed — always start fresh)
				await tx.delete(workoutSessions)
					.where(eq(workoutSessions.status, "in_progress"));

				// Read exercises inside the transaction for atomicity
				const exercises = await tx
					.select()
					.from(sessionExercises)
					.where(eq(sessionExercises.sessionId, sessionId))
					.orderBy(sessionExercises.order);

				if (exercises.length === 0) return null;

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
						status: "pending" as const,
					}))
				);

				return workoutSession.id;
			});

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

			{activeProgram && (
				<Pressable
					onPress={() => setDrawerVisible(true)}
					className="active:opacity-80"
					style={{ paddingHorizontal: 16, marginBottom: 112 }}
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
							<Text className="text-base font-bold" style={{ color: palette.primary.DEFAULT }}>
								{activeProgram.name}
							</Text>
							<Text className="text-xs" style={{ color: palette.muted.foreground }}>
								{t("programs.sessionCount", { count: sessionCount })} · {t("programs.tapToStart")}
							</Text>
						</View>
						<Ionicons name="chevron-forward" size={18} color={palette.primary.DEFAULT} />
					</View>
				</Pressable>
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
