import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { BottomDrawer } from "../BottomDrawer";
import { Button } from "../Button";
import { NumberField } from "../NumberField";
import { insertWeightLog } from "../../lib/profileQueries";

function todayStr(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Props = {
	visible: boolean;
	onClose: () => void;
	lastWeight: number | null;
};

export function LogWeightDrawer({ visible, onClose, lastWeight }: Props) {
	const { t } = useTranslation();
	const [weight, setWeight] = useState(lastWeight ?? 70);
	const [saving, setSaving] = useState(false);

	async function handleSave() {
		setSaving(true);
		try {
			await insertWeightLog(todayStr(), weight);
			onClose();
		} finally {
			setSaving(false);
		}
	}

	return (
		<BottomDrawer visible={visible} onClose={onClose} title={t("profile.logWeight")}>
			<View className="gap-4">
				<NumberField
					label={t("profile.weightKg")}
					value={weight}
					onValueChange={setWeight}
					min={20}
					max={300}
					step={0.1}
					endAdornment="kg"
				/>
				<Button label={t("profile.save")} onPress={handleSave} loading={saving} fullWidth />
			</View>
		</BottomDrawer>
	);
}
