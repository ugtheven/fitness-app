import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Line as SvgLine, Path, Text as SvgText } from "react-native-svg";
import { palette } from "../../lib/palette";
import { radius } from "../../lib/tokens";
import { useUnits } from "../../lib/units";

type DataPoint = { date: string; weightKg: number };
type Props = { data: DataPoint[] };

const CHART_HEIGHT = 200;
const PAD = { top: 24, right: 20, bottom: 32, left: 44 };
const HIT_SLOP = 20;

export function WeightChart({ data }: Props) {
	const { t } = useTranslation();

	if (data.length === 0) {
		return (
			<View
				className="items-center justify-center"
				style={{
					backgroundColor: palette.card.DEFAULT,
					height: CHART_HEIGHT + PAD.top + PAD.bottom,
					borderRadius: radius.lg,
				}}
			>
				<Text style={{ color: palette.muted.foreground }}>{t("profile.noData")}</Text>
			</View>
		);
	}

	return (
		<View
			className="overflow-hidden"
			style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
		>
			<Text
				className="text-xs font-semibold uppercase tracking-widest px-4 pt-4 mb-1"
				style={{ color: palette.muted.foreground }}
			>
				{t("profile.weightEvolution")}
			</Text>
			<View style={{ height: CHART_HEIGHT + PAD.top + PAD.bottom }}>
				<ChartContent data={data} />
			</View>
			<Text className="text-xs text-center pb-3" style={{ color: palette.muted.foreground }}>
				{t("profile.tapChart")}
			</Text>
		</View>
	);
}

function ChartContent({ data }: { data: DataPoint[] }) {
	const [width, setWidth] = useState(0);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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

		const pathParts = points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.x)},${toY(p.y)}`);
		const dataPath = pathParts.join(" ");

		const yTicks: number[] = [];
		const yStep = (yMax - yMin) / 4;
		for (let i = 0; i <= 4; i++) {
			yTicks.push(Math.round((yMin + yStep * i) * 10) / 10);
		}

		const xStep = Math.max(1, Math.floor(xMax / 4));
		const xTicks: { day: number; label: string }[] = [];
		for (let d = 0; d <= xMax; d += xStep) {
			const date = new Date(firstMs + d * 86400000);
			const m = date.toLocaleString("default", { month: "short" });
			xTicks.push({ day: d, label: `${m} ${date.getDate()}` });
		}

		return { dataPath, points, yTicks, xTicks, toX, toY };
	}, [data, width, displayWeight]);

	if (!chart) {
		return <View style={{ flex: 1 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} />;
	}

	const selected = selectedIndex != null ? chart.points[selectedIndex] : null;

	return (
		<Pressable
			style={{ flex: 1 }}
			onPress={() => setSelectedIndex(null)}
			onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
		>
			<Svg width={width} height={CHART_HEIGHT}>
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
				<Path d={chart.dataPath} stroke={palette.accent.DEFAULT} strokeWidth={2.5} fill="none" />
				{chart.points.map((p, i) => (
					<Circle
						key={`pt-${p.date}`}
						cx={chart.toX(p.x)}
						cy={chart.toY(p.y)}
						r={selectedIndex === i ? 6 : 4}
						fill={selectedIndex === i ? palette.accent.DEFAULT : palette.background}
						stroke={palette.accent.DEFAULT}
						strokeWidth={2}
					/>
				))}
			</Svg>

			{/* Hit targets for each point */}
			{chart.points.map((p, i) => (
				<Pressable
					key={`hit-${p.date}`}
					onPress={() => setSelectedIndex(selectedIndex === i ? null : i)}
					style={{
						position: "absolute",
						left: chart.toX(p.x) - HIT_SLOP,
						top: chart.toY(p.y) - HIT_SLOP,
						width: HIT_SLOP * 2,
						height: HIT_SLOP * 2,
					}}
				/>
			))}

			{/* Tooltip */}
			{selected && (
				<View
					style={{
						position: "absolute",
						left: Math.max(8, Math.min(chart.toX(selected.x) - 60, width - 128)),
						top: chart.toY(selected.y) - 52,
						backgroundColor: palette.foreground,
						borderRadius: radius.sm,
						paddingHorizontal: 10,
						paddingVertical: 6,
					}}
				>
					<Text style={{ fontSize: 12, fontWeight: "700", color: palette.background }}>
						{selected.y} {weightUnit}
					</Text>
					<Text style={{ fontSize: 10, color: palette.muted.foreground }}>
						{formatTooltipDate(selected.date)}
					</Text>
				</View>
			)}
		</Pressable>
	);
}

function formatTooltipDate(dateStr: string): string {
	const [y, m, d] = dateStr.split("-").map(Number);
	const date = new Date(y, m - 1, d);
	return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
