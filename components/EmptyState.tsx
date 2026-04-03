import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { palette } from "../lib/palette";

export type EmptyStateProps = {
	icon?: ReactNode;
	message: string;
	hint?: string;
};

export function EmptyState({ icon, message, hint }: EmptyStateProps) {
	return (
		<View className="flex-1 items-center justify-center gap-3">
			{icon}
			<Text className="text-base" style={{ color: palette.muted.foreground }}>{message}</Text>
			{hint && (
				<Text className="text-sm text-center" style={{ color: palette.muted.foreground }}>{hint}</Text>
			)}
		</View>
	);
}
