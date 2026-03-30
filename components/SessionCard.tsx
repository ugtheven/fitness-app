import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import type { MuscleGroup } from "../lib/exercises";
import { palette } from "../lib/palette";
import { ChipList } from "./ChipList";
import { IconButton } from "./IconButton";

type SessionCardProps = {
	name: string;
	exerciseCount: number;
	muscles: MuscleGroup[];
	onPress: () => void;
	onDelete: () => void;
};

export function SessionCard({ name, exerciseCount, muscles, onPress, onDelete }: SessionCardProps) {
	const { t } = useTranslation();

	return (
		<Pressable onPress={onPress} className="active:opacity-70">
			<View className="rounded-2xl bg-card px-5 py-4">
				<View className="flex-row items-center">
					<View className="flex-1">
						<Text className="text-base font-semibold text-foreground">{name}</Text>
						<Text className="mt-0.5 text-xs text-muted-foreground">
							{t("sessions.exerciseCount", { count: exerciseCount })}
						</Text>
					</View>
					<IconButton
						name="trash-outline"
						size={18}
						color={palette.muted.foreground}
						onPress={onDelete}
						accessibilityLabel={t("common.delete")}
					/>
					<Ionicons name="chevron-forward" size={18} color={palette.muted.foreground} />
				</View>
				{muscles.length > 0 && (
					<View className="mt-2">
						<ChipList labels={muscles.map((m) => t(`exercises.muscleGroups.${m}`))} />
					</View>
				)}
			</View>
		</Pressable>
	);
}
