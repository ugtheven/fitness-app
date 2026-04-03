import { Ionicons } from "@expo/vector-icons";
import { TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";
import { palette } from "../lib/palette";
import { radius, spacing, typography } from "../lib/tokens";

export type SearchFieldProps = Omit<TextInputProps, "placeholderTextColor">;

export function SearchField(props: SearchFieldProps) {
	return (
		<View className="flex-row items-center border border-border bg-background px-4" style={{ borderRadius: radius.lg }}>
			<Ionicons name="search" size={18} color={palette.muted.foreground} />
			<TextInput
				className="flex-1 pl-2 text-foreground"
				style={{ height: spacing.inputHeight, fontSize: typography.statMd.fontSize }}
				placeholderTextColor={palette.muted.foreground}
				autoCorrect={false}
				{...props}
			/>
		</View>
	);
}
