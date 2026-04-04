import { Ionicons } from "@expo/vector-icons";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Animated, Text, View } from "react-native";
import type { AchievementDef } from "../lib/achievements";
import { palette } from "../lib/palette";
import { radius } from "../lib/tokens";

type AchievementToastContextValue = {
	showAchievementToast: (achievement: AchievementDef) => void;
	showLevelUpToast: (level: number) => void;
};

const AchievementToastContext = createContext<AchievementToastContextValue>({
	showAchievementToast: () => {},
	showLevelUpToast: () => {},
});

export function useAchievementToast() {
	return useContext(AchievementToastContext);
}

export function AchievementToastProvider({ children }: { children: ReactNode }) {
	const { t } = useTranslation();
	const [achievement, setAchievement] = useState<AchievementDef | null>(null);
	const [levelUp, setLevelUp] = useState<number | null>(null);
	const translateY = useRef(new Animated.Value(-100)).current;
	const opacity = useRef(new Animated.Value(0)).current;
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Cleanup timer on unmount
	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	const animateIn = useCallback(() => {
		translateY.setValue(-100);
		opacity.setValue(0);
		Animated.parallel([
			Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
			Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
		]).start();
	}, [translateY, opacity]);

	const animateOut = useCallback(
		(onDone: () => void) => {
			Animated.parallel([
				Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
				Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
			]).start(onDone);
		},
		[translateY, opacity]
	);

	const showAchievementToast = useCallback(
		(a: AchievementDef) => {
			if (timerRef.current) clearTimeout(timerRef.current);
			setLevelUp(null);
			setAchievement(a);
			animateIn();

			timerRef.current = setTimeout(() => {
				animateOut(() => setAchievement(null));
			}, 3000);
		},
		[animateIn, animateOut]
	);

	const showLevelUpToast = useCallback(
		(level: number) => {
			if (timerRef.current) clearTimeout(timerRef.current);
			setAchievement(null);
			setLevelUp(level);
			animateIn();

			timerRef.current = setTimeout(() => {
				animateOut(() => setLevelUp(null));
			}, 4000);
		},
		[animateIn, animateOut]
	);

	const showToast = achievement != null || levelUp != null;

	return (
		<AchievementToastContext.Provider value={{ showAchievementToast, showLevelUpToast }}>
			{children}
			{showToast && (
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
					{achievement != null && (
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
					)}
					{levelUp != null && (
						<View
							className="flex-row items-center gap-3 px-4 py-3"
							style={{
								backgroundColor: palette.card.DEFAULT,
								borderRadius: radius.lg,
								borderWidth: 1,
								borderColor: palette.accent.DEFAULT,
							}}
						>
							<Ionicons name="star" size={24} color={palette.accent.DEFAULT} />
							<View className="flex-1">
								<Text className="text-sm font-bold text-foreground">{t("xp.levelUp")}</Text>
								<Text className="text-xs" style={{ color: palette.muted.foreground }}>
									{t("xp.levelUpToast", { level: levelUp })}
								</Text>
							</View>
						</View>
					)}
				</Animated.View>
			)}
		</AchievementToastContext.Provider>
	);
}
