import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { insertBodyMeasurements, updateMeasurementField } from "../../lib/profileQueries";
import { useUnits } from "../../lib/units";
import { BottomDrawer } from "../BottomDrawer";
import { Button } from "../Button";
import { NumberField } from "../NumberField";

type MeasurementKey =
	| "bodyFat"
	| "shoulders"
	| "chest"
	| "waist"
	| "hips"
	| "neck"
	| "arms"
	| "thigh"
	| "calf";

function todayStr(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Props = {
	visible: boolean;
	onClose: () => void;
	measurementKey: MeasurementKey;
	lastValue: number | null;
	/** If provided, drawer is in edit mode for this date */
	editDate?: string;
};

export function LogSingleMeasurementDrawer({
	visible,
	onClose,
	measurementKey,
	lastValue,
	editDate,
}: Props) {
	const { t } = useTranslation();
	const { toStorageLength, lengthUnit } = useUnits();
	const isBodyFat = measurementKey === "bodyFat";
	const unit = isBodyFat ? "%" : lengthUnit;
	const step = isBodyFat ? 0.1 : 0.5;
	const isEdit = editDate != null;

	const [value, setValue] = useState(lastValue ?? 0);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (visible) {
			setValue(lastValue ?? 0);
		}
	}, [visible, lastValue]);

	async function handleSave() {
		if (value <= 0) return;
		setSaving(true);
		try {
			const storageValue = isBodyFat ? value : toStorageLength(value);
			if (isEdit) {
				await updateMeasurementField(editDate, measurementKey, storageValue);
			} else {
				await insertBodyMeasurements({ date: todayStr(), [measurementKey]: storageValue });
			}
			onClose();
		} finally {
			setSaving(false);
		}
	}

	const title = isEdit
		? `${t("profile.edit")} ${t(`profile.${measurementKey}`)}`
		: `${t("profile.log")} ${t(`profile.${measurementKey}`)}`;

	return (
		<BottomDrawer visible={visible} onClose={onClose} title={title}>
			<View className="gap-4">
				<NumberField
					label={t(`profile.${measurementKey}`)}
					value={value}
					onValueChange={setValue}
					min={0}
					max={isBodyFat ? 60 : 200}
					step={step}
					endAdornment={unit}
				/>
				<Button
					variant="glow"
					label={t("profile.save")}
					onPress={handleSave}
					loading={saving}
					fullWidth
					disabled={value <= 0}
				/>
			</View>
		</BottomDrawer>
	);
}
