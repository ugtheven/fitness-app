import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
	Dimensions,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { palette } from "../lib/palette";
import { radius, spacing } from "../lib/tokens";

const { height: SCREEN_H } = Dimensions.get("window");
const HEADER_H = 64;

export type BottomDrawerProps = {
	visible: boolean;
	onClose: () => void;
	onBack?: () => void;
	title: string;
	children?: ReactNode;
};

export function BottomDrawer({ visible, onClose, onBack, title, children }: BottomDrawerProps) {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation();

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={onBack ?? onClose}
			statusBarTranslucent
		>
			<View style={{ flex: 1, justifyContent: "flex-end" }}>
				<Pressable
					style={{ flex: 1 }}
					onPress={onClose}
					accessibilityRole="button"
					accessibilityLabel={t("common.close")}
				/>

				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					style={{
						width: "100%",
						backgroundColor: palette.card.DEFAULT,
						borderRadius: radius.xl,
					}}
				>
					<View
						className="rounded-t-3xl bg-card"
						style={{ maxHeight: SCREEN_H * 0.85, paddingBottom: Math.max(insets.bottom, 16) }}
					>
						<View
							className="flex-row items-center gap-3 px-5"
							style={{ height: HEADER_H }}
						>
							<Pressable
								onPress={onBack ?? onClose}
								className="rounded-full p-2 active:opacity-70"
								hitSlop={12}
								accessibilityRole="button"
								accessibilityLabel={onBack ? t("common.back") : t("common.close")}
							>
								<Ionicons
									name={onBack ? "arrow-back" : "close"}
									size={26}
									color={palette.foreground}
								/>
							</Pressable>
							<Text className="flex-1 text-xl font-bold text-foreground" numberOfLines={1}>
								{title}
							</Text>
						</View>

						{children && (
							<ScrollView
								keyboardShouldPersistTaps="handled"
								keyboardDismissMode="interactive"
								showsVerticalScrollIndicator={false}
								contentContainerStyle={{ paddingHorizontal: spacing.cardPx, paddingTop: spacing.cardPy, paddingBottom: 8 }}
							>
								{children}
							</ScrollView>
						)}
					</View>
				</KeyboardAvoidingView>
			</View>
		</Modal>
	);
}
