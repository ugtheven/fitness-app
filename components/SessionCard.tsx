import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import type { MuscleGroup } from "../lib/exerciseTypes";
import { palette } from "../lib/palette";
import { ChipList } from "./ChipList";
import { IconButton } from "./IconButton";

type SessionCardProps = {
	name: string;
	exerciseCount: number;
	muscles: MuscleGroup[];
	isDragging?: boolean;
	onPress: () => void;
	onDelete: () => void;
};

export function SessionCard({ name, exerciseCount, muscles, isDragging, onPress, onDelete }: SessionCardProps) {
	const { t } = useTranslation();

	return (
		<Pressable onPress={onPress} className="active:opacity-70">
			<View
				className="flex-row items-center gap-3 rounded-2xl bg-card px-5 py-4"
				style={
					isDragging
						? { shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 }
						: undefined
				}
			>
				<Ionicons name="reorder-three-outline" size={22} color={palette.muted.foreground} />
				<View className="flex-1">
					<Text className="text-base font-semibold text-foreground">{name}</Text>
					<Text className="mt-0.5 text-xs text-muted-foreground">
						{t("sessions.exerciseCount", { count: exerciseCount })}
					</Text>
					<View className="mt-2" style={{ minHeight: 26 }}>
						{muscles.length > 0 && (
							<ChipList labels={muscles.map((m) => t(`exercises.muscleGroups.${m}`))} />
						)}
					</View>
				</View>
				<View className="flex-row items-center">
					<IconButton
						name="trash-outline"
						size={18}
						color="#ef4444"
						onPress={onDelete}
						accessibilityLabel={t("common.delete")}
					/>
					<Ionicons name="chevron-forward" size={18} color={palette.muted.foreground} />
				</View>
			</View>
		</Pressable>
	);
}
