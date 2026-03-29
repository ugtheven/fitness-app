import { Navbar } from "../../components/Navbar";
import { Tabs } from "expo-router";

export default function TabLayout() {
	return (
		<Tabs
			tabBar={(props) => <Navbar {...props} />}
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tabs.Screen name="index" options={{ title: "Home" }} />
			<Tabs.Screen name="programs" options={{ title: "Programs" }} />
		</Tabs>
	);
}
