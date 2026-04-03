import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Chip } from "./Chip";

type ChipListProps = {
	labels: string[];
};

const GAP = 4; // gap-1 = 4px

export function ChipList({ labels }: ChipListProps) {
	const [containerWidth, setContainerWidth] = useState(0);
	const [chipWidths, setChipWidths] = useState<Record<number, number>>({});
	const [measureEpoch, setMeasureEpoch] = useState(0);
	const prevLabelsKey = useRef("");

	useEffect(() => {
		const key = labels.join("\0");
		if (key !== prevLabelsKey.current) {
			prevLabelsKey.current = key;
			setChipWidths({});
			setMeasureEpoch((e) => e + 1);
		}
	});

	const allMeasured = containerWidth > 0 && Object.keys(chipWidths).length === labels.length;

	let visibleCount = labels.length;
	let overflow = 0;

	if (allMeasured) {
		let used = 0;
		visibleCount = 0;
		for (let i = 0; i < labels.length; i++) {
			const w = chipWidths[i] ?? 0;
			const gap = visibleCount > 0 ? GAP : 0;
			const remaining = labels.length - i - 1;
			const overflowReserve = remaining > 0 ? GAP + 44 : 0;
			if (used + gap + w + overflowReserve <= containerWidth) {
				used += gap + w;
				visibleCount++;
			} else {
				break;
			}
		}
		overflow = labels.length - visibleCount;
	}

	return (
		<View
			style={{ flexDirection: "row", gap: GAP }}
			onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
		>
			{labels.map((label, i) => (
				<View
					key={`${measureEpoch}-${label}`}
					style={{ position: "absolute", opacity: 0 }}
					pointerEvents="none"
					onLayout={(e) => {
						const w = e.nativeEvent.layout.width;
						setChipWidths((prev) => ({ ...prev, [i]: w }));
					}}
				>
					<Chip label={label} />
				</View>
			))}

			{allMeasured &&
				labels
					.slice(0, visibleCount)
					.map((label, i) => <Chip key={`${i}-${label}`} label={label} />)}
			{allMeasured && overflow > 0 && <Chip label={`+${overflow}`} />}
		</View>
	);
}
