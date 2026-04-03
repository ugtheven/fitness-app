import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
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
import { EXERCISE_VARIANTS, EXERCISE_VARIANTS_BY_ID } from "../../../lib/exerciseVariants";
import { EXERCISE_BASES_BY_ID } from "../../../lib/exerciseBases";
import type { Equipment, ExerciseVariant } from "../../../lib/exerciseTypes";
import { palette } from "../../../lib/palette";
import { radius } from "../../../lib/tokens";
import { useUnits } from "../../../lib/units";

type ExerciseRow = typeof sessionExercises.$inferSelect;

const EQUIPMENT_ICONS: Record<Equipment, React.ComponentProps<typeof Ionicons>["name"]> = {
	bodyweight: "body-outline",
	dumbbell: "barbell-outline",
	barbell: "barbell-outline",
	cable: "hardware-chip-outline",
	machine: "hardware-chip-outline",
};

const ALL_EQUIPMENT: Equipment[] = ["bodyweight", "dumbbell", "barbell", "cable", "machine"];

export default function SessionScreen() {
	const { t } = useTranslation();
	const { weightUnit, displayWeight, toStorageWeight } = useUnits();
	const { id } = useLocalSearchParams<{ id: string }>();
	const sessionId = Number(id);

	const [drawerOpen, setDrawerOpen] = useState(false);
	const [step, setStep] = useState<1 | 2>(1);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [selected, setSelected] = useState<ExerciseVariant | null>(null);
	const [isUnilateral, setIsUnilateral] = useState(false);
	const [sets, setSets] = useState(3);
	const [reps, setReps] = useState(10);
	const [weight, setWeight] = useState(0);
	const [restTime, setRestTime] = useState(90);
	const [search, setSearch] = useState("");
	const [equipmentFilter, setEquipmentFilter] = useState<Equipment | null>(null);

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
		setIsUnilateral(false);
		setSets(3);
		setReps(10);
		setWeight(0);
		setRestTime(90);
		setSearch("");
		setEquipmentFilter(null);
		setDrawerOpen(true);
	}

	const openEditDrawer = useCallback((item: ExerciseRow) => {
		const variant = EXERCISE_VARIANTS_BY_ID[item.exerciseVariantId] ?? null;
		setEditingId(item.id);
		setSelected(variant);
		setIsUnilateral(item.isUnilateral);
		setSets(item.sets);
		setReps(item.reps);
		setWeight(item.defaultWeight != null ? displayWeight(item.defaultWeight) : 0);
		setRestTime(item.restTime);
		setStep(2);
		setDrawerOpen(true);
	}, [displayWeight]);

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

	function pickExercise(variant: ExerciseVariant) {
		setSelected(variant);
		const base = EXERCISE_BASES_BY_ID[variant.baseId];
		if (!base?.supportsUnilateral) setIsUnilateral(false);
		setStep(2);
	}

	async function handleAdd() {
		if (!selected) return;
		try {
			const nextOrder = exerciseRows.length;
			await db.insert(sessionExercises).values({
				sessionId,
				exerciseVariantId: selected.id,
				isUnilateral,
				order: nextOrder,
				sets,
				reps,
				defaultWeight: weight > 0 ? toStorageWeight(weight) : null,
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
				.set({ isUnilateral, sets, reps, defaultWeight: weight > 0 ? toStorageWeight(weight) : null, restTime })
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
			const variant = EXERCISE_VARIANTS_BY_ID[item.exerciseVariantId];
			const base = variant ? EXERCISE_BASES_BY_ID[variant.baseId] : null;
			const name = variant ? t(`exercises.names.${variant.id}`) : item.exerciseVariantId;
			return (
				<ExerciseCard
					name={name}
					muscles={base?.muscles ?? []}
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

	const filteredVariants = EXERCISE_VARIANTS.filter((v) => {
		const matchesSearch = t(`exercises.names.${v.id}`).toLowerCase().includes(search.toLowerCase());
		const matchesEquipment = equipmentFilter === null || v.equipment === equipmentFilter;
		return matchesSearch && matchesEquipment;
	});

	const selectedBase = selected ? EXERCISE_BASES_BY_ID[selected.baseId] : null;

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader
				title={session.name}
				subtitle={t("sessions.exerciseCount", { count })}
				onBack={() => router.back()}
				action={
					<Button
						variant="glow"
						label={t("common.exercise")}
						startIcon={<Ionicons name="add" size={20} />}
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
						: (selected ? t(`exercises.names.${selected.id}`) : t("exercises.configure"))
				}
			>
				{step === 1 ? (
					<View className="gap-3">
						<SearchField
							value={search}
							onChangeText={setSearch}
							placeholder={t("exercises.search")}
						/>

						{/* Equipment filters */}
						<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
							<Pressable
								onPress={() => setEquipmentFilter(null)}
								className="active:opacity-70"
							>
								<View
									className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
									style={{
										backgroundColor: equipmentFilter === null ? palette.primary.DEFAULT : palette.muted.DEFAULT,
									}}
								>
									<Text
										className="text-xs font-semibold"
										style={{ color: equipmentFilter === null ? palette.primary.foreground : palette.muted.foreground }}
									>
										{t("exercises.equipment.all")}
									</Text>
								</View>
							</Pressable>
							{ALL_EQUIPMENT.map((eq) => (
								<Pressable
									key={eq}
									onPress={() => setEquipmentFilter(equipmentFilter === eq ? null : eq)}
									className="active:opacity-70"
								>
									<View
										className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
										style={{
											backgroundColor: equipmentFilter === eq ? palette.primary.DEFAULT : palette.muted.DEFAULT,
										}}
									>
										<Ionicons
											name={EQUIPMENT_ICONS[eq]}
											size={13}
											color={equipmentFilter === eq ? palette.primary.foreground : palette.muted.foreground}
										/>
										<Text
											className="text-xs font-semibold"
											style={{ color: equipmentFilter === eq ? palette.primary.foreground : palette.muted.foreground }}
										>
											{t(`exercises.equipment.${eq}`)}
										</Text>
									</View>
								</Pressable>
							))}
						</ScrollView>

						<ScrollView showsVerticalScrollIndicator={false}>
							<View className="gap-2">
								{filteredVariants.map((variant) => {
									const base = EXERCISE_BASES_BY_ID[variant.baseId];
									return (
										<Pressable
											key={variant.id}
											onPress={() => pickExercise(variant)}
											className="active:opacity-70"
										>
											<View className="flex-row items-center bg-background px-4 py-3" style={{ borderRadius: radius.md }}>
												<View className="flex-1 gap-1.5">
													<View className="flex-row items-center gap-2">
														<Text className="text-base font-semibold text-foreground">
															{t(`exercises.names.${variant.id}`)}
														</Text>
														<View className="flex-row items-center gap-1 rounded-full bg-muted px-2 py-0.5">
															<Ionicons name={EQUIPMENT_ICONS[variant.equipment]} size={11} color={palette.muted.foreground} />
															<Text className="text-xs text-muted-foreground">{t(`exercises.equipment.${variant.equipment}`)}</Text>
														</View>
													</View>
													<View className="flex-row flex-wrap gap-1">
														{base?.muscles.map((m) => (
															<Chip key={m} label={t(`exercises.muscleGroups.${m}`)} />
														))}
													</View>
												</View>
												<Ionicons name="chevron-forward" size={18} color={palette.muted.foreground} />
											</View>
										</Pressable>
									);
								})}
							</View>
						</ScrollView>
					</View>
				) : (
					<View className="gap-4">
						{selected && (
							<View className="rounded-2xl bg-background px-5 py-4">
								<View className="flex-row items-center gap-2">
									<Text className="text-base font-semibold text-foreground">
										{t(`exercises.names.${selected.id}`)}
									</Text>
									<View className="flex-row items-center gap-1 rounded-full bg-muted px-2 py-0.5">
										<Ionicons name={EQUIPMENT_ICONS[selected.equipment]} size={11} color={palette.muted.foreground} />
										<Text className="text-xs text-muted-foreground">{t(`exercises.equipment.${selected.equipment}`)}</Text>
									</View>
								</View>
								<View className="mt-2 flex-row flex-wrap gap-1">
									{selectedBase?.muscles.map((m) => (
										<Chip key={m} label={t(`exercises.muscleGroups.${m}`)} />
									))}
								</View>
							</View>
						)}

						{selectedBase?.supportsUnilateral && (
							<View
								className="flex-row items-center justify-between rounded-2xl px-5 py-4"
								style={{ backgroundColor: palette.background.DEFAULT }}
							>
								<Text className="text-base font-medium text-foreground">{t("exercises.unilateral")}</Text>
								<Switch
									value={isUnilateral}
									onValueChange={setIsUnilateral}
									trackColor={{ false: palette.muted.DEFAULT, true: palette.primary.DEFAULT }}
									thumbColor={palette.foreground}
								/>
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
							endAdornment={weightUnit}
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
							variant="glow"
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
