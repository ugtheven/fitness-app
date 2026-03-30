import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/index";
import fr from "./locales/fr/index";

export type Language = "en" | "fr";
const LANGUAGE_KEY = "app_language";

export const resources = { en: { translation: en }, fr: { translation: fr } } as const;

export async function initI18n() {
	const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
	const lng: Language = (stored as Language) ?? "en";

	await i18n.use(initReactI18next).init({
		resources,
		lng,
		fallbackLng: "en",
		interpolation: { escapeValue: false },
	});
}

export async function changeLanguage(lang: Language) {
	await i18n.changeLanguage(lang);
	await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

export { i18n };
