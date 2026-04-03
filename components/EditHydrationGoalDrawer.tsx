import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { formatLiters } from "../lib/hydration";
import { palette } from "../lib/palette";
import { BottomDrawer } from "./BottomDrawer";
import { Button } from "./Button";
import { NumberField } from "./NumberField";

type Props = {
	visible: boolean;
	onClose: () => void;
	currentGoal: number;
	autoGoal: number;
	isCustom: boolean;
	hasWeight: boolean;
	onSave: (value: number | null) => void;
};

export function EditHydrationGoalDrawer({
	visible,
	onClose,
	currentGoal,
	autoGoal,
	isCustom,
	hasWeight,
	onSave,
}: Props) {
	const { t } = useTranslation();
	const [value, setValue] = useState(currentGoal);

	useEffect(() => {
		if (visible) setValue(currentGoal);
	}, [visible, currentGoal]);

	return (
		<BottomDrawer visible={visible} onClose={onClose} title={t("hydration.editGoal")}>
			<View className="gap-4">
				{/* Auto goal info */}
				<Text className="text-sm" style={{ color: palette.muted.foreground }}>
					{hasWeight
						? t("hydration.automatic", { value: formatLiters(autoGoal) })
						: t("hydration.defaultGoal", { value: formatLiters(autoGoal) })}
				</Text>

				<NumberField
					label={t("hydration.goal")}
					value={value}
					onValueChange={setValue}
					min={500}
					max={5000}
					step={100}
					endAdornment="ml"
				/>

				<Button variant="glow" fullWidth label={t("profile.save")} onPress={() => onSave(value)} />

				{isCustom && (
					<Pressable onPress={() => onSave(null)} className="items-center py-2 active:opacity-70">
						<Text className="text-xs" style={{ color: palette.muted.foreground }}>
							{t("hydration.resetAutomatic")}
						</Text>
					</Pressable>
				)}
			</View>
		</BottomDrawer>
	);
}
