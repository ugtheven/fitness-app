import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { palette } from "../lib/palette";
import { IconButton } from "./IconButton";

export type ScreenHeaderProps = {
	title: string;
	subtitle?: string;
	onBack: () => void;
	action?: ReactNode;
};

export function ScreenHeader({ title, subtitle, onBack, action }: ScreenHeaderProps) {
	return (
		<View className="flex-row items-center gap-3 px-4 py-3">
			<IconButton
				name="arrow-back"
				size={24}
				color={palette.foreground}
				onPress={onBack}
				accessibilityLabel="Retour"
			/>
			<View className="flex-1">
				<Text className="text-2xl font-bold text-foreground" numberOfLines={1}>
					{title}
				</Text>
				{subtitle !== undefined && (
					<Text className="text-sm text-muted-foreground">{subtitle}</Text>
				)}
			</View>
			{action}
		</View>
	);
}
