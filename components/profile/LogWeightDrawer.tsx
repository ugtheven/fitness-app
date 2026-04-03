import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { insertWeightLog } from "../../lib/profileQueries";
import { useUnits } from "../../lib/units";
import { BottomDrawer } from "../BottomDrawer";
import { Button } from "../Button";
import { NumberField } from "../NumberField";

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
	const { displayWeight, toStorageWeight, weightUnit, weightMin, weightMax } = useUnits();
	const [weight, setWeight] = useState(() => displayWeight(lastWeight ?? 70));
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (visible) {
			setWeight(displayWeight(lastWeight ?? 70));
		}
	}, [visible, lastWeight, displayWeight]);

	async function handleSave() {
		setSaving(true);
		try {
			await insertWeightLog(todayStr(), toStorageWeight(weight));
			onClose();
		} finally {
			setSaving(false);
		}
	}

	return (
		<BottomDrawer visible={visible} onClose={onClose} title={t("profile.logWeight")}>
			<View className="gap-4">
				<NumberField
					label={t("profile.weight")}
					value={weight}
					onValueChange={setWeight}
					min={weightMin}
					max={weightMax}
					step={0.1}
					endAdornment={weightUnit}
				/>
				<Button
					variant="glow"
					label={t("profile.save")}
					onPress={handleSave}
					loading={saving}
					fullWidth
				/>
			</View>
		</BottomDrawer>
	);
}
