import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { palette } from "../lib/palette";
import { radius } from "../lib/tokens";
import { IconButton } from "./IconButton";

type FoodCardProps = {
	name: string;
	quantity: number;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	onEdit: () => void;
	onDelete: () => void;
};

export function FoodCard({
	name,
	quantity,
	calories,
	protein,
	carbs,
	fat,
	onEdit,
	onDelete,
}: FoodCardProps) {
	const { t } = useTranslation();

	return (
		<Pressable onPress={onEdit} className="active:opacity-70">
			<View className="gap-2 bg-card px-5 py-4" style={{ borderRadius: radius.lg }}>
				<View className="flex-row items-center justify-between">
					<Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={1}>
						{name}
					</Text>
					<IconButton
						name="trash-outline"
						size={18}
						color={palette.destructive.DEFAULT}
						onPress={onDelete}
						accessibilityLabel={t("common.delete")}
					/>
				</View>
				<Text className="text-xs text-muted-foreground">
					{Math.round(quantity)}
					{t("nutrition.grams")} · {Math.round(calories)} {t("nutrition.kcal")}
				</Text>
				<View className="flex-row gap-3">
					<Text className="text-xs font-medium" style={{ color: palette.blue.DEFAULT }}>
						P: {Math.round(protein)}
						{t("nutrition.grams")}
					</Text>
					<Text className="text-xs font-medium" style={{ color: palette.orange.DEFAULT }}>
						G: {Math.round(carbs)}
						{t("nutrition.grams")}
					</Text>
					<Text className="text-xs font-medium" style={{ color: palette.green.DEFAULT }}>
						L: {Math.round(fat)}
						{t("nutrition.grams")}
					</Text>
				</View>
			</View>
		</Pressable>
	);
}
