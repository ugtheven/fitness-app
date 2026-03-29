import { Text, View } from "react-native";
import { palette } from "../lib/palette";
import { IconButton } from "./IconButton";

type ExerciseCardProps = {
	name: string;
	sets: number;
	reps: number;
	defaultWeight: number | null;
	restTime: number;
	onEdit: () => void;
	onDelete: () => void;
};

export function ExerciseCard({
	name,
	sets,
	reps,
	defaultWeight,
	restTime,
	onEdit,
	onDelete,
}: ExerciseCardProps) {
	return (
		<View className="flex-row items-center rounded-2xl bg-card px-5 py-4">
			<View className="flex-1">
				<Text className="text-base font-semibold text-foreground">{name}</Text>
				<Text className="mt-1 text-xs text-muted-foreground">
					{sets} sets \u00b7 {reps} reps
					{defaultWeight ? ` \u00b7 ${defaultWeight} kg` : ""}
					{` \u00b7 ${restTime}s rest`}
				</Text>
			</View>
			<IconButton
				name="create-outline"
				size={18}
				color={palette.muted.foreground}
				onPress={onEdit}
				accessibilityLabel="Modifier"
			/>
			<IconButton
				name="trash-outline"
				size={18}
				color={palette.muted.foreground}
				onPress={onDelete}
				accessibilityLabel="Supprimer"
			/>
		</View>
	);
}
