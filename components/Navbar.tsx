import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Navbar({ state, descriptors, navigation }: BottomTabBarProps) {
	return (
		<SafeAreaView edges={["bottom"]} className="bg-black pt-3">
			<View className="flex-row items-center justify-around">
				{state.routes.map((route, index) => {
					const { options } = descriptors[route.key];
					const label =
						options.title ??
						(route.name === "index"
							? "Home"
							: route.name.charAt(0).toUpperCase() + route.name.slice(1));
					const isFocused = state.index === index;

					return (
						<Pressable
							key={route.key}
							onPress={() => {
								const event = navigation.emit({
									type: "tabPress",
									target: route.key,
									canPreventDefault: true,
								});
								if (!isFocused && !event.defaultPrevented) {
									navigation.navigate(route.name, route.params);
								}
							}}
							className="px-5 py-2 active:opacity-70"
							accessibilityRole="button"
							accessibilityState={{ selected: isFocused }}
						>
							<Text
								className={`text-[15px] ${isFocused ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}`}
							>
								{label}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</SafeAreaView>
	);
}
