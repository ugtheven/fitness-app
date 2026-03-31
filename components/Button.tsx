import { forwardRef, type ComponentRef, type ReactNode, useRef } from "react";
import { ActivityIndicator, Animated, Pressable, Text } from "react-native";
import type { GestureResponderEvent, PressableProps } from "react-native";
import { palette } from "../lib/palette";

export type ButtonProps = Omit<PressableProps, "children"> & {
	label: string;
	startIcon?: ReactNode;
	/** Étire le bouton sur toute la largeur du parent (ex. drawer, formulaire). */
	fullWidth?: boolean;
	loading?: boolean;
};

export const Button = forwardRef<ComponentRef<typeof Pressable>, ButtonProps>(function Button(
	{
		label,
		startIcon,
		fullWidth,
		disabled,
		loading,
		className,
		accessibilityLabel,
		onPressIn,
		onPressOut,
		...pressableProps
	},
	ref
) {
	const scale = useRef(new Animated.Value(1)).current;

	const animateTo = (toValue: number) => {
		Animated.spring(scale, {
			friction: 6,
			tension: 320,
			useNativeDriver: true,
			toValue,
		}).start();
	};

	const handlePressIn = (e: GestureResponderEvent) => {
		if (!disabled && !loading) animateTo(0.96);
		onPressIn?.(e);
	};

	const handlePressOut = (e: GestureResponderEvent) => {
		animateTo(1);
		onPressOut?.(e);
	};

	const isDisabled = disabled || loading;

	return (
		<Pressable
			ref={ref}
			disabled={isDisabled}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel ?? label}
			accessibilityState={{ disabled: !!isDisabled }}
			className={`${fullWidth ? "w-full self-stretch" : "shrink-0 self-start"} ${isDisabled ? "opacity-50" : ""} ${className ?? ""}`}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			{...pressableProps}
		>
			<Animated.View
				style={[
					{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						gap: 8,
						alignSelf: fullWidth ? "stretch" : "flex-start",
						width: fullWidth ? "100%" : undefined,
						borderRadius: 16,
						backgroundColor: palette.primary.DEFAULT,
						paddingHorizontal: 12,
						paddingVertical: 12,
					},
					{ transform: [{ scale }] },
				]}
			>
				{loading ? (
					<ActivityIndicator size="small" color="#fff" />
				) : (
					<>
						{startIcon}
						<Text className="text-lg font-bold text-white">{label}</Text>
					</>
				)}
			</Animated.View>
		</Pressable>
	);
});
