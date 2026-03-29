import "../global.css";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import { Text, View } from "react-native";
import migrations from "../drizzle/migrations";
import { db } from "../db";

export default function RootLayout() {
	const { success, error } = useMigrations(db, migrations);

	if (error) {
		return (
			<View className="flex-1 bg-background items-center justify-center px-6">
				<Text className="text-foreground text-center">Migration error: {error.message}</Text>
			</View>
		);
	}

	if (!success) {
		return (
			<View className="flex-1 bg-background items-center justify-center">
				<Text className="text-muted-foreground">Migration is in progress...</Text>
			</View>
		);
	}

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: { backgroundColor: "#000000" },
			}}
		/>
	);
}
