import { Ionicons } from "@expo/vector-icons";
import { type ReactNode, createContext, useCallback, useContext, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Text, View } from "react-native";
import type { AchievementDef } from "../lib/achievements";
import { palette } from "../lib/palette";
import { radius } from "../lib/tokens";

type AchievementToastContextValue = {
	showAchievementToast: (achievement: AchievementDef) => void;
};

const AchievementToastContext = createContext<AchievementToastContextValue>({
	showAchievementToast: () => {},
});

export function useAchievementToast() {
	return useContext(AchievementToastContext);
}

export function AchievementToastProvider({ children }: { children: ReactNode }) {
	const { t } = useTranslation();
	const [achievement, setAchievement] = useState<AchievementDef | null>(null);
	const translateY = useRef(new Animated.Value(-100)).current;
	const opacity = useRef(new Animated.Value(0)).current;
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const showAchievementToast = useCallback(
		(a: AchievementDef) => {
			if (timerRef.current) clearTimeout(timerRef.current);
			setAchievement(a);
			translateY.setValue(-100);
			opacity.setValue(0);

			Animated.parallel([
				Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
				Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
			]).start();

			timerRef.current = setTimeout(() => {
				Animated.parallel([
					Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
					Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
				]).start(() => setAchievement(null));
			}, 3000);
		},
		[translateY, opacity]
	);

	return (
		<AchievementToastContext.Provider value={{ showAchievementToast }}>
			{children}
			{achievement && (
				<Animated.View
					style={{
						position: "absolute",
						top: 60,
						left: 24,
						right: 24,
						transform: [{ translateY }],
						opacity,
						zIndex: 9999,
					}}
				>
					<View
						className="flex-row items-center gap-3 px-4 py-3"
						style={{
							backgroundColor: palette.card.DEFAULT,
							borderRadius: radius.lg,
							borderWidth: 1,
							borderColor: palette.accent.DEFAULT,
						}}
					>
						<Ionicons
							name={achievement.iconName as keyof typeof Ionicons.glyphMap}
							size={24}
							color={palette.accent.DEFAULT}
						/>
						<View className="flex-1">
							<Text className="text-sm font-bold text-foreground">{t(achievement.nameKey)}</Text>
							<Text className="text-xs" style={{ color: palette.muted.foreground }}>
								{t(achievement.descriptionKey)}
							</Text>
						</View>
						<Text className="text-sm font-bold" style={{ color: palette.accent.DEFAULT }}>
							+{achievement.xp} XP
						</Text>
					</View>
				</Animated.View>
			)}
		</AchievementToastContext.Provider>
	);
}
