import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "../../components/IconButton";
import { ProfileTabSelector } from "../../components/ProfileTabSelector";
import { BodyTab } from "../../components/profile/BodyTab";
import { GoalsTab } from "../../components/profile/GoalsTab";
import { RecordsTab } from "../../components/profile/RecordsTab";
import { palette } from "../../lib/palette";

const TABS = [
	{ labelKey: "profile.goals", icon: "flag-outline" as const },
	{ labelKey: "profile.body", icon: "body-outline" as const },
	{ labelKey: "profile.records", icon: "trophy-outline" as const },
];

export default function ProfileScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState(1); // Default to Body

	const tabs = TABS.map((tab) => ({
		label: t(tab.labelKey),
		icon: tab.icon,
	}));

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
			{/* Header */}
			<View className="flex-row items-center justify-between px-6 pt-2 pb-3">
				<Text className="text-2xl font-bold text-foreground">{t("profile.title")}</Text>
				<IconButton
					name="settings-outline"
					size={24}
					color={palette.muted.foreground}
					onPress={() => router.push("/settings")}
					accessibilityLabel="Settings"
				/>
			</View>

			{/* Tab selector */}
			<View className="px-6 mb-4">
				<ProfileTabSelector
					tabs={tabs}
					activeIndex={activeTab}
					onChangeIndex={setActiveTab}
				/>
			</View>

			{/* Tab content */}
			<View className="flex-1 px-6">
				{activeTab === 0 && <GoalsTab />}
				{activeTab === 1 && <BodyTab />}
				{activeTab === 2 && <RecordsTab />}
			</View>
		</SafeAreaView>
	);
}
