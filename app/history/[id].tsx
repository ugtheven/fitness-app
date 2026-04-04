import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomDrawer } from "../../components/BottomDrawer";
import { ScreenHeader } from "../../components/ScreenHeader";
import { db } from "../../db";
import { workoutSessions } from "../../db/schema";
import type { Equipment } from "../../lib/exerciseTypes";
import { EXERCISE_VARIANTS_BY_ID } from "../../lib/exerciseVariants";
import { palette } from "../../lib/palette";
import { borders, radius, typography } from "../../lib/tokens";
import { useUnits } from "../../lib/units";
import {
	getExerciseHistoryDetailed,
	getExercisePR,
	getExerciseTotalSets,
	getSessionPRs,
	getWorkoutDetail,
} from "../../lib/workoutHistory";

// --- Helpers ---

function formatDate(dateStr: string): string {
	const d = new Date(dateStr);
	return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

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

function formatSetLine(
	set: {
		reps: number | null;
		repsLeft: number | null;
		repsRight: number | null;
		weight: number | null;
	},
	isUnilateral: boolean,
	displayWeight: (kg: number) => number,
	weightUnit: string
): string {
	const repsStr = isUnilateral
		? `${set.repsLeft ?? 0}L / ${set.repsRight ?? 0}R`
		: `${set.reps ?? 0}`;
	if (set.weight != null && set.weight > 0) {
		return `${repsStr} × ${displayWeight(set.weight)} ${weightUnit}`;
	}
	return `${repsStr} reps`;
}

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

function computeVolume(exercises: Awaited<ReturnType<typeof getWorkoutDetail>>): number {
	let total = 0;
	for (const ex of exercises) {
		for (const set of ex.sets) {
			const reps = set.reps ?? (set.repsLeft ?? 0) + (set.repsRight ?? 0);
			total += reps * (set.weight ?? 0);
		}
	}
	return total;
}

// --- Types ---

type ExerciseHistorySheet = {
	exerciseVariantId: string;
	name: string;
};

// --- Screen ---

export default function WorkoutDetailScreen() {
	const { t } = useTranslation();
	const { displayWeight, weightUnit } = useUnits();
	const { id } = useLocalSearchParams<{ id: string }>();
	const workoutSessionId = Number(id);
	const router = useRouter();

	const [isLoading, setIsLoading] = useState(true);
	const [sessionName, setSessionName] = useState<string | null>(null);
	const [startedAt, setStartedAt] = useState<string>("");
	const [endedAt, setEndedAt] = useState<string | null>(null);
	const [exercises, setExercises] = useState<Awaited<ReturnType<typeof getWorkoutDetail>>>([]);
	const [prMap, setPrMap] = useState<
		Map<string, { newWeight: number; previousWeight: number | null }>
	>(new Map());

	// Exercise history sheet state
	const [historySheet, setHistorySheet] = useState<ExerciseHistorySheet | null>(null);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [historyPR, setHistoryPR] = useState<number | null>(null);
	const [historyTotalSets, setHistoryTotalSets] = useState(0);
	const [historySessions, setHistorySessions] = useState<
		Awaited<ReturnType<typeof getExerciseHistoryDetailed>>
	>([]);

	useEffect(() => {
		async function load() {
			const [sessionData] = await db
				.select()
				.from(workoutSessions)
				.where(eq(workoutSessions.id, workoutSessionId));

			if (sessionData) {
				setSessionName(sessionData.sessionName);
				setStartedAt(sessionData.startedAt);
				setEndedAt(sessionData.endedAt);
			}

			const [detail, prs] = await Promise.all([
				getWorkoutDetail(workoutSessionId),
				getSessionPRs(workoutSessionId),
			]);
			setExercises(detail);
			const map = new Map<string, { newWeight: number; previousWeight: number | null }>();
			for (const pr of prs) {
				map.set(pr.exerciseVariantId, {
					newWeight: pr.newWeight,
					previousWeight: pr.previousWeight,
				});
			}
			setPrMap(map);
			setIsLoading(false);
		}
		load();
	}, [workoutSessionId]);

	async function openHistorySheet(exerciseVariantId: string, name: string) {
		setHistorySheet({ exerciseVariantId, name });
		setHistoryLoading(true);

		const [pr, totalSets, sessions] = await Promise.all([
			getExercisePR(exerciseVariantId),
			getExerciseTotalSets(exerciseVariantId),
			getExerciseHistoryDetailed(exerciseVariantId),
		]);

		setHistoryPR(pr?.maxWeight ?? null);
		setHistoryTotalSets(totalSets);
		setHistorySessions(sessions);
		setHistoryLoading(false);
	}

	if (isLoading) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center" edges={["top"]}>
				<ActivityIndicator size="large" color={palette.accent.DEFAULT} />
			</SafeAreaView>
		);
	}

	const totalVolume = computeVolume(exercises);
	const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
	const volumeLabel =
		totalVolume > 0 ? `${Math.round(displayWeight(totalVolume))} ${weightUnit}` : "—";

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader
				title={sessionName ?? t("activity.deletedSession")}
				subtitle={
					startedAt ? `${formatDate(startedAt)} · ${formatDuration(startedAt, endedAt)}` : undefined
				}
				onBack={() => router.back()}
			/>

			<ScrollView
				className="flex-1 px-6"
				contentContainerStyle={{ paddingTop: 4, paddingBottom: 24, gap: 12 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Stats row */}
				<View className="flex-row gap-3 mb-2">
					<StatPill label={t("workout.totalExercises")} value={String(exercises.length)} />
					<StatPill label={t("workout.totalSets")} value={String(totalSets)} />
					<StatPill label={t("workout.volume")} value={volumeLabel} />
				</View>

				{/* Exercise list */}
				{exercises.map((ex) => {
					const variant = EXERCISE_VARIANTS_BY_ID[ex.exerciseVariantId];
					const name = variant ? t(`exercises.names.${variant.id}`) : ex.exerciseVariantId;
					const icon = variant ? equipmentIcon(variant.equipment) : "barbell-outline";
					const pr = prMap.get(ex.exerciseVariantId);

					return (
						<Pressable
							key={ex.id}
							onPress={() => openHistorySheet(ex.exerciseVariantId, name)}
							className="active:opacity-70"
						>
							<View
								className="px-5 py-4"
								style={{
									backgroundColor: palette.card.DEFAULT,
									borderRadius: radius.lg,
									borderWidth: pr ? borders.thin : 0,
									borderColor: palette.accent.border,
								}}
							>
								<View className="flex-row items-center gap-3 mb-3">
									<View
										className="w-8 h-8 rounded-full items-center justify-center"
										style={{ backgroundColor: pr ? palette.accent.muted : palette.muted.DEFAULT }}
									>
										<Ionicons
											name={pr ? "flash" : icon}
											size={16}
											color={pr ? palette.accent.DEFAULT : palette.muted.foreground}
										/>
									</View>
									<Text
										className="flex-1 text-base font-semibold text-foreground"
										numberOfLines={1}
									>
										{name}
									</Text>
									<Ionicons name="chevron-forward" size={18} color={palette.muted.foreground} />
								</View>

								{/* PR badge */}
								{pr && (
									<View
										className="flex-row items-center gap-2 px-3 py-2 mb-3 ml-11"
										style={{ backgroundColor: palette.accent.muted, borderRadius: radius.md }}
									>
										<Text className="text-xs font-bold" style={{ color: palette.accent.DEFAULT }}>
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
								)}

								{/* Sets */}
								<View className="gap-1.5 pl-11">
									{ex.sets.map((set, i) => (
										<View key={`${ex.id}-${set.setIndex}`} className="flex-row items-center gap-2">
											<Text
												className="text-xs font-semibold w-5"
												style={{ color: palette.muted.foreground }}
											>
												{i + 1}
											</Text>
											<Text className="text-sm text-foreground">
												{formatSetLine(set, ex.isUnilateral, displayWeight, weightUnit)}
											</Text>
										</View>
									))}
									{ex.sets.length === 0 && (
										<Text className="text-xs" style={{ color: palette.muted.foreground }}>
											—
										</Text>
									)}
								</View>
							</View>
						</Pressable>
					);
				})}
			</ScrollView>

			{/* Exercise history bottom sheet */}
			<BottomDrawer
				visible={historySheet != null}
				onClose={() => setHistorySheet(null)}
				title={historySheet?.name ?? t("exerciseHistory.title")}
			>
				{historyLoading ? (
					<View className="items-center py-8">
						<ActivityIndicator size="small" color={palette.accent.DEFAULT} />
					</View>
				) : (
					<View className="gap-5">
						{/* Stats */}
						<View className="flex-row gap-3">
							{historyPR != null && (
								<StatPill
									label={t("exerciseHistory.maxWeight")}
									value={`${displayWeight(historyPR)} ${weightUnit}`}
								/>
							)}
							<StatPill label={t("exerciseHistory.totalSets")} value={String(historyTotalSets)} />
						</View>

						{/* Session history */}
						{historySessions.length === 0 ? (
							<Text
								className="text-sm text-center py-4"
								style={{ color: palette.muted.foreground }}
							>
								{t("exerciseHistory.noHistory")}
							</Text>
						) : (
							<View className="gap-4">
								{historySessions.map((session, idx) => (
									<View key={`${session.startedAt}-${idx}`}>
										<Text
											className="text-xs font-semibold mb-2"
											style={{ color: palette.muted.foreground }}
										>
											{formatDate(session.startedAt)}
										</Text>
										<View className="gap-1">
											{session.sets.map((set, i) => (
												<View
													key={`${session.startedAt}-${i}`}
													className="flex-row items-center gap-2"
												>
													<Text
														className="text-xs font-semibold w-5"
														style={{ color: palette.muted.foreground }}
													>
														{i + 1}
													</Text>
													<Text className="text-sm text-foreground">
														{formatSetLine(set, set.isUnilateral, displayWeight, weightUnit)}
													</Text>
												</View>
											))}
										</View>
									</View>
								))}
							</View>
						)}
					</View>
				)}
			</BottomDrawer>
		</SafeAreaView>
	);
}

// --- Sub-components ---

function StatPill({ label, value }: { label: string; value: string }) {
	return (
		<View
			className="flex-1 items-center py-3"
			style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
		>
			<Text className="font-bold text-foreground" style={{ fontSize: typography.statMd.fontSize }}>
				{value}
			</Text>
			<Text className="text-xs mt-0.5" style={{ color: palette.muted.foreground }}>
				{label}
			</Text>
		</View>
	);
}
