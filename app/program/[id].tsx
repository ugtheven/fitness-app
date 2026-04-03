import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomDrawer } from "../../components/BottomDrawer";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SessionCard } from "../../components/SessionCard";
import { SortableList } from "../../components/SortableList";
import { TextField } from "../../components/TextField";
import { db } from "../../db";
import { programs, sessionExercises, sessions } from "../../db/schema";
import { EXERCISE_BASES_BY_ID } from "../../lib/exerciseBases";
import type { MuscleGroup } from "../../lib/exerciseTypes";
import { EXERCISE_VARIANTS_BY_ID } from "../../lib/exerciseVariants";

type SessionRow = typeof sessions.$inferSelect;

export default function ProgramScreen() {
	const { t } = useTranslation();
	const { id } = useLocalSearchParams<{ id: string }>();
	const programId = Number(id);

	const [drawerOpen, setDrawerOpen] = useState(false);
	const [sessionName, setSessionName] = useState("");

	const { data: programData } = useLiveQuery(
		db.select().from(programs).where(eq(programs.id, programId))
	);
	const program = programData?.[0];

	const { data: sessionData = [] } = useLiveQuery(
		db.select().from(sessions).where(eq(sessions.programId, programId)).orderBy(sessions.order)
	);

	const { data: sessionExRows } = useLiveQuery(
		db
			.select({
				sessionId: sessionExercises.sessionId,
				exerciseVariantId: sessionExercises.exerciseVariantId,
			})
			.from(sessionExercises)
			.innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
			.where(eq(sessions.programId, programId))
	);

	async function handleCreate() {
		const name = sessionName.trim();
		if (!name) return;
		try {
			const nextOrder = sessionData.length;
			const result = await db
				.insert(sessions)
				.values({ programId, name, order: nextOrder })
				.returning({ id: sessions.id });
			const newId = result[0]?.id;
			setSessionName("");
			setDrawerOpen(false);
			if (newId) router.push(`/program/session/${newId}`);
		} catch (e) {
			console.error("Failed to create session:", e);
		}
	}

	async function handleReorder(newData: SessionRow[]) {
		try {
			await Promise.all(
				newData.map((session, index) =>
					db.update(sessions).set({ order: index }).where(eq(sessions.id, session.id))
				)
			);
		} catch (e) {
			console.error("Failed to reorder sessions:", e);
		}
	}

	const handleDelete = useCallback(
		(sessionId: number, name: string) => {
			Alert.alert(t("sessions.deleteTitle"), t("sessions.deleteMessage", { name }), [
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("common.delete"),
					style: "destructive",
					onPress: async () => {
						await db.delete(sessions).where(eq(sessions.id, sessionId));
					},
				},
			]);
		},
		[t]
	);

	const renderItem = useCallback(
		({ item, isDragging }: { item: SessionRow; isDragging: boolean }) => {
			const rows = sessionExRows?.filter((r) => r.sessionId === item.id) ?? [];
			const muscles = [
				...new Set(
					rows.flatMap((r) => {
						const variant = EXERCISE_VARIANTS_BY_ID[r.exerciseVariantId ?? ""];
						return EXERCISE_BASES_BY_ID[variant?.baseId ?? ""]?.muscles ?? [];
					})
				),
			] as MuscleGroup[];

			return (
				<SessionCard
					name={item.name}
					exerciseCount={rows.length}
					muscles={muscles}
					isDragging={isDragging}
					onPress={() => router.push(`/program/session/${item.id}`)}
					onDelete={() => handleDelete(item.id, item.name)}
				/>
			);
		},
		[sessionExRows]
	);

	if (!program) return null;

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader
				title={program.name}
				subtitle={t("programs.sessionCount", { count: sessionData.length })}
				onBack={() => router.back()}
				action={
					<Button
						variant="glow"
						label={t("common.session")}
						startIcon={<Ionicons name="add" size={20} />}
						onPress={() => setDrawerOpen(true)}
					/>
				}
			/>

			<View className="flex-1 px-6 pt-2">
				{sessionData.length === 0 ? (
					<EmptyState message={t("sessions.empty")} hint={t("sessions.emptyHint")} />
				) : (
					<SortableList
						data={sessionData}
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
				title={t("sessions.newSession")}
			>
				<View className="gap-4">
					<TextField
						label={t("common.name")}
						value={sessionName}
						onChangeText={setSessionName}
						placeholder={t("sessions.namePlaceholder")}
						autoFocus
						returnKeyType="done"
						onSubmitEditing={handleCreate}
					/>
					<Button
						variant="glow"
						fullWidth
						label={t("common.create")}
						onPress={handleCreate}
						disabled={!sessionName.trim()}
					/>
				</View>
			</BottomDrawer>
		</SafeAreaView>
	);
}
