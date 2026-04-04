import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "../components/ScreenHeader";
import {
	isHealthKitEnabled,
	requestHealthKitPermissions,
	setHealthKitEnabled,
	syncHealthKitData,
} from "../lib/healthkit";
import { todayStr } from "../lib/hydration";
import { resetHydration } from "../lib/hydrationQueries";
import { type Language, changeLanguage } from "../lib/i18n";
import { palette } from "../lib/palette";
import { borders, radius } from "../lib/tokens";
import { type UnitSystem, useUnits } from "../lib/units";

export default function SettingsScreen() {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const currentLang = i18n.language as Language;
	const { system, setSystem } = useUnits();

	const [healthKit, setHealthKit] = useState(false);
	useEffect(() => {
		isHealthKitEnabled().then(setHealthKit);
	}, []);

	async function handleHealthKitToggle(value: boolean) {
		if (value) {
			await requestHealthKitPermissions();
			await setHealthKitEnabled(true);
			setHealthKit(true);
			syncHealthKitData();
		} else {
			await setHealthKitEnabled(false);
			setHealthKit(false);
		}
	}

	async function handleLanguageChange(lang: Language) {
		await changeLanguage(lang);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<ScreenHeader title={t("settings.title")} onBack={() => router.back()} />

			<View className="flex-1 px-6">
				<View className="mt-4 gap-3">
					<Text
						className="text-sm font-medium uppercase tracking-widest"
						style={{ color: palette.muted.foreground }}
					>
						{t("settings.language")}
					</Text>
					<View
						className="overflow-hidden"
						style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
					>
						{(["en", "fr"] as Language[]).map((lang, index, arr) => (
							<Pressable
								key={lang}
								onPress={() => handleLanguageChange(lang)}
								className="active:opacity-70"
							>
								<View
									className="flex-row items-center justify-between px-5 py-4"
									style={
										index < arr.length - 1
											? {
													borderBottomWidth: borders.hairline,
													borderBottomColor: palette.separator,
												}
											: undefined
									}
								>
									<Text className="text-base text-foreground">
										{lang === "en" ? t("settings.english") : t("settings.french")}
									</Text>
									{currentLang === lang && (
										<View
											className="h-5 w-5 rounded-full items-center justify-center"
											style={{ backgroundColor: palette.foreground }}
										>
											<View
												className="h-2 w-2 rounded-full"
												style={{ backgroundColor: palette.background }}
											/>
										</View>
									)}
								</View>
							</Pressable>
						))}
					</View>

					{/* Units */}
					<View className="mt-4 gap-3">
						<Text
							className="text-sm font-medium uppercase tracking-widest"
							style={{ color: palette.muted.foreground }}
						>
							{t("settings.units")}
						</Text>
						<View
							className="overflow-hidden"
							style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
						>
							{(["metric", "imperial"] as UnitSystem[]).map((u, index, arr) => (
								<Pressable key={u} onPress={() => setSystem(u)} className="active:opacity-70">
									<View
										className="flex-row items-center justify-between px-5 py-4"
										style={
											index < arr.length - 1
												? {
														borderBottomWidth: borders.hairline,
														borderBottomColor: palette.separator,
													}
												: undefined
										}
									>
										<Text className="text-base text-foreground">{t(`settings.${u}`)}</Text>
										{system === u && (
											<View
												className="h-5 w-5 rounded-full items-center justify-center"
												style={{ backgroundColor: palette.foreground }}
											>
												<View
													className="h-2 w-2 rounded-full"
													style={{ backgroundColor: palette.background }}
												/>
											</View>
										)}
									</View>
								</Pressable>
							))}
						</View>
					</View>
				</View>

				{/* Apple Health */}
				<View className="mt-4 gap-3">
					<Text
						className="text-sm font-medium uppercase tracking-widest"
						style={{ color: palette.muted.foreground }}
					>
						{t("settings.appleHealth")}
					</Text>
					<Text className="text-xs mb-1" style={{ color: palette.muted.foreground }}>
						{t("settings.appleHealthDesc")}
					</Text>
					<View
						className="overflow-hidden"
						style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
					>
						{(["enabled", "disabled"] as const).map((option, index, arr) => (
							<Pressable
								key={option}
								onPress={() => handleHealthKitToggle(option === "enabled")}
								className="active:opacity-70"
							>
								<View
									className="flex-row items-center justify-between px-5 py-4"
									style={
										index < arr.length - 1
											? {
													borderBottomWidth: borders.hairline,
													borderBottomColor: palette.separator,
												}
											: undefined
									}
								>
									<View className="flex-row items-center gap-3">
										<Ionicons name="heart-outline" size={20} color={palette.foreground} />
										<Text className="text-base text-foreground">{t(`settings.${option}`)}</Text>
									</View>
									{healthKit === (option === "enabled") && (
										<View
											className="h-5 w-5 rounded-full items-center justify-center"
											style={{ backgroundColor: palette.foreground }}
										>
											<View
												className="h-2 w-2 rounded-full"
												style={{ backgroundColor: palette.background }}
											/>
										</View>
									)}
								</View>
							</Pressable>
						))}
					</View>

					{/* Data */}
					<View className="mt-4 gap-3">
						<Text
							className="text-sm font-medium uppercase tracking-widest"
							style={{ color: palette.muted.foreground }}
						>
							{t("settings.data")}
						</Text>
						<View
							className="overflow-hidden"
							style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
						>
							<Pressable
								onPress={() => {
									Alert.alert(t("settings.resetHydration"), undefined, [
										{ text: t("common.cancel"), style: "cancel" },
										{
											text: t("common.confirm"),
											style: "destructive",
											onPress: () => resetHydration(todayStr()),
										},
									]);
								}}
								className="active:opacity-70"
							>
								<View className="flex-row items-center gap-3 px-5 py-4">
									<Ionicons name="water-outline" size={20} color={palette.destructive.DEFAULT} />
									<Text className="text-base" style={{ color: palette.destructive.DEFAULT }}>
										{t("settings.resetHydration")}
									</Text>
								</View>
							</Pressable>
						</View>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}
