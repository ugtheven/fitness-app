import "../global.css";
import { Ionicons } from "@expo/vector-icons";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { AchievementToastProvider } from "../components/AchievementToast";
import { db } from "../db";
import migrations from "../drizzle/migrations";
import { AuthProvider, useAuth } from "../lib/auth";
import { initI18n } from "../lib/i18n";
import { palette } from "../lib/palette";
import { radius } from "../lib/tokens";
import {
	UnitContext,
	type UnitSystem,
	buildContextValue,
	loadUnitSystem,
	saveUnitSystem,
} from "../lib/units";

export default function RootLayout() {
	const { success, error } = useMigrations(db, migrations);
	const [i18nReady, setI18nReady] = useState(false);
	const [unitSystem, setUnitSystemState] = useState<UnitSystem>("metric");

	const setUnitSystem = useCallback(async (s: UnitSystem) => {
		setUnitSystemState(s);
		await saveUnitSystem(s);
	}, []);

	useEffect(() => {
		loadUnitSystem().then(setUnitSystemState);
	}, []);

	useEffect(() => {
		console.log("[migrations]", { success, error: error?.message });
		if (success) {
			// HealthKit: request permissions + sync on every app open
			import("../lib/healthkit")
				.then(({ requestHealthKitPermissions, syncHealthKitData }) =>
					requestHealthKitPermissions().then(() => syncHealthKitData())
				)
				.catch((e) => console.error("[healthkit]", e));
		}
	}, [success, error]);

	useEffect(() => {
		initI18n().then(() => setI18nReady(true));
	}, []);

	if (error) {
		return (
			<View className="flex-1 bg-background items-center justify-center px-6">
				<Text className="text-foreground text-center">Migration error: {error.message}</Text>
			</View>
		);
	}

	if (!success || !i18nReady) {
		return (
			<View className="flex-1 bg-background items-center justify-center">
				<Text className="text-muted-foreground">Loading...</Text>
			</View>
		);
	}

	const unitContextValue = buildContextValue(unitSystem, setUnitSystem);

	return (
		<AuthProvider>
			<UnitContext.Provider value={unitContextValue}>
				<AchievementToastProvider>
					<GestureHandlerRootView style={{ flex: 1 }}>
						<AuthGate />
					</GestureHandlerRootView>
				</AchievementToastProvider>
			</UnitContext.Provider>
		</AuthProvider>
	);
}

function AuthGate() {
	const { t } = useTranslation();
	const { user, loading, signInWithGoogle } = useAuth();

	if (loading) {
		return (
			<View className="flex-1 bg-background items-center justify-center">
				<Text className="text-muted-foreground">Loading...</Text>
			</View>
		);
	}

	if (!user) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
				<View className="items-center mb-12">
					<View
						className="items-center justify-center mb-4"
						style={{
							width: 72,
							height: 72,
							borderRadius: radius.xl,
							backgroundColor: palette.card.DEFAULT,
						}}
					>
						<Ionicons name="barbell-outline" size={36} color={palette.foreground} />
					</View>
					<Text className="text-2xl font-bold text-foreground">Fitness App</Text>
				</View>
				<View className="w-full gap-3">
					<Pressable
						onPress={async () => {
							try {
								await signInWithGoogle();
							} catch (e: unknown) {
								const msg = e instanceof Error ? e.message : String(e);
								if (msg.includes("ERR_CANCELED")) return;
								Alert.alert(t("common.error"), msg);
							}
						}}
						className="active:opacity-70"
					>
						<View
							className="flex-row items-center justify-center gap-3 py-4"
							style={{ backgroundColor: palette.foreground, borderRadius: radius.md }}
						>
							<Ionicons name="logo-google" size={20} color={palette.background} />
							<Text className="text-base font-semibold" style={{ color: palette.background }}>
								{t("auth.signInGoogle")}
							</Text>
						</View>
					</Pressable>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: { backgroundColor: palette.background },
			}}
		/>
	);
}
