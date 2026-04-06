import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useAuth } from "../lib/auth";
import { palette } from "../lib/palette";
import { radius } from "../lib/tokens";
import { xpProgressInLevel } from "../lib/xp";
import { getUserLevelQuery } from "../lib/xpQueries";

export function HomeHeader() {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const { user } = useAuth();

	// Level data
	const { data: levelData = [] } = useLiveQuery(getUserLevelQuery());
	const row = levelData[0];
	const level = row?.level ?? 1;
	const totalXp = row?.totalXp ?? 0;
	const { current, needed, progress } = xpProgressInLevel(totalXp);

	const fullName = (user?.user_metadata?.full_name as string) ?? user?.email?.split("@")[0] ?? "";
	const userName = fullName.split(" ")[0];

	// Formatted date
	const now = new Date();
	const dateLabel = new Intl.DateTimeFormat(i18n.language, {
		weekday: "short",
		month: "long",
		day: "numeric",
	}).format(now);

	const initial = userName.charAt(0).toUpperCase();

	return (
		<View style={{ gap: 16 }}>
			{/* Date + greeting block */}
			<View className="flex-row items-end justify-between">
				<View style={{ gap: 2 }}>
					<Text className="text-sm font-medium" style={{ color: palette.accent.DEFAULT }}>
						{dateLabel}
					</Text>
					<Text className="text-2xl font-bold text-foreground">
						{t("home.greeting", { name: userName })} 👋
					</Text>
				</View>

				{/* Avatar → profile */}
				<Pressable
					onPress={() => router.push("/(tabs)/profile")}
					className="flex-row items-center gap-1 active:opacity-70"
				>
					<View
						className="items-center justify-center"
						style={{
							width: 46,
							height: 46,
							borderRadius: 23,
							backgroundColor: palette.accent.DEFAULT,
						}}
					>
						<Text className="text-lg font-bold" style={{ color: palette.accent.foreground }}>
							{initial}
						</Text>
					</View>
					<Ionicons name="chevron-forward" size={14} color={palette.muted.foreground} />
				</Pressable>
			</View>

			{/* Row 3: level bar */}
			<View className="flex-row items-center gap-2.5">
				{/* Crown icon */}
				<View
					className="items-center justify-center"
					style={{
						width: 30,
						height: 30,
						borderRadius: radius.md,
						backgroundColor: palette.accent.muted,
					}}
				>
					<Ionicons name="trophy" size={16} color={palette.accent.DEFAULT} />
				</View>

				{/* Level label */}
				<Text className="text-sm font-bold text-foreground">{t("xp.lvl", { level })}</Text>

				{/* Progress bar */}
				<View
					className="flex-1 rounded-full overflow-hidden"
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

				{/* XP text */}
				<Text className="text-xs font-medium" style={{ color: palette.muted.foreground }}>
					{current}/{needed}
				</Text>
			</View>
		</View>
	);
}
