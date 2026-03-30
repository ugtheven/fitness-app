import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import type { MuscleGroup } from "../lib/exercises";
import { palette } from "../lib/palette";
import { ChipList } from "./ChipList";
import { IconButton } from "./IconButton";

type ExerciseCardProps = {
	name: string;
	muscles: MuscleGroup[];
	sets: number;
	reps: number;
	defaultWeight: number | null;
	restTime: number;
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
	onEdit,
	onDelete,
}: ExerciseCardProps) {
	const { t } = useTranslation();

	return (
		<View className="rounded-2xl bg-card px-5 py-4">
			<View className="flex-row items-start">
				<View className="flex-1">
					<Text className="text-base font-semibold text-foreground">{name}</Text>
					<Text className="mt-0.5 text-xs text-muted-foreground">
						{sets} sets · {reps} reps
						{defaultWeight ? ` · ${defaultWeight} kg` : ""}
						{` · ${restTime}s rest`}
					</Text>
				</View>
				<View className="flex-row">
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
						color={palette.muted.foreground}
						onPress={onDelete}
						accessibilityLabel={t("common.delete")}
					/>
				</View>
			</View>
			{muscles.length > 0 && (
				<View className="mt-2">
					<ChipList labels={muscles.map((m) => t(`exercises.muscleGroups.${m}`))} />
				</View>
			)}
		</View>
	);
}
