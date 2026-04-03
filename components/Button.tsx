import { cloneElement, forwardRef, isValidElement, type ComponentRef, type ReactNode, useRef } from "react";
import { ActivityIndicator, Animated, Pressable, Text, View } from "react-native";
import type { GestureResponderEvent, PressableProps } from "react-native";
import { palette } from "../lib/palette";
import { radius } from "../lib/tokens";

export type ButtonProps = Omit<PressableProps, "children"> & {
	label: string;
	startIcon?: ReactNode;
	/** Étire le bouton sur toute la largeur du parent (ex. drawer, formulaire). */
	fullWidth?: boolean;
	loading?: boolean;
	/** "solid" = fond blanc, texte noir. "glow" = fond sombre, bordure lumineuse, halo subtil, texte blanc. */
	variant?: "solid" | "glow";
};

export const Button = forwardRef<ComponentRef<typeof Pressable>, ButtonProps>(function Button(
	{
		label,
		startIcon,
		fullWidth,
		disabled,
		loading,
		variant = "solid",
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
	const isGlow = variant === "glow";
	const textColor = isGlow ? palette.foreground : palette.primary.foreground;

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
						borderRadius: radius.lg,
						paddingHorizontal: 16,
						paddingVertical: 14,
						...(isGlow
							? {
									backgroundColor: "rgba(255,255,255,0.08)",
									borderWidth: 1,
									borderColor: "rgba(255,255,255,0.15)",
									borderTopColor: "rgba(255,255,255,0.30)",
									shadowColor: "#FFFFFF",
									shadowOffset: { width: 0, height: 0 },
									shadowOpacity: 0.12,
									shadowRadius: 12,
								}
							: { backgroundColor: palette.primary.DEFAULT }),
					},
					{ transform: [{ scale }] },
				]}
			>
				{loading && <ActivityIndicator size="small" color={textColor} />}
				{!loading && startIcon && (isValidElement(startIcon) ? cloneElement(startIcon as React.ReactElement<{ color?: string }>, { color: textColor }) : startIcon)}
				<Text className="text-lg font-bold" style={{ color: textColor }}>{label}</Text>
			</Animated.View>
		</Pressable>
	);
});
