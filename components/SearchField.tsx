import { Ionicons } from "@expo/vector-icons";
import { TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";
import { palette } from "../lib/palette";

export type SearchFieldProps = Omit<TextInputProps, "placeholderTextColor">;

export function SearchField(props: SearchFieldProps) {
	return (
		<View className="flex-row items-center rounded-2xl border border-border bg-background px-4">
			<Ionicons name="search" size={18} color={palette.muted.foreground} />
			<TextInput
				className="flex-1 pl-2 text-foreground"
				style={{ height: 52, fontSize: 18 }}
				placeholderTextColor={palette.muted.foreground}
				autoCorrect={false}
				{...props}
			/>
		</View>
	);
}
