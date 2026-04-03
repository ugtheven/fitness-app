import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { BottomDrawer } from "../BottomDrawer";
import { Button } from "../Button";
import { NumberField } from "../NumberField";
import { upsertHeight } from "../../lib/profileQueries";
import { useUnits } from "../../lib/units";

type Props = {
	visible: boolean;
	onClose: () => void;
	currentHeight: number;
};

export function EditHeightDrawer({ visible, onClose, currentHeight }: Props) {
	const { t } = useTranslation();
	const { displayLength, toStorageLength, lengthUnit, system, heightMin, heightMax, heightStep } = useUnits();
	const defaultHeightCm = currentHeight || 170;
	const [height, setHeight] = useState(() => system === "imperial" ? displayLength(defaultHeightCm) : defaultHeightCm);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (visible) {
			const cm = currentHeight || 170;
			setHeight(system === "imperial" ? displayLength(cm) : cm);
		}
	}, [visible, currentHeight, system, displayLength]);

	async function handleSave() {
		setSaving(true);
		try {
			const cm = system === "imperial" ? toStorageLength(height) : height;
			await upsertHeight(cm);
			onClose();
		} finally {
			setSaving(false);
		}
	}

	return (
		<BottomDrawer visible={visible} onClose={onClose} title={t("profile.editHeight")}>
			<View className="gap-4">
				<NumberField
					label={t("profile.height")}
					value={height}
					onValueChange={setHeight}
					min={heightMin}
					max={heightMax}
					step={heightStep}
					endAdornment={lengthUnit}
				/>
				<Button variant="glow" label={t("profile.save")} onPress={handleSave} loading={saving} fullWidth />
			</View>
		</BottomDrawer>
	);
}
