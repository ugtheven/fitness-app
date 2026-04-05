import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { palette } from "../lib/palette";

type BarcodeScannerProps = {
	visible: boolean;
	onScanned: (barcode: string) => void;
	onClose: () => void;
};

export function BarcodeScanner({ visible, onScanned, onClose }: BarcodeScannerProps) {
	const { t } = useTranslation();
	const [permission, requestPermission] = useCameraPermissions();
	const lastScanned = useRef<string | null>(null);

	// Pulsating border animation
	const borderOpacity = useSharedValue(0.4);
	useEffect(() => {
		borderOpacity.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
	}, [borderOpacity]);
	const borderStyle = useAnimatedStyle(() => ({
		borderColor: `rgba(245, 245, 245, ${borderOpacity.value})`,
	}));

	const handleBarcodeScanned = useCallback(
		({ data }: { data: string }) => {
			if (data === lastScanned.current) return;
			lastScanned.current = data;
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			onScanned(data);
		},
		[onScanned]
	);

	async function handleRequestPermission() {
		await requestPermission();
	}

	return (
		<Modal visible={visible} animationType="slide" statusBarTranslucent>
			<View className="flex-1 bg-background">
				{!permission?.granted ? (
					<View className="flex-1 items-center justify-center gap-4 px-8">
						<Ionicons name="camera-outline" size={48} color={palette.muted.foreground} />
						<Text className="text-center text-base text-foreground">
							{t("nutrition.cameraPermission")}
						</Text>
						<Text className="text-center text-sm text-muted-foreground">
							{t("nutrition.cameraPermissionHint")}
						</Text>
						<Pressable
							onPress={handleRequestPermission}
							className="rounded-full bg-primary px-6 py-3 active:opacity-70"
						>
							<Text className="text-base font-semibold text-primary-foreground">
								{t("nutrition.allowCamera")}
							</Text>
						</Pressable>
					</View>
				) : (
					<CameraView
						style={StyleSheet.absoluteFill}
						facing="back"
						barcodeScannerSettings={{
							barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
						}}
						onBarcodeScanned={handleBarcodeScanned}
					>
						<View className="flex-1 items-center justify-center">
							<Animated.View
								style={[
									{
										width: 250,
										height: 250,
										borderWidth: 2,
										borderRadius: 16,
									},
									borderStyle,
								]}
							/>
							<Text className="mt-4 text-base font-medium text-foreground">
								{t("nutrition.scanning")}
							</Text>
						</View>
					</CameraView>
				)}

				{/* Close button */}
				<View className="absolute left-4 top-16">
					<Pressable
						onPress={() => {
							lastScanned.current = null;
							onClose();
						}}
						className="rounded-full bg-card p-3 active:opacity-70"
					>
						<Ionicons name="close" size={24} color={palette.foreground} />
					</Pressable>
				</View>
			</View>
		</Modal>
	);
}
