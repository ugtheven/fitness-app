import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
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
import { SortableList } from "../../../components/SortableList";
import { db } from "../../../db";
import { sessionExercises, sessions } from "../../../db/schema";
import { EXERCISES, type Exercise, type ExerciseType, type MuscleGroup } from "../../../lib/exercises";
import { palette } from "../../../lib/palette";

type ExerciseRow = typeof sessionExercises.$inferSelect;

const TYPE_ICONS: Record<ExerciseType, React.ComponentProps<typeof Ionicons>["name"]> = {
	bodyweight: "body-outline",
	free_weight: "barbell-outline",
	machine: "cog-outline",
};

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
	const [typeFilter, setTypeFilter] = useState<ExerciseType | null>(null);

	const { data: sessionData } = useLiveQuery(
		db.select().from(sessions).where(eq(sessions.id, sessionId)),
	);
	const session = sessionData?.[0];

	const { data: exerciseRows = [] } = useLiveQuery(
		db.select().from(sessionExercises).where(eq(sessionExercises.sessionId, sessionId)).orderBy(sessionExercises.order),
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
		setTypeFilter(null);
		setDrawerOpen(true);
	}

	const openEditDrawer = useCallback((item: ExerciseRow) => {
		const exercise = EXERCISES.find((e) => e.nameKey === item.exerciseId) ?? null;
		setEditingId(item.id);
		setSelected(exercise);
		setSets(item.sets);
		setReps(item.reps);
		setWeight(item.defaultWeight ?? 0);
		setRestTime(item.restTime);
		setStep(2);
		setDrawerOpen(true);
	}, []);

	const confirmDelete = useCallback((itemId: number) => {
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
	}, [t]);

	function pickExercise(exercise: Exercise) {
		setSelected(exercise);
		setStep(2);
	}

	async function handleAdd() {
		if (!selected) return;
		try {
			const nextOrder = exerciseRows.length;
			await db.insert(sessionExercises).values({
				sessionId,
				exerciseId: selected.nameKey,
				order: nextOrder,
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

	async function handleReorder(newData: ExerciseRow[]) {
		try {
			await Promise.all(
				newData.map((row, index) =>
					db.update(sessionExercises).set({ order: index }).where(eq(sessionExercises.id, row.id)),
				),
			);
		} catch (e) {
			console.error("Failed to reorder exercises:", e);
		}
	}

	const renderItem = useCallback(
		({ item, isDragging }: { item: ExerciseRow; isDragging: boolean }) => {
			const exercise = EXERCISES.find((e) => e.nameKey === item.exerciseId);
			const name = exercise ? t(`exercises.names.${exercise.nameKey}`) : item.exerciseId;
			return (
				<ExerciseCard
					name={name}
					muscles={exercise?.muscles ?? []}
					sets={item.sets}
					reps={item.reps}
					defaultWeight={item.defaultWeight ?? null}
					restTime={item.restTime}
					isDragging={isDragging}
					onEdit={() => openEditDrawer(item)}
					onDelete={() => confirmDelete(item.id)}
				/>
			);
		},
		[t, openEditDrawer, confirmDelete],
	);

	if (!session) return null;

	const count = exerciseRows.length;

	const filteredExercises = EXERCISES.filter((e) => {
		const matchesSearch = t(`exercises.names.${e.nameKey}`).toLowerCase().includes(search.toLowerCase());
		const matchesType = typeFilter === null || e.type === typeFilter;
		return matchesSearch && matchesType;
	});

	const ALL_TYPES: ExerciseType[] = ["bodyweight", "free_weight", "machine"];

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader
				title={session.name}
				subtitle={t("sessions.exerciseCount", { count })}
				onBack={() => router.back()}
				action={
					<Button
						label={t("common.exercise")}
						startIcon={<Ionicons name="add" size={20} color="white" />}
						onPress={openDrawer}
					/>
				}
			/>

			<View className="flex-1 px-6 pt-2">
				{count === 0 ? (
					<EmptyState message={t("exercises.empty")} hint={t("exercises.emptyHint")} />
				) : (
					<SortableList
						data={exerciseRows}
						keyExtractor={(item) => String(item.id)}
						renderItem={renderItem}
						onReorder={handleReorder}
						estimatedItemHeight={100}
						itemGap={12}
						contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
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

						{/* Type filters */}
						<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
							<Pressable
								onPress={() => setTypeFilter(null)}
								className="active:opacity-70"
							>
								<View
									className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
									style={{
										backgroundColor: typeFilter === null ? palette.primary.DEFAULT : palette.muted.DEFAULT,
									}}
								>
									<Text
										className="text-xs font-semibold"
										style={{ color: typeFilter === null ? palette.primary.foreground : palette.muted.foreground }}
									>
										{t("exercises.exerciseTypes.all")}
									</Text>
								</View>
							</Pressable>
							{ALL_TYPES.map((type) => (
								<Pressable
									key={type}
									onPress={() => setTypeFilter(typeFilter === type ? null : type)}
									className="active:opacity-70"
								>
									<View
										className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
										style={{
											backgroundColor: typeFilter === type ? palette.primary.DEFAULT : palette.muted.DEFAULT,
										}}
									>
										<Ionicons
											name={TYPE_ICONS[type]}
											size={13}
											color={typeFilter === type ? palette.primary.foreground : palette.muted.foreground}
										/>
										<Text
											className="text-xs font-semibold"
											style={{ color: typeFilter === type ? palette.primary.foreground : palette.muted.foreground }}
										>
											{t(`exercises.exerciseTypes.${type}`)}
										</Text>
									</View>
								</Pressable>
							))}
						</ScrollView>

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
												<View className="flex-row items-center gap-2">
													<Text className="text-base font-medium text-foreground">
														{t(`exercises.names.${exercise.nameKey}`)}
													</Text>
													<View className="flex-row items-center gap-1 rounded-full bg-muted px-2 py-0.5">
														<Ionicons name={TYPE_ICONS[exercise.type]} size={11} color={palette.muted.foreground} />
														<Text className="text-xs text-muted-foreground">{t(`exercises.exerciseTypes.${exercise.type}`)}</Text>
													</View>
												</View>
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
								<View className="flex-row items-center gap-2">
									<Text className="text-base font-semibold text-foreground">
										{t(`exercises.names.${selected.nameKey}`)}
									</Text>
									<View className="flex-row items-center gap-1 rounded-full bg-muted px-2 py-0.5">
										<Ionicons name={TYPE_ICONS[selected.type]} size={11} color={palette.muted.foreground} />
										<Text className="text-xs text-muted-foreground">{t(`exercises.exerciseTypes.${selected.type}`)}</Text>
									</View>
								</View>
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
