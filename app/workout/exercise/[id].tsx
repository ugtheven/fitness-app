import { Ionicons } from "@expo/vector-icons";
import { and, eq, ne, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Circle, Svg } from "react-native-svg";
import { Button } from "../../../components/Button";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { db } from "../../../db";
import {
	sessionExercises,
	sessions,
	workoutExercises,
	workoutSessions,
	workoutSets,
} from "../../../db/schema";
import { EXERCISE_VARIANTS_BY_ID } from "../../../lib/exerciseVariants";
import { palette } from "../../../lib/palette";
import { glass, radius, typography } from "../../../lib/tokens";
import { useUnits } from "../../../lib/units";
import { useSessionTimer } from "../../../lib/useSessionTimer";
import { type PrefillSet, getExercisePR, getLastSets } from "../../../lib/workoutHistory";

export default function ExerciseScreen() {
	const { t } = useTranslation();
	const { displayWeight, toStorageWeight, weightUnit, weightStep } = useUnits();
	const { id } = useLocalSearchParams<{ id: string }>();
	const workoutExerciseId = Number(id);
	const router = useRouter();

	const [reps, setReps] = useState(10);
	const [repsLeft, setRepsLeft] = useState(10);
	const [repsRight, setRepsRight] = useState(10);
	const [unilateralSide, setUnilateralSide] = useState<"left" | "right">("left");
	const [weight, setWeight] = useState(0);
	const [showWeightInput, setShowWeightInput] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isResting, setIsResting] = useState(false);
	const [restSecondsLeft, setRestSecondsLeft] = useState(0);
	const [restTotalTime, setRestTotalTime] = useState(90);
	const [restNextSet, setRestNextSet] = useState(1);
	const [isPrefillLoading, setIsPrefillLoading] = useState(true);
	const [newPRWeight, setNewPRWeight] = useState<number | null>(null);
	const [undoSetId, setUndoSetId] = useState<number | null>(null);

	const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const prTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hasInitializedRef = useRef(false);
	const prefillSetsRef = useRef<PrefillSet[]>([]);
	const prMaxRef = useRef<number | null>(null);

	const { data: exerciseData } = useLiveQuery(
		db
			.select({
				workoutExercise: workoutExercises,
				sessionExercise: sessionExercises,
				workoutSession: workoutSessions,
				session: sessions,
			})
			.from(workoutExercises)
			.leftJoin(sessionExercises, eq(workoutExercises.sessionExerciseId, sessionExercises.id))
			.innerJoin(workoutSessions, eq(workoutExercises.workoutSessionId, workoutSessions.id))
			.leftJoin(sessions, eq(workoutSessions.sessionId, sessions.id))
			.where(eq(workoutExercises.id, workoutExerciseId))
	);
	const exerciseRow = exerciseData?.[0];

	const { data: completedSets = [] } = useLiveQuery(
		db
			.select()
			.from(workoutSets)
			.where(eq(workoutSets.workoutExerciseId, workoutExerciseId))
			.orderBy(workoutSets.setIndex)
	);

	// Init reps & weight from last workout (prefill) or template (fallback)
	useEffect(() => {
		if (!exerciseRow || hasInitializedRef.current) return;
		hasInitializedRef.current = true;

		const variantId = exerciseRow.workoutExercise.exerciseVariantId;
		const templateReps =
			exerciseRow.sessionExercise?.reps ?? exerciseRow.workoutExercise.prescribedReps;
		const templateWeight = exerciseRow.sessionExercise?.defaultWeight ?? 0;
		const v = EXERCISE_VARIANTS_BY_ID[variantId];
		const isBodyweight = v?.equipment === "bodyweight";

		getExercisePR(variantId).then((pr) => {
			prMaxRef.current = pr?.maxWeight ?? null;
		});

		getLastSets(variantId).then((prefillSets) => {
			prefillSetsRef.current = prefillSets;

			// Use first prefill set if available, otherwise fall back to template
			const first = prefillSets[0];
			if (first) {
				const initReps = first.reps ?? templateReps;
				const initWeight = first.weight ?? templateWeight;
				setReps(initReps);
				setRepsLeft(first.repsLeft ?? initReps);
				setRepsRight(first.repsRight ?? initReps);
				setWeight(displayWeight(initWeight));
				setShowWeightInput(!isBodyweight || initWeight > 0);
			} else {
				setReps(templateReps);
				setRepsLeft(templateReps);
				setRepsRight(templateReps);
				setWeight(displayWeight(templateWeight));
				setShowWeightInput(!isBodyweight || templateWeight > 0);
			}
			setIsPrefillLoading(false);
		});
	}, [exerciseRow, displayWeight]);

	// Rest countdown
	useEffect(() => {
		if (!isResting) return;

		restIntervalRef.current = setInterval(() => {
			setRestSecondsLeft((prev) => {
				if (prev <= 1) {
					if (restIntervalRef.current) clearInterval(restIntervalRef.current);
					setIsResting(false);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => {
			if (restIntervalRef.current) clearInterval(restIntervalRef.current);
		};
	}, [isResting]);

	const timerLabel = useSessionTimer(exerciseRow?.workoutSession?.startedAt);

	if (!exerciseRow || isPrefillLoading) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center" edges={["top"]}>
				<ActivityIndicator size="large" color={palette.accent.DEFAULT} />
			</SafeAreaView>
		);
	}

	const { workoutExercise } = exerciseRow;
	const totalSets = workoutExercise.prescribedSets;
	const prescribedReps = workoutExercise.prescribedReps;
	const restTime = workoutExercise.prescribedRestTime;
	const doneSets = completedSets.length;
	const currentSet = doneSets + 1;

	const isUnilateral = workoutExercise.isUnilateral;
	const variant = EXERCISE_VARIANTS_BY_ID[workoutExercise.exerciseVariantId];
	const name = variant ? t(`exercises.names.${variant.id}`) : workoutExercise.exerciseVariantId;

	const restMinutes = Math.floor(restSecondsLeft / 60);
	const restSeconds = restSecondsLeft % 60;
	const restTimerLabel = `${String(restMinutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`;

	function skipRest() {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		if (restIntervalRef.current) clearInterval(restIntervalRef.current);
		setIsResting(false);
	}

	function addRestTime() {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setRestSecondsLeft((v) => v + 30);
		setRestTotalTime((v) => v + 30);
	}

	function applyPrefill(p: PrefillSet) {
		const tplReps = exerciseRow?.sessionExercise?.reps ?? workoutExercise.prescribedReps;
		setReps(p.reps ?? tplReps);
		setRepsLeft(p.repsLeft ?? p.reps ?? tplReps);
		setRepsRight(p.repsRight ?? p.reps ?? tplReps);
		if (p.weight != null) setWeight(displayWeight(p.weight));
	}

	async function handleSaveSet() {
		if (isSaving) return;
		setIsSaving(true);
		try {
			// Unilateral: first press confirms left side → switch to right
			if (isUnilateral && unilateralSide === "left") {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
				setRepsRight(repsLeft);
				setUnilateralSide("right");
				return;
			}

			const nextDoneCount = doneSets + 1;
			const sessionWorkoutId = workoutExercise.workoutSessionId;
			const isLastSet = nextDoneCount >= totalSets;
			let sessionCompleted = false;
			let insertedSetId: number | null = null;

			await db.transaction(async (tx) => {
				const storageWeight = weight > 0 ? toStorageWeight(weight) : null;
				const [inserted] = await tx
					.insert(workoutSets)
					.values({
						workoutExerciseId,
						setIndex: doneSets,
						...(isUnilateral ? { repsLeft, repsRight } : { reps }),
						weight: storageWeight,
						completedAt: new Date().toISOString(),
					})
					.returning({ id: workoutSets.id });
				insertedSetId = inserted.id;

				if (isLastSet) {
					await tx
						.update(workoutExercises)
						.set({ status: "completed" })
						.where(eq(workoutExercises.id, workoutExerciseId));

					const [{ remaining }] = await tx
						.select({ remaining: sql<number>`count(*)` })
						.from(workoutExercises)
						.where(
							and(
								eq(workoutExercises.workoutSessionId, sessionWorkoutId),
								ne(workoutExercises.status, "completed")
							)
						);

					if (remaining === 0) {
						await tx
							.update(workoutSessions)
							.set({ status: "completed", endedAt: new Date().toISOString() })
							.where(eq(workoutSessions.id, sessionWorkoutId));
						sessionCompleted = true;
					}
				}
			});

			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

			// PR detection (compare in kg)
			const setWeightKg = weight > 0 ? toStorageWeight(weight) : null;
			if (setWeightKg != null && (prMaxRef.current == null || setWeightKg > prMaxRef.current)) {
				prMaxRef.current = setWeightKg;
				setNewPRWeight(setWeightKg);
				if (prTimerRef.current) clearTimeout(prTimerRef.current);
				prTimerRef.current = setTimeout(() => setNewPRWeight(null), 3000);
			}

			if (isLastSet) {
				// Clear any pending undo — the exercise/session is now finalized
				if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
				setUndoSetId(null);
				// Brief delay so the user sees the stepper fully green
				await new Promise((resolve) => setTimeout(resolve, 350));
				if (sessionCompleted) {
					router.replace(`/workout/summary/${sessionWorkoutId}`);
				} else {
					router.back();
				}
			} else {
				// Show undo toast for 5 seconds
				if (insertedSetId != null) {
					if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
					setUndoSetId(insertedSetId);
					undoTimerRef.current = setTimeout(() => setUndoSetId(null), 5000);
				}

				// Prefill next set values from history
				const nextSetIndex = doneSets + 1;
				const prefillSets = prefillSetsRef.current;
				const nextPrefill =
					prefillSets.length > 0
						? prefillSets[Math.min(nextSetIndex, prefillSets.length - 1)]
						: null;
				if (nextPrefill) {
					applyPrefill(nextPrefill);
				}

				setNewPRWeight(null);
				setUnilateralSide("left");
				if (restTime > 0) {
					setRestNextSet(doneSets + 2);
					setRestTotalTime(restTime);
					setRestSecondsLeft(restTime);
					setIsResting(true);
				}
			}
		} finally {
			setIsSaving(false);
		}
	}

	async function handleUndo() {
		if (undoSetId == null) return;
		await db.delete(workoutSets).where(eq(workoutSets.id, undoSetId));
		if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
		setUndoSetId(null);
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
	}

	const timerPill = (
		<View
			className="px-3 py-1.5"
			style={{
				backgroundColor: palette.accent.muted,
				borderWidth: 1,
				borderColor: palette.accent.border,
				borderRadius: radius.md,
			}}
		>
			<Text className="text-sm font-bold tabular-nums" style={{ color: palette.accent.DEFAULT }}>
				{timerLabel}
			</Text>
		</View>
	);

	const isCompleted = doneSets >= totalSets;

	if (isCompleted) {
		return (
			<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
				<ScreenHeader
					title={name}
					subtitle={t("workout.setProgress", { current: totalSets, total: totalSets })}
					onBack={() => router.back()}
					action={timerPill}
				/>
				<ScrollView
					className="flex-1 px-6"
					contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, gap: 8 }}
				>
					{/* All-green stepper */}
					<View className="flex-row gap-2 mb-4">
						{Array.from({ length: totalSets }, (_, i) => (
							<AnimatedSegment key={`set-${i}`} state="done" />
						))}
					</View>
					{completedSets.map((s) => (
						<View
							key={s.id}
							className="flex-row items-center justify-between px-4 py-3"
							style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
						>
							<Text className="text-sm font-semibold text-foreground">Set {s.setIndex + 1}</Text>
							<View className="flex-row items-center gap-3">
								{s.reps != null && (
									<Text className="text-sm" style={{ color: palette.muted.foreground }}>
										{s.reps} reps
									</Text>
								)}
								{s.repsLeft != null && s.repsRight != null && (
									<Text className="text-sm" style={{ color: palette.muted.foreground }}>
										{s.repsLeft}L / {s.repsRight}R
									</Text>
								)}
								{s.weight != null && (
									<Text className="text-sm font-semibold" style={{ color: palette.accent.DEFAULT }}>
										{displayWeight(s.weight)} {weightUnit}
									</Text>
								)}
							</View>
						</View>
					))}
				</ScrollView>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader
				title={name}
				subtitle={t("workout.setProgress", { current: currentSet, total: totalSets })}
				onBack={() => router.back()}
				action={timerPill}
			/>

			<View className="flex-1">
				{/* Segmented bar stepper + X/Y label */}
				<View className="flex-row items-center gap-3 px-6 pt-2 pb-4">
					<View className="flex-1 flex-row gap-2">
						{Array.from({ length: totalSets }, (_, i) => i).map((i) => (
							<AnimatedSegment
								key={`set-${i}`}
								state={i < doneSets ? "done" : i === doneSets ? "current" : "pending"}
							/>
						))}
					</View>
					<Text
						className="text-xs font-semibold tabular-nums"
						style={{ color: palette.muted.foreground }}
					>
						{currentSet}/{totalSets}
					</Text>
				</View>

				{/* Cards — centrées verticalement */}
				<View className="flex-1 justify-center px-6 gap-6">
					{isUnilateral ? (
						<>
							{/* L / R side indicator */}
							<View className="flex-row gap-3 justify-center">
								{(["left", "right"] as const).map((side) => {
									const isDone = side === "left" && unilateralSide === "right";
									const isActive = side === unilateralSide;
									return (
										<View
											key={side}
											className="flex-row items-center gap-1.5 px-4 py-2"
											style={{
												borderRadius: radius.md,
												backgroundColor: isDone
													? palette.accent.muted
													: isActive
														? palette.accent.muted
														: palette.muted.DEFAULT,
												borderWidth: isActive ? 1 : 0,
												borderColor: palette.accent.DEFAULT,
											}}
										>
											{isDone && (
												<Ionicons name="checkmark" size={14} color={palette.accent.DEFAULT} />
											)}
											<Text
												className="text-sm font-semibold"
												style={{
													color:
														isActive || isDone ? palette.accent.DEFAULT : palette.muted.foreground,
												}}
											>
												{side === "left" ? t("workout.repsLeft") : t("workout.repsRight")}
											</Text>
										</View>
									);
								})}
							</View>
							<ValueCard
								label={unilateralSide === "left" ? t("workout.repsLeft") : t("workout.repsRight")}
								value={unilateralSide === "left" ? repsLeft : repsRight}
								targetLabel={t("workout.target", { value: prescribedReps })}
								onDecrement={() =>
									unilateralSide === "left"
										? setRepsLeft((v) => Math.max(1, v - 1))
										: setRepsRight((v) => Math.max(1, v - 1))
								}
								onIncrement={() =>
									unilateralSide === "left" ? setRepsLeft((v) => v + 1) : setRepsRight((v) => v + 1)
								}
							/>
						</>
					) : (
						<ValueCard
							label={t("workout.reps")}
							value={reps}
							target={prescribedReps}
							targetLabel={t("workout.target", { value: prescribedReps })}
							onDecrement={() => setReps((v) => Math.max(1, v - 1))}
							onIncrement={() => setReps((v) => v + 1)}
						/>
					)}

					{showWeightInput ? (
						<WeightCard
							label={`${t("workout.weight")} (${weightUnit})`}
							value={weight}
							step={weightStep}
							onDecrement={() =>
								setWeight((v) => Math.max(0, Math.round((v - weightStep) * 10) / 10))
							}
							onIncrement={() => setWeight((v) => Math.round((v + weightStep) * 10) / 10)}
							onQuickChange={(delta) =>
								setWeight((v) => Math.max(0, Math.round((v + delta) * 10) / 10))
							}
							onDismiss={() => {
								setShowWeightInput(false);
								setWeight(0);
							}}
						/>
					) : (
						<Pressable
							onPress={() => setShowWeightInput(true)}
							className="items-center justify-center active:opacity-70"
							style={{ backgroundColor: palette.card.DEFAULT, height: 56, borderRadius: radius.lg }}
						>
							<Text className="text-sm font-medium" style={{ color: palette.muted.foreground }}>
								+ {t("workout.addWeight")}
							</Text>
						</Pressable>
					)}
				</View>

				{/* PR badge */}
				{newPRWeight != null && (
					<PRBadge
						label={t("pr.newRecord", { weight: displayWeight(newPRWeight), unit: weightUnit })}
					/>
				)}

				{/* Undo toast */}
				{undoSetId != null && (
					<Animated.View
						entering={FadeIn.duration(200)}
						className="mx-6 px-4 py-3 flex-row items-center justify-between"
						style={{ backgroundColor: palette.muted.DEFAULT, borderRadius: radius.lg }}
					>
						<Text className="text-sm" style={{ color: palette.foreground }}>
							{t("workout.setLogged")}
						</Text>
						<Pressable onPress={handleUndo} className="active:opacity-70">
							<Text className="text-sm font-bold" style={{ color: palette.accent.DEFAULT }}>
								{t("workout.undo")}
							</Text>
						</Pressable>
					</Animated.View>
				)}

				{/* Bouton fixe en bas */}
				<View className="px-6 pb-6 pt-4">
					<Button
						variant="glow"
						fullWidth
						label={
							isUnilateral && unilateralSide === "left"
								? t("workout.validateLeft")
								: t("workout.validateSet", { set: currentSet })
						}
						onPress={handleSaveSet}
						loading={isSaving}
					/>
					{isUnilateral && unilateralSide === "left" && (
						<Text className="text-xs text-center mt-2" style={{ color: palette.muted.foreground }}>
							{t("workout.thenRightSide")}
						</Text>
					)}
				</View>
			</View>

			{/* Rest overlay — couvre tout l'écran y compris le header */}
			{isResting && (
				<BlurView style={StyleSheet.absoluteFillObject} intensity={glass.blurModal} tint="dark">
					<View className="flex-1 items-center justify-center gap-8 px-6">
						<View className="items-center gap-2">
							<Text className="text-base font-semibold" style={{ color: palette.muted.foreground }}>
								{name}
							</Text>
							<Text className="text-sm" style={{ color: palette.muted.foreground }}>
								{t("workout.nextSet")} ·{" "}
								{t("workout.setProgress", { current: restNextSet, total: totalSets })}
							</Text>
						</View>

						<RestRing
							secondsLeft={restSecondsLeft}
							totalSeconds={restTotalTime}
							label={restTimerLabel}
							sublabel={t("workout.rest")}
						/>

						<View className="flex-row items-center gap-6">
							<Pressable onPress={addRestTime} className="active:opacity-70 px-5 py-3">
								<Text className="text-base font-semibold" style={{ color: palette.accent.DEFAULT }}>
									+30s
								</Text>
							</Pressable>
							<Pressable onPress={skipRest} className="active:opacity-70 px-5 py-3">
								<Text
									className="text-base font-semibold"
									style={{ color: palette.muted.foreground }}
								>
									{t("common.skip")}
								</Text>
							</Pressable>
						</View>
					</View>
				</BlurView>
			)}
		</SafeAreaView>
	);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AnimatedSegment({ state }: { state: "done" | "current" | "pending" }) {
	const targetColor =
		state === "done"
			? palette.accent.DEFAULT
			: state === "current"
				? palette.foreground
				: palette.muted.DEFAULT;
	const style = useAnimatedStyle(() => ({
		backgroundColor: withTiming(targetColor, { duration: 300 }),
	}));
	return <Animated.View className="flex-1 rounded-full" style={[{ height: 6 }, style]} />;
}

const RING_SIZE = 240;
const RING_RADIUS = 100;
const RING_STROKE = 12;
const RING_CENTER = RING_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function RestRing({
	secondsLeft,
	totalSeconds,
	label,
	sublabel,
}: { secondsLeft: number; totalSeconds: number; label: string; sublabel: string }) {
	const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
	const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

	return (
		<View style={{ width: RING_SIZE, height: RING_SIZE }}>
			<Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: "-90deg" }] }}>
				{/* Track */}
				<Circle
					cx={RING_CENTER}
					cy={RING_CENTER}
					r={RING_RADIUS}
					stroke={palette.muted.DEFAULT}
					strokeWidth={RING_STROKE}
					fill="none"
				/>
				{/* Progress */}
				<Circle
					cx={RING_CENTER}
					cy={RING_CENTER}
					r={RING_RADIUS}
					stroke={palette.accent.DEFAULT}
					strokeWidth={RING_STROKE}
					fill="none"
					strokeDasharray={CIRCUMFERENCE}
					strokeDashoffset={strokeDashoffset}
					strokeLinecap="round"
				/>
			</Svg>
			{/* Timer label centered */}
			<View style={StyleSheet.absoluteFillObject} className="items-center justify-center">
				<Text
					className="font-bold tabular-nums"
					style={{ ...typography.displayMd, color: palette.foreground }}
				>
					{label}
				</Text>
				<Text className="text-xs font-medium mt-1" style={{ color: palette.muted.foreground }}>
					{sublabel}
				</Text>
			</View>
		</View>
	);
}

