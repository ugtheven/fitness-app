import { Navbar } from "../../components/Navbar";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
	const { t } = useTranslation();

	return (
		<Tabs
			tabBar={(props) => <Navbar {...props} />}
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tabs.Screen name="index" options={{ title: t("tabs.home") }} />
			<Tabs.Screen name="programs" options={{ title: t("tabs.programs") }} />
			<Tabs.Screen name="settings" options={{ title: t("tabs.settings") }} />
		</Tabs>
	);
}
