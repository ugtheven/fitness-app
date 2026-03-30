import { Ionicons } from "@expo/vector-icons";
import { eq, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../db";
import { programs, sessions } from "../../db/schema";
import { palette } from "../../lib/palette";

export default function HomeScreen() {
	const { t } = useTranslation();

	const { data: activePrograms } = useLiveQuery(
		db.select().from(programs).where(eq(programs.isActive, true)).limit(1)
	);
	const activeProgram = activePrograms?.[0];

	const { data: sessionRows } = useLiveQuery(
		db
			.select({ count: sql<number>`count(*)` })
			.from(sessions)
			.where(activeProgram ? eq(sessions.programId, activeProgram.id) : sql`0`)
	);
	const sessionCount = sessionRows?.[0]?.count ?? 0;

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<View className="flex-1 px-6 pt-2">
				<Text className="text-2xl font-bold text-foreground">{t("tabs.home")}</Text>
			</View>

			{activeProgram && (
				<Pressable
					onPress={() => {}}
					className="active:opacity-80"
					style={{ paddingHorizontal: 16, paddingBottom: 12 }}
				>
					<View
						className="flex-row items-center gap-3 px-4 py-3"
						style={{
							backgroundColor: palette.card.DEFAULT,
							borderRadius: 18,
							borderWidth: 1.5,
							borderColor: palette.primary.DEFAULT,
						}}
					>
						<View
							className="rounded-xl p-2"
							style={{ backgroundColor: `${palette.primary.DEFAULT}26` }}
						>
							<Ionicons name="flash" size={18} color={palette.primary.DEFAULT} />
						</View>
						<View className="flex-1">
							<Text className="text-base font-bold" style={{ color: palette.primary.DEFAULT }}>
								{activeProgram.name}
							</Text>
							<Text className="text-xs" style={{ color: palette.muted.foreground }}>
								{t("programs.sessionCount", { count: sessionCount })} · {t("programs.tapToStart")}
							</Text>
						</View>
						<Ionicons name="chevron-forward" size={18} color={palette.primary.DEFAULT} />
					</View>
				</Pressable>
			)}
		</SafeAreaView>
	);
}
