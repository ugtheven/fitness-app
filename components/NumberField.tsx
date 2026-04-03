import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { palette } from "../lib/palette";
import { radius } from "../lib/tokens";

export type NumberFieldProps = {
	label?: string;
	value: number;
	onValueChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	/** Unité affichée collée à la valeur (ex: "kg", "s") */
	endAdornment?: string;
};

export function NumberField({
	label,
	value,
	onValueChange,
	min,
	max,
	step = 1,
	endAdornment,
}: NumberFieldProps) {
	const [text, setText] = useState(String(value));
	const prevValue = useRef(value);

	useEffect(() => {
		if (value !== prevValue.current) {
			setText(String(value));
			prevValue.current = value;
		}
	}, [value]);

	function clamp(n: number) {
		let result = n;
		if (min !== undefined && result < min) result = min;
		if (max !== undefined && result > max) result = max;
		return result;
	}

	function decrement() {
		const next = clamp(value - step);
		prevValue.current = next;
		setText(String(next));
		onValueChange(next);
	}

	function increment() {
		const next = clamp(value + step);
		prevValue.current = next;
		setText(String(next));
		onValueChange(next);
	}

	function handleChangeText(t: string) {
		setText(t);
		const parsed = Number.parseFloat(t.replace(",", "."));
		if (!Number.isNaN(parsed)) {
			const clamped = clamp(parsed);
			prevValue.current = clamped;
			onValueChange(clamped);
		}
	}

	return (
		<View className="gap-1.5">
			{label && <Text className="text-sm font-medium text-foreground">{label}</Text>}
			<View
				className="flex-row items-center gap-2 border border-border bg-background p-2"
				style={{ borderRadius: radius.lg }}
			>
				{/* − */}
				<Pressable
					onPress={decrement}
					className="h-12 w-12 items-center justify-center bg-muted active:opacity-50"
					style={{ borderRadius: radius.md }}
					accessibilityRole="button"
					accessibilityLabel="Diminuer"
					hitSlop={4}
				>
					<Text className="text-2xl font-medium text-foreground">−</Text>
				</Pressable>

				{/* Value + unit */}
				<View className="flex-1 flex-row items-baseline justify-center">
					<TextInput
						value={text}
						onChangeText={handleChangeText}
						keyboardType="decimal-pad"
						textAlign="center"
						style={{ minWidth: 40 }}
						className="text-2xl font-bold text-foreground"
						placeholderTextColor={palette.muted.foreground}
					/>
					{endAdornment && <Text className="text-lg text-muted-foreground">{endAdornment}</Text>}
				</View>

				{/* + */}
				<Pressable
					onPress={increment}
					className="h-12 w-12 items-center justify-center bg-muted active:opacity-50"
					style={{ borderRadius: radius.md }}
					accessibilityRole="button"
					accessibilityLabel="Augmenter"
					hitSlop={4}
				>
					<Text className="text-2xl font-medium text-foreground">+</Text>
				</Pressable>
			</View>
		</View>
	);
}