type CircleButtonProps = {
	symbol: string;
	variant: "muted" | "primary";
	onPress: () => void;
};

function CircleButton({ symbol, variant, onPress }: CircleButtonProps) {
	const bg = variant === "primary" ? palette.accent.muted : palette.muted.DEFAULT;
	const color = variant === "primary" ? palette.accent.DEFAULT : palette.foreground;
	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onPress();
			}}
			className="items-center justify-center rounded-full active:opacity-50"
			style={{ width: 56, height: 56, backgroundColor: bg }}
		>
			<Text style={{ fontSize: 28, color, lineHeight: 34 }}>{symbol}</Text>
		</Pressable>
	);
}

type ValueCardProps = {
	label: string;
	value: number;
	target?: number;
	targetLabel?: string;
	onDecrement: () => void;
	onIncrement: () => void;
};

function ValueCard({
	label,
	value,
	target,
	targetLabel,
	onDecrement,
	onIncrement,
}: ValueCardProps) {
	return (
		<View
			className="px-6 py-5"
			style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
		>
			<Text
				className="text-xs font-semibold text-center tracking-widest mb-4"
				style={{ color: palette.muted.foreground }}
			>
				{label}
			</Text>
			<View className="flex-row items-center justify-between">
				<CircleButton symbol="−" variant="muted" onPress={onDecrement} />
				<Text className="font-bold" style={{ ...typography.displayLg, color: palette.foreground }}>
					{value}
				</Text>
				<CircleButton symbol="+" variant="primary" onPress={onIncrement} />
			</View>
			{targetLabel !== undefined && (
				<Text className="text-xs text-center mt-3" style={{ color: palette.muted.foreground }}>
					{targetLabel}
				</Text>
			)}
		</View>
	);
}

