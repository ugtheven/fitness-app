import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
	name: "fitness-app",
	slug: "fitness-app",
	version: "0.1.0",
	scheme: "fitness-app",
	orientation: "portrait",
	userInterfaceStyle: "dark",
	splash: {
		backgroundColor: "#000000",
	},
	ios: {
		supportsTablet: true,
		bundleIdentifier: "com.anonymous.fitnessapp",
		infoPlist: {
			CFBundleURLTypes: [
				{
					CFBundleURLSchemes: [
						`com.googleusercontent.apps.${(process.env.GOOGLE_IOS_CLIENT_ID ?? "").split(".")[0]}`,
					],
				},
			],
		},
	},
	android: {
		adaptiveIcon: {
			backgroundColor: "#000000",
		},
		predictiveBackGestureEnabled: false,
		softwareKeyboardLayoutMode: "resize",
		package: "com.anonymous.fitnessapp",
	},
	plugins: [
		"expo-sqlite",
		"expo-router",
		"@react-native-community/datetimepicker",
		[
			"@kingstinct/react-native-healthkit",
			{
				NSHealthShareUsageDescription:
					"This app reads your weight, height and step count from Apple Health.",
			},
		],
		[
			"expo-camera",
			{
				cameraPermission: "This app uses the camera to scan food barcodes.",
			},
		],
		"@react-native-google-signin/google-signin",
	],
	extra: {
		googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
		googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
	},
};

export default config;
