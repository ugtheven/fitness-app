import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { BottomDrawer } from "../../../components/BottomDrawer";
import { Button } from "../../../components/Button";
import { SearchField } from "../../../components/SearchField";
import { Chip } from "../../../components/Chip";
import { EmptyState } from "../../../components/EmptyState";
import { ExerciseCard } from "../../../components/ExerciseCard";
import { NumberField } from "../../../components/NumberField";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { db } from "../../../db";
import { sessionExercises, sessions } from "../../../db/schema";
import { EXERCISES, type Exercise, type MuscleGroup } from "../../../lib/exercises";
import { palette } from "../../../lib/palette";

export default function SessionScreen() {
	const { t } = useTranslation();
	const { id } = useLocalSearchParams<{ id: string }>();
	const sessionId = Number(id);

	const [drawerOpen, setDrawerOpen] = useState(false);
	const [step, setStep] = useState<1 | 2>(1);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [selected, setSelected] = useState<Exercise | null>(null);
	const [sets, setSets] = useState(3);
	const [reps, setReps] = useState(10);
	const [weight, setWeight] = useState(0);
	const [restTime, setRestTime] = useState(90);
	const [search, setSearch] = useState("");

	const { data: sessionData } = useLiveQuery(
		db.select().from(sessions).where(eq(sessions.id, sessionId)),
	);
	const session = sessionData?.[0];

	const { data: exerciseRows } = useLiveQuery(
		db.select().from(sessionExercises).where(eq(sessionExercises.sessionId, sessionId)),
	);

	function openDrawer() {
		setEditingId(null);
		setStep(1);
		setSelected(null);
		setSets(3);
		setReps(10);
		setWeight(0);
		setRestTime(90);
		setSearch("");
		setDrawerOpen(true);
	}

	function openEditDrawer(item: typeof sessionExercises.$inferSelect) {
		const exercise = EXERCISES.find((e) => e.nameKey === item.exerciseId) ?? null;
		setEditingId(item.id);
		setSelected(exercise);
		setSets(item.sets);
		setReps(item.reps);
		setWeight(item.defaultWeight ?? 0);
		setRestTime(item.restTime);
		setStep(2);
		setDrawerOpen(true);
	}

	function confirmDelete(itemId: number) {
		Alert.alert(
			t("exercises.deleteTitle"),
			t("exercises.deleteMessage"),
			[
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("common.delete"),
					style: "destructive",
					onPress: async () => {
						await db.delete(sessionExercises).where(eq(sessionExercises.id, itemId));
					},
				},
			],
		);
	}

	function pickExercise(exercise: Exercise) {
		setSelected(exercise);
		setStep(2);
	}

	async function handleAdd() {
		if (!selected) return;
		try {
			await db.insert(sessionExercises).values({
				sessionId,
				exerciseId: selected.nameKey,
				sets,
				reps,
				defaultWeight: weight > 0 ? weight : null,
				restTime,
			});
			setDrawerOpen(false);
		} catch (e) {
			console.error("Failed to add exercise:", e);
		}
	}

	async function handleUpdate() {
		if (!editingId) return;
		try {
			await db
				.update(sessionExercises)
				.set({ sets, reps, defaultWeight: weight > 0 ? weight : null, restTime })
				.where(eq(sessionExercises.id, editingId));
			setDrawerOpen(false);
		} catch (e) {
			console.error("Failed to update exercise:", e);
		}
	}

	if (!session) return null;

	const count = exerciseRows?.length ?? 0;

	const filteredExercises = EXERCISES.filter((e) =>
		t(`exercises.names.${e.nameKey}`).toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader
				title={session.name}
				subtitle={t("sessions.exerciseCount", { count })}
				onBack={() => router.back()}
				action={
					<Button
						label={t("common.add")}
						startIcon={<Ionicons name="add" size={20} color="white" />}
						onPress={openDrawer}
					/>
				}
			/>

			<View className="flex-1 px-6 pt-2">
				{count === 0 ? (
					<EmptyState message={t("exercises.empty")} hint={t("exercises.emptyHint")} />
				) : (
					<FlatList
						data={exerciseRows}
						keyExtractor={(item) => String(item.id)}
						contentContainerStyle={{ paddingTop: 8, gap: 12 }}
						showsVerticalScrollIndicator={false}
						renderItem={({ item }) => {
							const exercise = EXERCISES.find((e) => e.nameKey === item.exerciseId);
							const name = exercise
								? t(`exercises.names.${exercise.nameKey}`)
								: item.exerciseId;
							return (
								<ExerciseCard
									name={name}
									muscles={exercise?.muscles ?? []}
									sets={item.sets}
									reps={item.reps}
									defaultWeight={item.defaultWeight ?? null}
									restTime={item.restTime}
									onEdit={() => openEditDrawer(item)}
									onDelete={() => confirmDelete(item.id)}
								/>
							);
						}}
					/>
				)}
			</View>

			<BottomDrawer
				visible={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				onBack={step === 2 && !editingId ? () => setStep(1) : undefined}
				title={
					step === 1
						? t("exercises.addExercise")
						: (selected ? t(`exercises.names.${selected.nameKey}`) : t("exercises.configure"))
				}
			>
				{step === 1 ? (
					<View className="gap-3">
						<SearchField
						value={search}
						onChangeText={setSearch}
						placeholder={t("exercises.search")}
					/>
						<ScrollView showsVerticalScrollIndicator={false}>
							<View className="gap-2">
								{filteredExercises.map((exercise) => (
									<Pressable
										key={exercise.nameKey}
										onPress={() => pickExercise(exercise)}
										className="active:opacity-70"
									>
										<View className="flex-row items-center rounded-xl bg-background px-4 py-3">
											<View className="flex-1 gap-1.5">
												<Text className="text-base font-medium text-foreground">
													{t(`exercises.names.${exercise.nameKey}`)}
												</Text>
												<View className="flex-row flex-wrap gap-1">
													{exercise.muscles.map((m) => (
														<Chip key={m} label={t(`exercises.muscleGroups.${m}`)} />
													))}
												</View>
											</View>
											<Ionicons name="chevron-forward" size={16} color={palette.muted.foreground} />
										</View>
									</Pressable>
								))}
							</View>
						</ScrollView>
					</View>
				) : (
					<View className="gap-4">
						{selected && (
							<View className="rounded-2xl bg-background px-5 py-4">
								<Text className="text-base font-semibold text-foreground">
									{t(`exercises.names.${selected.nameKey}`)}
								</Text>
								<View className="mt-2 flex-row flex-wrap gap-1">
									{selected.muscles.map((m) => (
										<Chip key={m} label={t(`exercises.muscleGroups.${m}`)} />
									))}
								</View>
							</View>
						)}
						<View className="flex-row gap-3">
							<View className="flex-1">
								<NumberField label={t("exercises.sets")} value={sets} onValueChange={setSets} min={1} step={1} />
							</View>
							<View className="flex-1">
								<NumberField label={t("exercises.reps")} value={reps} onValueChange={setReps} min={1} step={1} />
							</View>
						</View>
						<NumberField
							label={t("exercises.defaultWeight")}
							value={weight}
							onValueChange={setWeight}
							min={0}
							step={2.5}
							endAdornment="kg"
						/>
						<NumberField
							label={t("exercises.rest")}
							value={restTime}
							onValueChange={setRestTime}
							min={0}
							step={15}
							endAdornment="s"
						/>
						<Button
							fullWidth
							label={editingId ? t("common.save") : t("exercises.addExercise")}
							onPress={editingId ? handleUpdate : handleAdd}
						/>
					</View>
				)}
			</BottomDrawer>
		</SafeAreaView>
	);
}
