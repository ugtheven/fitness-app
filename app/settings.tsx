import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "../components/ScreenHeader";
import { changeLanguage, type Language } from "../lib/i18n";
import { palette } from "../lib/palette";

export default function SettingsScreen() {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const currentLang = i18n.language as Language;

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
					<View className="rounded-2xl overflow-hidden" style={{ backgroundColor: palette.card.DEFAULT }}>
						{(["en", "fr"] as Language[]).map((lang, index, arr) => (
							<Pressable
								key={lang}
								onPress={() => handleLanguageChange(lang)}
								className="active:opacity-70"
							>
								<View
									className="flex-row items-center justify-between px-5 py-4"
									style={index < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: palette.border } : undefined}
								>
									<Text className="text-base text-foreground">
										{lang === "en" ? t("settings.english") : t("settings.french")}
									</Text>
									{currentLang === lang && (
										<View
											className="h-5 w-5 rounded-full items-center justify-center"
											style={{ backgroundColor: palette.foreground }}
										>
											<View className="h-2 w-2 rounded-full" style={{ backgroundColor: palette.background }} />
										</View>
									)}
								</View>
							</Pressable>
						))}
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}
