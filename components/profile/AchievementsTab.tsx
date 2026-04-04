import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { db } from "../../db";
import { ACHIEVEMENTS } from "../../lib/achievements";
import { palette } from "../../lib/palette";
import { radius } from "../../lib/tokens";
import { getUnlockedAchievementsQuery } from "../../lib/xpQueries";

export function AchievementsTab() {
	const { t } = useTranslation();
	const { data: unlockedRows = [] } = useLiveQuery(getUnlockedAchievementsQuery());
	const unlockedMap = new Map(unlockedRows.map((r) => [r.achievementId, r.unlockedAt]));
	const [progressMap, setProgressMap] = useState<Map<string, { current: number; target: number }>>(
		new Map()
	);

	useEffect(() => {
		async function loadProgress() {
			const map = new Map<string, { current: number; target: number }>();
			for (const a of ACHIEVEMENTS) {
				if (unlockedMap.has(a.id) || !a.progress) continue;
				const p = await a.progress(db);
				map.set(a.id, p);
			}
			setProgressMap(map);
		}
		loadProgress();
	}, [unlockedMap]);

	return (
		<ScrollView
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{ gap: 12, paddingBottom: 100 }}
		>
			{ACHIEVEMENTS.map((achievement) => {
				const unlockedAt = unlockedMap.get(achievement.id);
				const isUnlocked = unlockedAt != null;
				const progress = progressMap.get(achievement.id);

				return (
					<View
						key={achievement.id}
						className="flex-row items-center gap-3 px-4 py-3"
						style={{
							backgroundColor: palette.card.DEFAULT,
							borderRadius: radius.lg,
							opacity: isUnlocked ? 1 : 0.4,
						}}
					>
						<View
							className="items-center justify-center"
							style={{
								width: 40,
								height: 40,
								borderRadius: 20,
								backgroundColor: isUnlocked ? palette.accent.muted : palette.muted.DEFAULT,
							}}
						>
							<Ionicons
								name={
									isUnlocked
										? (achievement.iconName as keyof typeof Ionicons.glyphMap)
										: "lock-closed-outline"
								}
								size={20}
								color={isUnlocked ? palette.accent.DEFAULT : palette.muted.foreground}
							/>
						</View>
						<View className="flex-1">
							<Text className="text-sm font-semibold text-foreground">
								{t(achievement.nameKey)}
							</Text>
							<Text className="text-xs" style={{ color: palette.muted.foreground }}>
								{isUnlocked
									? t("achievements.unlockedAt", { date: unlockedAt.slice(0, 10) })
									: t(achievement.descriptionKey)}
							</Text>
							{!isUnlocked && progress != null && (
								<View className="mt-1.5" style={{ gap: 2 }}>
									<Text className="text-xs" style={{ color: palette.muted.foreground }}>
										{progress.current}/{progress.target}
									</Text>
									<View
										style={{
											height: 4,
											borderRadius: 2,
											backgroundColor: palette.muted.DEFAULT,
											overflow: "hidden",
										}}
									>
										<View
											style={{
												height: 4,
												borderRadius: 2,
												backgroundColor: palette.accent.DEFAULT,
												width: `${(progress.current / progress.target) * 100}%`,
											}}
										/>
									</View>
								</View>
							)}
						</View>
						<Text
							className="text-xs font-bold"
							style={{ color: isUnlocked ? palette.accent.DEFAULT : palette.muted.foreground }}
						>
							{achievement.xp} XP
						</Text>
					</View>
				);
			})}
		</ScrollView>
	);
}
