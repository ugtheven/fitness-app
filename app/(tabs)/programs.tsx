import { Ionicons } from "@expo/vector-icons";
import { desc, eq, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomDrawer } from "../../components/BottomDrawer";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { ProgramCard } from "../../components/ProgramCard";
import { TextField } from "../../components/TextField";
import { db } from "../../db";
import { programs, sessionExercises, sessions } from "../../db/schema";
import { palette } from "../../lib/palette";
import { borders, spacing } from "../../lib/tokens";

const MAX_CHIPS = 3;

export default function ProgramsScreen() {
	const { t } = useTranslation();
	const [newDrawerOpen, setNewDrawerOpen] = useState(false);
	const [switchDrawerOpen, setSwitchDrawerOpen] = useState(false);
	const [programName, setProgramName] = useState("");

	const { data = [] } = useLiveQuery(
		db.select().from(programs).orderBy(desc(programs.isActive), desc(programs.createdAt))
	);

	const { data: allSessions = [] } = useLiveQuery(
		db
			.select({ id: sessions.id, programId: sessions.programId, name: sessions.name })
			.from(sessions)
			.orderBy(sessions.order)
	);

	const { data: exerciseCounts = [] } = useLiveQuery(
		db
			.select({ programId: sessions.programId, count: sql<number>`count(*)` })
			.from(sessionExercises)
			.innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
			.groupBy(sessions.programId)
	);

	const activeProgram = data.find((p) => p.isActive) ?? null;
	const otherPrograms = data.filter((p) => !p.isActive);
	const activeSessions = activeProgram ? getProgramSessions(activeProgram.id) : [];
	const activeExerciseCount = activeProgram ? getProgramExerciseCount(activeProgram.id) : 0;
	const activeOverflow = activeSessions.length - MAX_CHIPS;

	function getProgramSessions(programId: number) {
		return allSessions.filter((s) => s.programId === programId);
	}

	function getProgramExerciseCount(programId: number) {
		return exerciseCounts.find((e) => e.programId === programId)?.count ?? 0;
	}

	async function handleCreate() {
		const name = programName.trim();
		if (!name) return;
		try {
			const isFirst = data.length === 0;
			const result = await db
				.insert(programs)
				.values({ name, isActive: isFirst })
				.returning({ id: programs.id });
			const newId = result[0]?.id;
			setProgramName("");
			setNewDrawerOpen(false);
			if (newId) router.push(`/program/${newId}`);
		} catch (e) {
			console.error("Failed to create program:", e);
		}
	}

	async function handleSetActive(id: number) {
		await db.transaction(async (tx) => {
			await tx.update(programs).set({ isActive: false });
			await tx.update(programs).set({ isActive: true }).where(eq(programs.id, id));
		});
		setSwitchDrawerOpen(false);
	}

	function handleDelete(id: number, name: string) {
		Alert.alert(t("programs.deleteTitle"), t("programs.deleteMessage", { name }), [
			{ text: t("common.cancel"), style: "cancel" },
			{
				text: t("common.delete"),
				style: "destructive",
				onPress: async () => {
					await db.delete(programs).where(eq(programs.id, id));
				},
			},
		]);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<View className="flex-1 px-6 pt-2">
				{/* Header */}
				<View className="flex-row items-center justify-between gap-3">
					<Text className="min-w-0 shrink text-2xl font-bold text-foreground" numberOfLines={1}>
						{t("programs.title")}
					</Text>
					<View className="flex-row items-center gap-2">
						{data.length > 0 && (
							<Pressable
								onPress={() => setSwitchDrawerOpen(true)}
								className="rounded-full p-2 active:opacity-70"
								hitSlop={8}
							>
								<Ionicons name="swap-horizontal" size={22} color={palette.foreground} />
							</Pressable>
						)}
						<Button
							variant="glow"
							label={t("common.program")}
							startIcon={<Ionicons name="add" size={20} />}
							onPress={() => setNewDrawerOpen(true)}
						/>
					</View>
				</View>

				{data.length === 0 ? (
					<EmptyState message={t("programs.empty")} hint={t("programs.emptyHint")} />
				) : (
					<ScrollView
						contentContainerStyle={{
							paddingTop: 20,
							paddingBottom: spacing.navbarClearance,
							gap: 12,
						}}
						showsVerticalScrollIndicator={false}
					>
						{/* Active program */}
						{activeProgram && (
							<Pressable
								onPress={() => router.push(`/program/${activeProgram.id}`)}
								className="active:opacity-70"
							>
								<View
									className="rounded-2xl bg-card p-5"
									style={{ borderWidth: borders.emphasis, borderColor: palette.accent.DEFAULT }}
								>
									{/* Card header */}
									<View className="mb-4 flex-row items-center gap-3">
										<View
											className="rounded-xl p-2"
											style={{ backgroundColor: palette.accent.muted }}
										>
											<Ionicons name="flash" size={18} color={palette.accent.DEFAULT} />
										</View>
										<Text
											className="flex-1 text-xs font-bold tracking-widest"
											style={{ color: palette.accent.DEFAULT }}
										>
											{t("programs.activeProgram").toUpperCase()}
										</Text>
										<Ionicons name="chevron-forward" size={18} color={palette.muted.foreground} />
									</View>

									{/* Program name */}
									<Text className="mb-3 text-2xl font-bold text-foreground">
										{activeProgram.name}
									</Text>

									{/* Stats */}
									<View className="mb-3 flex-row items-center gap-4">
										<View className="flex-row items-center gap-1.5">
											<View
												className="h-2 w-2 rounded-full"
												style={{ backgroundColor: palette.accent.DEFAULT }}
											/>
											<Text className="text-sm font-medium text-foreground">
												{t("programs.sessionCount", { count: activeSessions.length })}
											</Text>
										</View>
										<View className="flex-row items-center gap-1.5">
											<View
												className="h-2 w-2 rounded-full"
												style={{ backgroundColor: palette.accent.DEFAULT }}
											/>
											<Text className="text-sm font-medium text-foreground">
												{t("programs.exerciseCount", { count: activeExerciseCount })}
											</Text>
										</View>
									</View>

									{/* Session chips */}
									{activeSessions.length > 0 && (
										<View className="flex-row flex-wrap gap-2">
											{activeSessions.slice(0, MAX_CHIPS).map((s, i) => (
												<View
													key={s.id}
													className="flex-row items-center rounded-full border border-border bg-background px-3 py-1"
												>
													<Text
														className="mr-1 text-xs font-bold"
														style={{ color: palette.accent.DEFAULT }}
													>
														{t("programs.dayLabel", { n: i + 1 })}
													</Text>
													<Text className="text-xs font-medium text-foreground">{s.name}</Text>
												</View>
											))}
											{activeOverflow > 0 && (
												<View className="rounded-full border border-border bg-background px-3 py-1">
													<Text className="text-xs font-medium text-muted-foreground">
														+{activeOverflow}
													</Text>
												</View>
											)}
										</View>
									)}
								</View>
							</Pressable>
						)}

						{/* Other programs */}
						{otherPrograms.length > 0 && (
							<>
								<Text className="mt-2 text-xs font-bold tracking-widest text-muted-foreground">
									{t("programs.otherPrograms").toUpperCase()}
								</Text>
								{otherPrograms.map((item) => (
									<ProgramCard
										key={item.id}
										name={item.name}
										sessionCount={getProgramSessions(item.id).length}
										exerciseCount={getProgramExerciseCount(item.id)}
										sessions={getProgramSessions(item.id)}
										onPress={() => router.push(`/program/${item.id}`)}
										onDelete={() => handleDelete(item.id, item.name)}
									/>
								))}
							</>
						)}
					</ScrollView>
				)}
			</View>

			{/* New program drawer */}
			<BottomDrawer
				visible={newDrawerOpen}
				onClose={() => setNewDrawerOpen(false)}
				title={t("programs.newProgram")}
			>
				<View className="gap-4">
					<TextField
						label={t("common.name")}
						value={programName}
						onChangeText={setProgramName}
						placeholder={t("programs.namePlaceholder")}
						autoFocus
						returnKeyType="done"
						onSubmitEditing={handleCreate}
					/>
					<Button
						variant="glow"
						fullWidth
						label={t("common.create")}
						onPress={handleCreate}
						disabled={!programName.trim()}
					/>
				</View>
			</BottomDrawer>

			{/* Switch program drawer */}
			<BottomDrawer
				visible={switchDrawerOpen}
				onClose={() => setSwitchDrawerOpen(false)}
				title={t("programs.switchProgram")}
			>
				<View className="gap-3">
					{data.map((item) => {
						const count = getProgramSessions(item.id).length;
						return (
							<Pressable
								key={item.id}
								onPress={() => handleSetActive(item.id)}
								className="active:opacity-70"
							>
								<View className="flex-row items-center gap-4 rounded-2xl bg-card px-5 py-4">
									<View
										className="h-6 w-6 items-center justify-center rounded-full border-2"
										style={
											item.isActive
												? {
														borderColor: palette.primary.DEFAULT,
														backgroundColor: palette.primary.DEFAULT,
													}
												: { borderColor: palette.muted.foreground }
										}
									>
										{item.isActive && (
											<Ionicons name="checkmark" size={14} color={palette.primary.foreground} />
										)}
									</View>
									<View className="flex-1">
										<Text className="text-base font-semibold text-foreground">{item.name}</Text>
										<Text className="mt-0.5 text-xs text-muted-foreground">
											{t("programs.sessionCount", { count })}
										</Text>
									</View>
								</View>
							</Pressable>
						);
					})}
				</View>
			</BottomDrawer>
		</SafeAreaView>
	);
}
