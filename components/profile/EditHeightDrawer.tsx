import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { BottomDrawer } from "../BottomDrawer";
import { Button } from "../Button";
import { NumberField } from "../NumberField";
import { upsertHeight } from "../../lib/profileQueries";

type Props = {
	visible: boolean;
	onClose: () => void;
	currentHeight: number;
};

export function EditHeightDrawer({ visible, onClose, currentHeight }: Props) {
	const { t } = useTranslation();
	const [height, setHeight] = useState(currentHeight || 170);
	const [saving, setSaving] = useState(false);

	async function handleSave() {
		setSaving(true);
		try {
			await upsertHeight(height);
			onClose();
		} finally {
			setSaving(false);
		}
	}

	return (
		<BottomDrawer visible={visible} onClose={onClose} title={t("profile.editHeight")}>
			<View className="gap-4">
				<NumberField
					label={t("profile.heightCm")}
					value={height}
					onValueChange={setHeight}
					min={100}
					max={250}
					step={1}
					endAdornment="cm"
				/>
				<Button label={t("profile.save")} onPress={handleSave} loading={saving} fullWidth />
			</View>
		</BottomDrawer>
	);
}
