import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomDrawer } from "../../../components/BottomDrawer";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { ExerciseCard } from "../../../components/ExerciseCard";
import { NumberField } from "../../../components/NumberField";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { db } from "../../../db";
import { sessionExercises, sessions } from "../../../db/schema";
import { EXERCISES, type Exercise } from "../../../lib/exercises";

export default function SessionScreen() {
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
		setDrawerOpen(true);
	}

	function openEditDrawer(item: typeof sessionExercises.$inferSelect) {
		const exercise = EXERCISES.find((e) => e.id === item.exerciseId) ?? null;
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
			"Supprimer l'exercice",
			"Supprimer cet exercice ? Cette action est irréversible.",
			[
				{ text: "Annuler", style: "cancel" },
				{
					text: "Supprimer",
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
				exerciseId: selected.id,
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

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader
				title={session.name}
				subtitle={`${count} exercise${count !== 1 ? "s" : ""}`}
				onBack={() => router.back()}
				action={
					<Button
						label="Add"
						startIcon={<Ionicons name="add" size={20} color="white" />}
						onPress={openDrawer}
					/>
				}
			/>

			<View className="flex-1 px-6 pt-2">
				{count === 0 ? (
					<EmptyState message="No exercises yet." hint='Tap "Add" to add one.' />
				) : (
					<FlatList
						data={exerciseRows}
						keyExtractor={(item) => String(item.id)}
						contentContainerStyle={{ paddingTop: 8, gap: 12 }}
						showsVerticalScrollIndicator={false}
						renderItem={({ item }) => {
							const exercise = EXERCISES.find((e) => e.id === item.exerciseId);
							return (
								<ExerciseCard
									name={exercise?.name ?? `Exercise #${item.exerciseId}`}
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
				title={step === 1 ? "Add exercise" : (selected?.name ?? "Configure")}
			>
				{step === 1 ? (
					<View className="gap-2">
						{EXERCISES.map((exercise) => (
							<Pressable
								key={exercise.id}
								onPress={() => pickExercise(exercise)}
								className="active:opacity-70"
							>
								<View className="rounded-xl bg-background px-4 py-3">
									<Text className="text-base font-medium text-foreground">{exercise.name}</Text>
									<Text className="text-xs text-muted-foreground capitalize">
										{exercise.muscleGroup}
									</Text>
								</View>
							</Pressable>
						))}
					</View>
				) : (
					<View className="gap-4">
						{selected && (
							<View className="rounded-2xl bg-background px-5 py-4">
								<Text className="text-base font-semibold text-foreground">{selected.name}</Text>
								<Text className="mt-1 text-xs text-muted-foreground capitalize">
									{selected.muscleGroup}
								</Text>
							</View>
						)}
						<View className="flex-row gap-3">
							<View className="flex-1">
								<NumberField label="Sets" value={sets} onValueChange={setSets} min={1} step={1} />
							</View>
							<View className="flex-1">
								<NumberField label="Reps" value={reps} onValueChange={setReps} min={1} step={1} />
							</View>
						</View>
						<NumberField
							label="Default weight"
							value={weight}
							onValueChange={setWeight}
							min={0}
							step={2.5}
							endAdornment="kg"
						/>
						<NumberField
							label="Rest"
							value={restTime}
							onValueChange={setRestTime}
							min={0}
							step={15}
							endAdornment="s"
						/>
						<Button
							fullWidth
							label={editingId ? "Save" : "Add exercise"}
							onPress={editingId ? handleUpdate : handleAdd}
						/>
					</View>
				)}
			</BottomDrawer>
		</SafeAreaView>
	);
}
