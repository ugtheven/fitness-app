import { Ionicons } from "@expo/vector-icons";
import { desc, eq, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomDrawer } from "../../components/BottomDrawer";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SessionCard } from "../../components/SessionCard";
import { TextField } from "../../components/TextField";
import { db } from "../../db";
import { programs, sessionExercises, sessions } from "../../db/schema";

export default function ProgramScreen() {
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

	const { data: exerciseCounts } = useLiveQuery(
		db
			.select({ sessionId: sessionExercises.sessionId, count: sql<number>`count(*)` })
			.from(sessionExercises)
			.innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
			.where(eq(sessions.programId, programId))
			.groupBy(sessionExercises.sessionId),
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
			"Supprimer la session",
			`Supprimer "${name}" ? Cette action est irréversible.`,
			[
				{ text: "Annuler", style: "cancel" },
				{
					text: "Supprimer",
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
				subtitle={`${sessionCount} session${sessionCount !== 1 ? "s" : ""}`}
				onBack={() => router.back()}
				action={
					<Button
						label="New"
						startIcon={<Ionicons name="add" size={20} color="white" />}
						onPress={() => setDrawerOpen(true)}
					/>
				}
			/>

			<View className="flex-1 px-6 pt-2">
				{sessionCount === 0 ? (
					<EmptyState message="No sessions yet." hint='Tap "New" to add one.' />
				) : (
					<FlatList
						data={sessionData}
						keyExtractor={(item) => String(item.id)}
						contentContainerStyle={{ paddingTop: 8, gap: 12 }}
						showsVerticalScrollIndicator={false}
						renderItem={({ item }) => {
							const count =
								exerciseCounts?.find((c) => c.sessionId === item.id)?.count ?? 0;
							return (
								<SessionCard
									name={item.name}
									exerciseCount={count}
									onPress={() => router.push(`/programs/session/${item.id}`)}
									onDelete={() => handleDelete(item.id, item.name)}
								/>
							);
						}}
					/>
				)}
			</View>

			<BottomDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} title="New session">
				<View className="gap-4">
					<TextField
						label="Name"
						value={sessionName}
						onChangeText={setSessionName}
						placeholder="Session name"
						autoFocus
						returnKeyType="done"
						onSubmitEditing={handleCreate}
					/>
					<Button fullWidth label="Create" onPress={handleCreate} />
				</View>
			</BottomDrawer>
		</SafeAreaView>
	);
}
