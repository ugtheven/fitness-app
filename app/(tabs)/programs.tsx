import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProgramsScreen() {
	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			<View className="flex-1 items-center justify-center px-6">
				<Text className="text-foreground text-2xl font-semibold">Programs</Text>
				<Text className="text-muted-foreground text-sm mt-2 text-center">Liste à venir</Text>
			</View>
		</SafeAreaView>
	);
}
