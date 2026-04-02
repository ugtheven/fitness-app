import "../global.css";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import migrations from "../drizzle/migrations";
import { db } from "../db";
import { palette } from "../lib/palette";
import { initI18n } from "../lib/i18n";
import { seedWeightLogs } from "../lib/seedWeight";

export default function RootLayout() {
	const { success, error } = useMigrations(db, migrations);
	const [i18nReady, setI18nReady] = useState(false);

	useEffect(() => {
		console.log("[migrations]", { success, error: error?.message });
		if (success) {
			seedWeightLogs().then(() => console.log("[seed] weight logs done"));
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

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: { backgroundColor: palette.background },
				}}
			/>
		</GestureHandlerRootView>
	);
}
