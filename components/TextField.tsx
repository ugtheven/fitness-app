import { Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";
import { palette } from "../lib/palette";
import { radius, spacing, typography } from "../lib/tokens";

export type TextFieldProps = Omit<TextInputProps, "placeholderTextColor"> & {
	label?: string;
};

export function TextField({ label, ...props }: TextFieldProps) {
	return (
		<View className="gap-1.5">
			{label && <Text className="text-sm font-medium text-foreground">{label}</Text>}
			<TextInput
				className="border border-border bg-background px-4 text-foreground"
				style={{
					height: spacing.inputHeight,
					fontSize: typography.statMd.fontSize,
					borderRadius: radius.lg,
				}}
				placeholderTextColor={palette.muted.foreground}
				{...props}
			/>
		</View>
	);
}
