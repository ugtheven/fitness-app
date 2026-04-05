import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { palette } from "../lib/palette";
import { radius, shadows } from "../lib/tokens";
import { IconButton } from "./IconButton";

type MealCardProps = {
	name: string;
	targetTime: string | null;
	foodCount: number;
	calories: number;
	isDragging?: boolean;
	onPress: () => void;
	onDelete: () => void;
};

export function MealCard({
	name,
	targetTime,
	foodCount,
	calories,
	isDragging,
	onPress,
	onDelete,
}: MealCardProps) {
	const { t } = useTranslation();

	const subtitle =
		calories > 0
			? `${t("nutrition.foodCount", { count: foodCount })} · ${Math.round(calories)} ${t("nutrition.kcal")}`
			: t("nutrition.foodCount", { count: foodCount });

	return (
		<Pressable onPress={onPress} className="active:opacity-70">
			<View
				className="flex-row items-center gap-3 bg-card px-5 py-4"
				style={[{ borderRadius: radius.lg }, isDragging ? shadows.drag : undefined]}
			>
				<Ionicons name="reorder-three-outline" size={22} color={palette.muted.foreground} />
				<View className="flex-1">
					<Text className="text-base font-semibold text-foreground">{name}</Text>
					<Text className="mt-0.5 text-xs text-muted-foreground">{subtitle}</Text>
				</View>
				{targetTime && (
					<View className="rounded-full border border-border bg-background px-2.5 py-1">
						<Text className="text-xs font-medium text-muted-foreground">{targetTime}</Text>
					</View>
				)}
				<View className="flex-row items-center">
					<IconButton
						name="trash-outline"
						size={18}
						color={palette.destructive.DEFAULT}
						onPress={onDelete}
						accessibilityLabel={t("common.delete")}
					/>
					<Ionicons name="chevron-forward" size={18} color={palette.muted.foreground} />
				</View>
			</View>
		</Pressable>
	);
}
