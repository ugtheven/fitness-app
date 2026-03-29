import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<View className="flex-1 items-center justify-center px-6">
				<Text className="text-foreground text-2xl font-semibold">Fitness App</Text>
				<Text className="text-muted-foreground text-sm mt-2 text-center">Accueil</Text>
			</View>
		</SafeAreaView>
	);
}
