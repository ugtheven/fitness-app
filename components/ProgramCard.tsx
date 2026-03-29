import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { palette } from "../lib/palette";
import { IconButton } from "./IconButton";

type ProgramCardProps = {
	name: string;
	sessionCount: number;
	onPress: () => void;
	onDelete: () => void;
};

export function ProgramCard({ name, sessionCount, onPress, onDelete }: ProgramCardProps) {
	return (
		<Pressable onPress={onPress} className="active:opacity-70">
			<View className="flex-row items-center rounded-2xl bg-card px-5 py-4">
				<View className="flex-1">
					<Text className="text-base font-semibold text-foreground">{name}</Text>
					<Text className="mt-1 text-xs text-muted-foreground">
						{sessionCount} session{sessionCount !== 1 ? "s" : ""}
					</Text>
				</View>
				<IconButton
					name="trash-outline"
					size={18}
					color={palette.muted.foreground}
					onPress={onDelete}
					accessibilityLabel="Supprimer"
				/>
				<Ionicons name="chevron-forward" size={18} color={palette.muted.foreground} />
			</View>
		</Pressable>
	);
}
