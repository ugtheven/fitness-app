import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { BottomDrawer } from "../BottomDrawer";
import { Button } from "../Button";
import { NumberField } from "../NumberField";
import { insertBodyMeasurements } from "../../lib/profileQueries";

function todayStr(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type MeasurementKey = "bodyFat" | "shoulders" | "chest" | "waist" | "hips" | "neck" | "arms" | "thigh" | "calf";

const FIELDS: { key: MeasurementKey; step: number; unit: string }[] = [
	{ key: "bodyFat", step: 0.1, unit: "%" },
	{ key: "shoulders", step: 0.5, unit: "cm" },
	{ key: "chest", step: 0.5, unit: "cm" },
	{ key: "waist", step: 0.5, unit: "cm" },
	{ key: "hips", step: 0.5, unit: "cm" },
	{ key: "neck", step: 0.5, unit: "cm" },
	{ key: "arms", step: 0.5, unit: "cm" },
	{ key: "thigh", step: 0.5, unit: "cm" },
	{ key: "calf", step: 0.5, unit: "cm" },
];

type Props = {
	visible: boolean;
	onClose: () => void;
	lastValues: Partial<Record<MeasurementKey, number | null>>;
};

export function LogMeasurementsDrawer({ visible, onClose, lastValues }: Props) {
	const { t } = useTranslation();
	const [values, setValues] = useState<Record<MeasurementKey, number>>(() => {
		const init: Record<string, number> = {};
		for (const f of FIELDS) {
			init[f.key] = lastValues[f.key] ?? 0;
		}
		return init as Record<MeasurementKey, number>;
	});
	const [saving, setSaving] = useState(false);

	function updateField(key: MeasurementKey, val: number) {
		setValues((prev) => ({ ...prev, [key]: val }));
	}

	async function handleSave() {
		setSaving(true);
		try {
			const data: Record<string, number | null | string> = { date: todayStr() };
			for (const f of FIELDS) {
				data[f.key] = values[f.key] > 0 ? values[f.key] : null;
			}
			await insertBodyMeasurements(data as Parameters<typeof insertBodyMeasurements>[0]);
			onClose();
		} finally {
			setSaving(false);
		}
	}

	return (
		<BottomDrawer visible={visible} onClose={onClose} title={t("profile.logMeasurements")}>
			<View className="gap-3">
				{FIELDS.map((f) => (
					<NumberField
						key={f.key}
						label={t(`profile.${f.key}`)}
						value={values[f.key]}
						onValueChange={(v) => updateField(f.key, v)}
						min={0}
						max={f.key === "bodyFat" ? 60 : 200}
						step={f.step}
						endAdornment={f.unit}
					/>
				))}
				<View className="mt-2">
					<Button label={t("profile.save")} onPress={handleSave} loading={saving} fullWidth />
				</View>
			</View>
		</BottomDrawer>
	);
}
