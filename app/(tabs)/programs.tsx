import { Ionicons } from "@expo/vector-icons";
import { desc, eq, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomDrawer } from "../../components/BottomDrawer";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { ProgramCard } from "../../components/ProgramCard";
import { TextField } from "../../components/TextField";
import { db } from "../../db";
import { programs, sessions } from "../../db/schema";

export default function ProgramsScreen() {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [programName, setProgramName] = useState("");

	const { data } = useLiveQuery(db.select().from(programs).orderBy(desc(programs.createdAt)));

	const { data: sessionCounts } = useLiveQuery(
		db
			.select({ programId: sessions.programId, count: sql<number>`count(*)` })
			.from(sessions)
			.groupBy(sessions.programId),
	);

	async function handleCreate() {
		const name = programName.trim();
		if (!name) return;
		try {
			const result = await db.insert(programs).values({ name }).returning({ id: programs.id });
			const newId = result[0]?.id;
			setProgramName("");
			setDrawerOpen(false);
			if (newId) router.push(`/programs/${newId}`);
		} catch (e) {
			console.error("Failed to create program:", e);
		}
	}

	function handleDelete(id: number, name: string) {
		Alert.alert(
			"Supprimer le programme",
			`Supprimer "${name}" ? Cette action est irréversible.`,
			[
				{ text: "Annuler", style: "cancel" },
				{
					text: "Supprimer",
					style: "destructive",
					onPress: async () => {
						await db.delete(programs).where(eq(programs.id, id));
					},
				},
			],
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<View className="flex-1 px-6 pt-2">
				<View className="flex-row items-center justify-between gap-3">
					<Text className="min-w-0 shrink text-4xl font-bold text-foreground" numberOfLines={1}>
						Programs
					</Text>
					<Button
						label="New"
						startIcon={<Ionicons name="add" size={20} color="white" />}
						onPress={() => setDrawerOpen(true)}
					/>
				</View>

				{data?.length === 0 ? (
					<EmptyState message="No programs yet." hint='Tap "New" to create one.' />
				) : (
					<FlatList
						data={data}
						keyExtractor={(item) => String(item.id)}
						contentContainerStyle={{ paddingTop: 20, gap: 12 }}
						showsVerticalScrollIndicator={false}
						renderItem={({ item }) => {
							const count = sessionCounts?.find((c) => c.programId === item.id)?.count ?? 0;
							return (
								<ProgramCard
									name={item.name}
									sessionCount={count}
									onPress={() => router.push(`/programs/${item.id}`)}
									onDelete={() => handleDelete(item.id, item.name)}
								/>
							);
						}}
					/>
				)}
			</View>

			<BottomDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} title="New program">
				<View className="gap-4">
					<TextField
						label="Name"
						value={programName}
						onChangeText={setProgramName}
						placeholder="Program name"
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
