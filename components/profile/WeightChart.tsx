import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import Svg, { Circle, Line as SvgLine, Path, Text as SvgText } from "react-native-svg";
import { palette } from "../../lib/palette";
import { useUnits } from "../../lib/units";

type DataPoint = { date: string; weightKg: number };
type Props = { data: DataPoint[] };

const CHART_HEIGHT = 200;
const PAD = { top: 24, right: 20, bottom: 32, left: 44 };

export function WeightChart({ data }: Props) {
	const { t } = useTranslation();

	if (data.length === 0) {
		return (
			<View
				className="rounded-2xl items-center justify-center"
				style={{ backgroundColor: palette.card.DEFAULT, height: CHART_HEIGHT + PAD.top + PAD.bottom }}
			>
				<Text style={{ color: palette.muted.foreground }}>{t("profile.noData")}</Text>
			</View>
		);
	}

	return (
		<View className="rounded-2xl overflow-hidden" style={{ backgroundColor: palette.card.DEFAULT }}>
			<Text
				className="text-xs font-semibold uppercase tracking-widest px-4 pt-4 mb-1"
				style={{ color: palette.muted.foreground }}
			>
				{t("profile.weightEvolution")}
			</Text>
			<View style={{ height: CHART_HEIGHT + PAD.top + PAD.bottom }}>
				<ChartContent data={data} />
			</View>
		</View>
	);
}

function ChartContent({ data }: { data: DataPoint[] }) {
	const [width, setWidth] = useState(0);
	const { displayWeight, weightUnit } = useUnits();

	const chart = useMemo(() => {
		if (width === 0 || data.length === 0) return null;

		const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
		const firstMs = new Date(sorted[0].date).getTime();
		const points = sorted.map((d) => ({
			x: (new Date(d.date).getTime() - firstMs) / 86400000,
			y: displayWeight(d.weightKg),
			date: d.date,
		}));

		const weights = points.map((p) => p.y);
		const minW = Math.min(...weights);
		const maxW = Math.max(...weights);
		const padY = Math.max(1, (maxW - minW) * 0.25);
		const yMin = minW - padY;
		const yMax = maxW + padY;

		const xMax = points[points.length - 1].x || 1;

		const plotW = width - PAD.left - PAD.right;
		const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;

		const toX = (day: number) => PAD.left + (day / xMax) * plotW;
		const toY = (w: number) => PAD.top + plotH - ((w - yMin) / (yMax - yMin)) * plotH;

		// Data path
		const pathParts = points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.x)},${toY(p.y)}`);
		const dataPath = pathParts.join(" ");

		// Y axis ticks (4 values)
		const yTicks: number[] = [];
		const yStep = (yMax - yMin) / 4;
		for (let i = 0; i <= 4; i++) {
			yTicks.push(Math.round((yMin + yStep * i) * 10) / 10);
		}

		// X axis ticks (~4 dates)
		const xStep = Math.max(1, Math.floor(xMax / 4));
		const xTicks: { day: number; label: string }[] = [];
		for (let d = 0; d <= xMax; d += xStep) {
			const date = new Date(firstMs + d * 86400000);
			const m = date.toLocaleString("default", { month: "short" });
			xTicks.push({ day: d, label: `${m} ${date.getDate()}` });
		}

		// Latest point for value label
		const latestPoint = points[points.length - 1];

		return { dataPath, points, yTicks, xTicks, toX, toY, latestPoint };
	}, [data, width, displayWeight]);

	if (!chart) {
		return <View style={{ flex: 1 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} />;
	}

	return (
		<View style={{ flex: 1 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
			<Svg width={width} height={CHART_HEIGHT}>
				{/* Y grid lines */}
				{chart.yTicks.map((v) => (
					<SvgLine
						key={`yg-${v}`}
						x1={PAD.left}
						x2={width - PAD.right}
						y1={chart.toY(v)}
						y2={chart.toY(v)}
						stroke={palette.border}
						strokeDasharray="4,4"
					/>
				))}

				{/* Y axis labels */}
				{chart.yTicks.map((v) => (
					<SvgText
						key={`yl-${v}`}
						x={PAD.left - 6}
						y={chart.toY(v) + 4}
						fill={palette.muted.foreground}
						fontSize={10}
						textAnchor="end"
					>
						{v}
					</SvgText>
				))}

				{/* X axis labels */}
				{chart.xTicks.map((tick) => (
					<SvgText
						key={`xl-${tick.day}`}
						x={chart.toX(tick.day)}
						y={CHART_HEIGHT - 4}
						fill={palette.muted.foreground}
						fontSize={10}
						textAnchor="middle"
					>
						{tick.label}
					</SvgText>
				))}

				{/* Data line */}
				<Path
					d={chart.dataPath}
					stroke={palette.primary.DEFAULT}
					strokeWidth={2.5}
					fill="none"
				/>

				{/* Data points */}
				{chart.points.map((p) => (
					<Circle
						key={`pt-${p.date}`}
						cx={chart.toX(p.x)}
						cy={chart.toY(p.y)}
						r={4}
						fill={palette.background}
						stroke={palette.primary.DEFAULT}
						strokeWidth={2}
					/>
				))}

				{/* Latest value label */}
				{chart.latestPoint && (
					<SvgText
						x={chart.toX(chart.latestPoint.x)}
						y={chart.toY(chart.latestPoint.y) - 10}
						fill={palette.primary.DEFAULT}
						fontSize={11}
						fontWeight="bold"
						textAnchor="middle"
					>
						{chart.latestPoint.y} {weightUnit}
					</SvgText>
				)}
			</Svg>
		</View>
	);
}
