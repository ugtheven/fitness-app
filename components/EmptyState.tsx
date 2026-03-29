import { Text, View } from "react-native";

export type EmptyStateProps = {
	message: string;
	hint: string;
};

export function EmptyState({ message, hint }: EmptyStateProps) {
	return (
		<View className="flex-1 items-center justify-center gap-2">
			<Text className="text-base text-muted-foreground">{message}</Text>
			<Text className="text-sm text-muted-foreground">{hint}</Text>
		</View>
	);
}
