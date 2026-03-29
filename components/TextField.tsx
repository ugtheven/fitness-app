import { Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";
import { palette } from "../lib/palette";

export type TextFieldProps = Omit<TextInputProps, "placeholderTextColor"> & {
	label?: string;
};

export function TextField({ label, ...props }: TextFieldProps) {
	return (
		<View className="gap-1.5">
			{label && <Text className="text-sm font-medium text-foreground">{label}</Text>}
			<TextInput
				className="rounded-2xl border border-border bg-background px-4 text-foreground"
				style={{ height: 52, fontSize: 18 }}
				placeholderTextColor={palette.muted.foreground}
				{...props}
			/>
		</View>
	);
}
