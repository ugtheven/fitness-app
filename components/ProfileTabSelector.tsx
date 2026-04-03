import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { palette } from "../lib/palette";
import { radius } from "../lib/tokens";

type Tab = {
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
};

type Props = {
	tabs: Tab[];
	activeIndex: number;
	onChangeIndex: (index: number) => void;
};

export function ProfileTabSelector({ tabs, activeIndex, onChangeIndex }: Props) {
	const [containerWidth, setContainerWidth] = useState(0);
	const tabWidth = tabs.length > 0 ? containerWidth / tabs.length : 0;
	const lensX = useSharedValue(activeIndex * tabWidth);

	const targetX = activeIndex * tabWidth;
	if (containerWidth > 0) {
		lensX.value = withTiming(targetX, { duration: 250 });
	}

	const lensStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: lensX.value }],
	}));

	return (
		<View
			style={styles.container}
			onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
		>
			{containerWidth > 0 && (
				<Animated.View
					style={[
						styles.lens,
						{ width: tabWidth - 6, left: 3 },
						lensStyle,
					]}
				/>
			)}
			{tabs.map((tab, i) => {
				const isActive = i === activeIndex;
				const color = isActive ? palette.foreground : palette.muted.foreground;
				return (
					<Pressable
						key={tab.label}
						onPress={() => {
							if (!isActive) {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
								onChangeIndex(i);
							}
						}}
						style={styles.tab}
					>
						<Ionicons name={tab.icon} size={16} color={color} />
						<Text style={[styles.tabLabel, { color, fontWeight: isActive ? "600" : "400" }]}>
							{tab.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		backgroundColor: palette.muted.DEFAULT,
		borderRadius: radius.lg,
		padding: 3,
		position: "relative",
	},
	lens: {
		position: "absolute",
		top: 3,
		bottom: 3,
		borderRadius: radius.md,
		backgroundColor: palette.card.DEFAULT,
	},
	tab: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingVertical: 10,
	},
	tabLabel: {
		fontSize: 14,
	},
});
