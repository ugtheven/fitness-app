import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette } from "../lib/palette";

const TAB_ICONS: Record<
	string,
	{ active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
	index: { active: "home", inactive: "home-outline" },
	activity: { active: "calendar", inactive: "calendar-outline" },
	programs: { active: "barbell", inactive: "barbell-outline" },
	profile: { active: "person", inactive: "person-outline" },
};

const LENS_INSET = 6;

export function Navbar({ state, descriptors, navigation }: BottomTabBarProps) {
	const insets = useSafeAreaInsets();
	const [rowWidth, setRowWidth] = useState(0);
	const tabCount = state.routes.length;
	const tabWidth = tabCount > 0 ? rowWidth / tabCount : 0;

	const lensX = useSharedValue(state.index * tabWidth);

	// Update lens position whenever active tab changes
	const targetX = state.index * tabWidth;
	if (rowWidth > 0) {
		lensX.value = withTiming(targetX, { duration: 250 });
	}

	const lensStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: lensX.value }],
	}));

	return (
		<View style={[styles.wrapper, { paddingBottom: insets.bottom + 8 }]} pointerEvents="box-none">
			<View style={styles.pill}>
				<BlurView style={StyleSheet.absoluteFill} intensity={25} tint="dark" />
				<View style={[StyleSheet.absoluteFill, styles.overlay]} />

				<View
					style={styles.tabRow}
					onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
				>
					{/* Sliding lens */}
					{rowWidth > 0 && (
						<Animated.View
							style={[
								styles.lens,
								{
									width: tabWidth - LENS_INSET * 2,
									left: LENS_INSET,
								},
								lensStyle,
							]}
						/>
					)}

					{state.routes.map((route, index) => {
						const isFocused = state.index === index;
						const { options } = descriptors[route.key];
						const label =
							options.title ??
							(route.name === "index"
								? "Home"
								: route.name.charAt(0).toUpperCase() + route.name.slice(1));
						const icons = TAB_ICONS[route.name] ?? {
							active: "ellipse" as const,
							inactive: "ellipse-outline" as const,
						};
						const color = isFocused ? palette.primary.DEFAULT : palette.muted.foreground;

						return (
							<Pressable
								key={route.key}
								onPress={() => {
									const event = navigation.emit({
										type: "tabPress",
										target: route.key,
										canPreventDefault: true,
									});
									if (!isFocused && !event.defaultPrevented) {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										navigation.navigate(route.name, route.params);
									}
								}}
								style={styles.tabItem}
								accessibilityRole="button"
								accessibilityState={{ selected: isFocused }}
							>
								<Ionicons
									name={isFocused ? icons.active : icons.inactive}
									size={22}
									color={color}
								/>
								<Text
									style={[
										styles.tabLabel,
										{ color, fontWeight: isFocused ? "600" : "400" },
									]}
								>
									{label}
								</Text>
							</Pressable>
						);
					})}
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		paddingHorizontal: 16,
	},
	pill: {
		borderRadius: 28,
		overflow: "hidden",
		borderWidth: 0.5,
		borderColor: "rgba(255,255,255,0.08)",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.35,
		shadowRadius: 16,
		elevation: 16,
	},
	overlay: {
		backgroundColor: "rgba(17,17,17,0.12)",
	},
	tabRow: {
		flexDirection: "row",
		position: "relative",
	},
	lens: {
		position: "absolute",
		top: LENS_INSET,
		bottom: LENS_INSET,
		borderRadius: 22,
		backgroundColor: "rgba(255,255,255,0.08)",
	},
	tabItem: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		height: 56,
	},
	tabLabel: {
		fontSize: 10,
		marginTop: 2,
	},
});
