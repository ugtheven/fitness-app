import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import type { MuscleGroup } from "../lib/exercises";
import { palette } from "../lib/palette";
import { useUnits } from "../lib/units";
import { ChipList } from "./ChipList";
import { IconButton } from "./IconButton";

type ExerciseCardProps = {
	name: string;
	muscles: MuscleGroup[];
	sets: number;
	reps: number;
	defaultWeight: number | null;
	restTime: number;
	isDragging?: boolean;
	onEdit: () => void;
	onDelete: () => void;
};

export function ExerciseCard({
	name,
	muscles,
	sets,
	reps,
	defaultWeight,
	restTime,
	isDragging,
	onEdit,
	onDelete,
}: ExerciseCardProps) {
	const { t } = useTranslation();
	const { displayWeight, weightUnit } = useUnits();

	return (
		<View
			className="flex-row items-center gap-3 rounded-2xl bg-card px-5 py-4"
			style={isDragging ? { shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 } : undefined}
		>
			<Ionicons name="reorder-three-outline" size={22} color={palette.muted.foreground} />
			<View className="flex-1">
				<Text className="text-base font-semibold text-foreground">{name}</Text>
				<Text className="mt-0.5 text-xs text-muted-foreground">
					{sets} sets · {reps} reps
					{defaultWeight ? ` · ${displayWeight(defaultWeight)} ${weightUnit}` : ""}
					{` · ${restTime}s rest`}
				</Text>
				<View className="mt-2" style={{ minHeight: 26 }}>
					{muscles.length > 0 && (
						<ChipList labels={muscles.map((m) => t(`exercises.muscleGroups.${m}`))} />
					)}
				</View>
			</View>
			<View className="flex-row items-center">
				<IconButton
					name="create-outline"
					size={18}
					color={palette.muted.foreground}
					onPress={onEdit}
					accessibilityLabel={t("common.edit")}
				/>
				<IconButton
					name="trash-outline"
					size={18}
					color="#ef4444"
					onPress={onDelete}
					accessibilityLabel={t("common.delete")}
				/>
			</View>
		</View>
	);
}
