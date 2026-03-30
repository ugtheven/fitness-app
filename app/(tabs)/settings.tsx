import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { changeLanguage, type Language } from "../../lib/i18n";

export default function SettingsScreen() {
	const { t, i18n } = useTranslation();
	const currentLang = i18n.language as Language;

	async function handleLanguageChange(lang: Language) {
		await changeLanguage(lang);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<View className="flex-1 px-6 pt-2">
				<Text className="text-4xl font-bold text-foreground">{t("settings.title")}</Text>

				<View className="mt-8 gap-3">
					<Text className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
						{t("settings.language")}
					</Text>
					<View className="rounded-2xl bg-card overflow-hidden">
						{(["en", "fr"] as Language[]).map((lang, index, arr) => (
							<Pressable
								key={lang}
								onPress={() => handleLanguageChange(lang)}
								className="active:opacity-70"
							>
								<View
									className={`flex-row items-center justify-between px-5 py-4 ${
										index < arr.length - 1 ? "border-b border-border" : ""
									}`}
								>
									<Text className="text-base text-foreground">
										{lang === "en" ? t("settings.english") : t("settings.french")}
									</Text>
									{currentLang === lang && (
										<View className="h-5 w-5 rounded-full bg-foreground items-center justify-center">
											<View className="h-2 w-2 rounded-full bg-background" />
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
