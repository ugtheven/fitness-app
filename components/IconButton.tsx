import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable } from "react-native";

export type IconButtonProps = {
	name: ComponentProps<typeof Ionicons>["name"];
	size?: number;
	color: string;
	onPress: () => void;
	accessibilityLabel: string;
	hitSlop?: number;
};

export function IconButton({
	name,
	size = 24,
	color,
	onPress,
	accessibilityLabel,
	hitSlop = 12,
}: IconButtonProps) {
	return (
		<Pressable
			onPress={onPress}
			hitSlop={hitSlop}
			className="rounded-full p-2 active:opacity-70"
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
		>
			<Ionicons name={name} size={size} color={color} />
		</Pressable>
	);
}