function PRBadge({ label }: { label: string }) {
	return (
		<Animated.View
			entering={FadeIn.duration(300)}
			className="mx-6 px-4 py-3 flex-row items-center justify-center gap-2"
			style={{
				backgroundColor: palette.accent.muted,
				borderWidth: 1,
				borderColor: palette.accent.border,
				borderRadius: radius.lg,
			}}
		>
			<Ionicons name="flash" size={16} color={palette.accent.DEFAULT} />
			<Text className="text-sm font-bold" style={{ color: palette.accent.DEFAULT }}>
				{label}
			</Text>
		</Animated.View>
	);
}

type WeightCardProps = {
	label: string;
	value: number;
	step: number;
	onDecrement: () => void;
	onIncrement: () => void;
	onQuickChange: (delta: number) => void;
	onDismiss: () => void;
};

function WeightCard({
	label,
	value,
	step,
	onDecrement,
	onIncrement,
	onQuickChange,
	onDismiss,
}: WeightCardProps) {
	const quickDeltas = [-step * 2, -step, step, step * 2];
	return (
		<View
			className="px-6 py-5"
			style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
		>
			<Text
				className="text-xs font-semibold text-center tracking-widest mb-4"
				style={{ color: palette.muted.foreground }}
			>
				{label}
			</Text>
			<View className="flex-row items-center justify-between">
				<CircleButton symbol="−" variant="muted" onPress={onDecrement} />
				<Text className="font-bold" style={{ ...typography.displayLg, color: palette.foreground }}>
					{value}
				</Text>
				<CircleButton symbol="+" variant="primary" onPress={onIncrement} />
			</View>
			<View className="flex-row gap-2 mt-4">
				{quickDeltas.map((delta) => {
					const isPositive = delta > 0;
					const isDisabled = !isPositive && value + delta < 0;
					return (
						<Pressable
							key={delta}
							onPress={() => onQuickChange(delta)}
							disabled={isDisabled}
							className="flex-1 items-center justify-center py-2 active:opacity-60"
							style={{
								borderRadius: radius.md,
								backgroundColor: isPositive ? palette.accent.muted : palette.muted.DEFAULT,
								opacity: isDisabled ? 0.3 : 1,
							}}
						>
							<Text
								className="text-xs font-semibold"
								style={{ color: isPositive ? palette.accent.DEFAULT : palette.muted.foreground }}
							>
								{isPositive ? `+${delta}` : delta}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}
