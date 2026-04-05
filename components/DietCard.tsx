import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { palette } from "../lib/palette";
import { radius } from "../lib/tokens";
import { IconButton } from "./IconButton";

type DietMeal = { id: number; name: string; targetTime: string | null };

type DietCardProps = {
	name: string;
	mealCount: number;
	meals: DietMeal[];
	onPress: () => void;
	onDelete: () => void;
};

const MAX_CHIPS = 3;

export function DietCard({ name, mealCount, meals, onPress, onDelete }: DietCardProps) {
	const { t } = useTranslation();
	const overflow = meals.length - MAX_CHIPS;

	return (
		<Pressable onPress={onPress} className="active:opacity-70">
			<View
				className="flex-row items-center gap-4 bg-card px-5 py-4"
				style={{ borderRadius: radius.lg }}
			>
				<View className="bg-muted p-2.5" style={{ borderRadius: radius.md }}>
					<Ionicons name="restaurant-outline" size={20} color={palette.muted.foreground} />
				</View>

				<View className="flex-1">
					<Text className="text-base font-semibold text-foreground">{name}</Text>
					<Text className="mt-0.5 text-xs text-muted-foreground">
						{t("nutrition.mealCount", { count: mealCount })}
					</Text>
					{meals.length > 0 && (
						<View className="mt-2 flex-row flex-wrap gap-1.5">
							{meals.slice(0, MAX_CHIPS).map((m) => (
								<View
									key={m.id}
									className="flex-row items-center rounded-full border border-border bg-background px-3 py-1"
								>
									<Text className="text-xs font-medium text-muted-foreground">
										{m.name}
										{m.targetTime ? ` · ${m.targetTime}` : ""}
									</Text>
								</View>
							))}
							{overflow > 0 && (
								<View className="rounded-full border border-border bg-background px-3 py-1">
									<Text className="text-xs font-medium text-muted-foreground">+{overflow}</Text>
								</View>
							)}
						</View>
					)}
				</View>

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
