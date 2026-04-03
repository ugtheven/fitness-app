import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { palette } from "../lib/palette";
import { radius } from "../lib/tokens";
import { xpProgressInLevel } from "../lib/xp";
import { getUserLevelQuery } from "../lib/xpQueries";

export function XpBar() {
	const { t } = useTranslation();
	const { data: levelData = [] } = useLiveQuery(getUserLevelQuery());
	const row = levelData[0];
	const level = row?.level ?? 1;
	const totalXp = row?.totalXp ?? 0;
	const { current, needed, progress } = xpProgressInLevel(totalXp);

	return (
		<View
			style={{
				backgroundColor: palette.card.DEFAULT,
				borderRadius: radius.lg,
				padding: 16,
				gap: 10,
			}}
		>
			{/* Header: level badge + label + XP progress */}
			<View className="flex-row items-center justify-between">
				<View className="flex-row items-center gap-2">
					<View
						className="items-center justify-center"
						style={{
							width: 28,
							height: 28,
							borderRadius: 14,
							backgroundColor: palette.accent.muted,
						}}
					>
						<Text className="text-xs font-bold" style={{ color: palette.accent.DEFAULT }}>
							{level}
						</Text>
					</View>
					<Text className="text-sm font-semibold text-foreground">{t("xp.level", { level })}</Text>
				</View>
				<Text className="text-xs" style={{ color: palette.muted.foreground }}>
					{t("xp.xpProgress", { current, total: needed })}
				</Text>
			</View>

			{/* Progress bar */}
			<View
				className="rounded-full overflow-hidden"
				style={{ height: 8, backgroundColor: palette.muted.DEFAULT }}
			>
				<View
					className="rounded-full"
					style={{
						height: 8,
						width: `${Math.round(progress * 100)}%`,
						backgroundColor: palette.accent.DEFAULT,
					}}
				/>
			</View>
		</View>
	);
}
