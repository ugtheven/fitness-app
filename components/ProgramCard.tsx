import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { palette } from "../lib/palette";
import { radius } from "../lib/tokens";
import { IconButton } from "./IconButton";

type ProgramSession = { id: number; name: string };

type ProgramCardProps = {
	name: string;
	sessionCount: number;
	exerciseCount: number;
	sessions: ProgramSession[];
	onPress: () => void;
	onDelete: () => void;
};

const MAX_CHIPS = 3;

export function ProgramCard({ name, sessionCount, exerciseCount, sessions, onPress, onDelete }: ProgramCardProps) {
	const { t } = useTranslation();
	const overflow = sessions.length - MAX_CHIPS;

	return (
		<Pressable onPress={onPress} className="active:opacity-70">
			<View className="flex-row items-center gap-4 bg-card px-5 py-4" style={{ borderRadius: radius.lg }}>
				<View className="bg-muted p-2.5" style={{ borderRadius: radius.md }}>
					<Ionicons name="barbell-outline" size={20} color={palette.muted.foreground} />
				</View>

				<View className="flex-1">
					<Text className="text-base font-semibold text-foreground">{name}</Text>
					<Text className="mt-0.5 text-xs text-muted-foreground">
						{t("programs.sessionCount", { count: sessionCount })}
						{" · "}
						{t("programs.exerciseCount", { count: exerciseCount })}
					</Text>
					{sessions.length > 0 && (
						<View className="mt-2 flex-row flex-wrap gap-1.5">
							{sessions.slice(0, MAX_CHIPS).map((s, i) => (
								<View key={s.id} className="flex-row items-center rounded-full border border-border bg-background px-3 py-1">
									<Text className="mr-1 text-xs font-bold text-foreground">D{i + 1}</Text>
									<Text className="text-xs font-medium text-muted-foreground">{s.name}</Text>
								</View>
							))}
							{overflow > 0 && (
								<View className="rounded-full border border-border bg-background px-3 py-1">
									<Text className="text-xs font-medium text-muted-foreground">+{overflow}</Text>
								</View>
							)}
						</View>
					)}
				</View>

				<View className="flex-row items-center">
					<IconButton
						name="trash-outline"
						size={18}
						color={palette.destructive.DEFAULT}
						onPress={onDelete}
						accessibilityLabel={t("common.delete")}
					/>
					<Ionicons name="chevron-forward" size={18} color={palette.muted.foreground} />
				</View>
			</View>
		</Pressable>
	);
}
