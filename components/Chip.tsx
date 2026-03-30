import { Text, View } from "react-native";

type ChipProps = {
	label: string;
};

export function Chip({ label }: ChipProps) {
	return (
		<View className="rounded-full bg-muted px-2.5 py-0.5">
			<Text className="text-xs font-medium text-muted-foreground">{label}</Text>
		</View>
	);
}
