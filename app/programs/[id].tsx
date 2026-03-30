import { Ionicons } from "@expo/vector-icons";
import { desc, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { BottomDrawer } from "../../components/BottomDrawer";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SessionCard } from "../../components/SessionCard";
import { TextField } from "../../components/TextField";
import { db } from "../../db";
import { programs, sessionExercises, sessions } from "../../db/schema";
import { EXERCISES, type MuscleGroup } from "../../lib/exercises";

export default function ProgramScreen() {
	const { t } = useTranslation();
	const { id } = useLocalSearchParams<{ id: string }>();
	const programId = Number(id);

	const [drawerOpen, setDrawerOpen] = useState(false);
	const [sessionName, setSessionName] = useState("");

	const { data: programData } = useLiveQuery(
		db.select().from(programs).where(eq(programs.id, programId)),
	);
	const program = programData?.[0];

	const { data: sessionData } = useLiveQuery(
		db
			.select()
			.from(sessions)
			.where(eq(sessions.programId, programId))
			.orderBy(desc(sessions.createdAt)),
	);

	const { data: sessionExRows } = useLiveQuery(
		db
			.select({ sessionId: sessionExercises.sessionId, exerciseId: sessionExercises.exerciseId })
			.from(sessionExercises)
			.innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
			.where(eq(sessions.programId, programId)),
	);

	async function handleCreate() {
		const name = sessionName.trim();
		if (!name) return;
		try {
			const result = await db
				.insert(sessions)
				.values({ programId, name })
				.returning({ id: sessions.id });
			const newId = result[0]?.id;
			setSessionName("");
			setDrawerOpen(false);
			if (newId) router.push(`/programs/session/${newId}`);
		} catch (e) {
			console.error("Failed to create session:", e);
		}
	}

	function handleDelete(sessionId: number, name: string) {
		Alert.alert(
			t("sessions.deleteTitle"),
			t("sessions.deleteMessage", { name }),
			[
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("common.delete"),
					style: "destructive",
					onPress: async () => {
						await db.delete(sessions).where(eq(sessions.id, sessionId));
					},
				},
			],
		);
	}

	if (!program) return null;

	const sessionCount = sessionData?.length ?? 0;

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader
				title={program.name}
				subtitle={t("programs.sessionCount", { count: sessionCount })}
				onBack={() => router.back()}
				action={
					<Button
						label={t("common.new")}
						startIcon={<Ionicons name="add" size={20} color="white" />}
						onPress={() => setDrawerOpen(true)}
					/>
				}
			/>

			<View className="flex-1 px-6 pt-2">
				{sessionCount === 0 ? (
					<EmptyState message={t("sessions.empty")} hint={t("sessions.emptyHint")} />
				) : (
					<FlatList
						data={sessionData}
						keyExtractor={(item) => String(item.id)}
						contentContainerStyle={{ paddingTop: 8, gap: 12 }}
						showsVerticalScrollIndicator={false}
						renderItem={({ item }) => {
							const rows = sessionExRows?.filter((r) => r.sessionId === item.id) ?? [];
							const exerciseCount = rows.length;
							const muscles = [
								...new Set(
									rows.flatMap(
										(r) => EXERCISES.find((e) => e.nameKey === r.exerciseId)?.muscles ?? [],
									),
								),
							] as MuscleGroup[];
							return (
								<SessionCard
									name={item.name}
									exerciseCount={exerciseCount}
									muscles={muscles}
									onPress={() => router.push(`/programs/session/${item.id}`)}
									onDelete={() => handleDelete(item.id, item.name)}
								/>
							);
						}}
					/>
				)}
			</View>

			<BottomDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} title={t("sessions.newSession")}>
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
					<Button fullWidth label={t("common.create")} onPress={handleCreate} />
				</View>
			</BottomDrawer>
		</SafeAreaView>
	);
}
