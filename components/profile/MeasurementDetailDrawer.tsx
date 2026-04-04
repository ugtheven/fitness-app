import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle, Line as SvgLine, Path, Text as SvgText } from "react-native-svg";
import { palette } from "../../lib/palette";
import { deleteMeasurementField, getMeasurementHistoryQuery } from "../../lib/profileQueries";
import { radius } from "../../lib/tokens";
import { useUnits } from "../../lib/units";
import { BottomDrawer } from "../BottomDrawer";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { LogSingleMeasurementDrawer } from "./LogSingleMeasurementDrawer";

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

type Props = {
	visible: boolean;
	onClose: () => void;
	measurementKey: MeasurementKey | null;
};

export function MeasurementDetailDrawer({ visible, onClose, measurementKey }: Props) {
	const { t } = useTranslation();
	const { displayLength, lengthUnit } = useUnits();
	const [showLogDrawer, setShowLogDrawer] = useState(false);
	const [editEntry, setEditEntry] = useState<{ date: string; value: number } | null>(null);

	const { data: allMeasurements = [] } = useLiveQuery(getMeasurementHistoryQuery());

	const { points, unit } = useMemo(() => {
		if (!measurementKey) return { points: [], unit: "" };
		const isBodyFat = measurementKey === "bodyFat";
		const u = isBodyFat ? "%" : lengthUnit;
		const pts: { date: string; value: number }[] = [];
		for (const row of allMeasurements) {
			const raw = row[measurementKey];
			if (raw != null) {
				pts.push({ date: row.date, value: isBodyFat ? raw : displayLength(raw) });
			}
		}
		return { points: pts, unit: u };
	}, [allMeasurements, measurementKey, displayLength, lengthUnit]);

	if (!measurementKey) return null;

	const key = measurementKey;
	const latest = points.length > 0 ? points[points.length - 1] : null;
	const first = points.length > 1 ? points[0] : null;
	const delta = latest && first ? Math.round((latest.value - first.value) * 10) / 10 : null;

	function handleDelete(date: string) {
		Alert.alert(t("common.delete"), t("profile.deleteEntryMessage"), [
			{ text: t("common.cancel"), style: "cancel" },
			{
				text: t("common.delete"),
				style: "destructive",
				onPress: () => deleteMeasurementField(date, key),
			},
		]);
	}

	const title = `${t(`profile.${measurementKey}`)} ${t("profile.evolution")}`;

	return (
		<>
			<BottomDrawer
				visible={visible && !showLogDrawer && !editEntry}
				onClose={onClose}
				title={title}
			>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ gap: 16, paddingBottom: 16 }}
				>
					{/* Current value + delta */}
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-baseline gap-1">
							<Text className="text-3xl font-bold text-foreground">{latest?.value ?? "—"}</Text>
							<Text className="text-base" style={{ color: palette.muted.foreground }}>
								{unit}
							</Text>
						</View>
						{delta != null && delta !== 0 && (
							<View
								className="flex-row items-center gap-1 px-3 py-1.5"
								style={{ backgroundColor: palette.accent.muted, borderRadius: radius.md }}
							>
								<Ionicons
									name={delta >= 0 ? "trending-up" : "trending-down"}
									size={14}
									color={palette.accent.DEFAULT}
								/>
								<Text className="text-sm font-semibold" style={{ color: palette.accent.DEFAULT }}>
									{delta >= 0 ? "+" : ""}
									{delta} {unit}
								</Text>
							</View>
						)}
					</View>

					{/* Chart */}
					{points.length >= 2 && <MeasurementChart data={points} unit={unit} />}

					{/* History section */}
					<View className="gap-3">
						<Text
							className="text-xs font-semibold uppercase tracking-widest"
							style={{ color: palette.muted.foreground }}
						>
							{t("profile.history")}
						</Text>

						{/* Log button */}
						<Button
							variant="glow"
							fullWidth
							label={t("profile.logMeasurement")}
							startIcon={<Ionicons name="add" size={20} />}
							onPress={() => setShowLogDrawer(true)}
						/>

						{/* History entries (newest first) */}
						{[...points].reverse().map((pt, i, arr) => {
							const prev = i < arr.length - 1 ? arr[i + 1] : null;
							const entryDelta = prev ? Math.round((pt.value - prev.value) * 10) / 10 : null;
							return (
								<View
									key={pt.date}
									className="flex-row items-center justify-between px-5 py-4"
									style={{ backgroundColor: palette.card.DEFAULT, borderRadius: radius.lg }}
								>
									<Text className="text-sm" style={{ color: palette.muted.foreground }}>
										{formatDate(pt.date)}
									</Text>
									<View className="flex-row items-center gap-2">
										<Text className="text-base font-bold text-foreground">
											{pt.value} {unit}
										</Text>
										{entryDelta != null && entryDelta !== 0 && (
											<Text
												className="text-xs font-semibold"
												style={{ color: palette.accent.DEFAULT }}
											>
												{entryDelta > 0 ? "+" : ""}
												{entryDelta}
											</Text>
										)}
										<IconButton
											name="create-outline"
											size={16}
											color={palette.muted.foreground}
											onPress={() => setEditEntry(pt)}
											accessibilityLabel={t("profile.edit")}
										/>
										<IconButton
											name="trash-outline"
											size={16}
											color={palette.destructive.DEFAULT}
											onPress={() => handleDelete(pt.date)}
											accessibilityLabel={t("common.delete")}
										/>
									</View>
								</View>
							);
						})}

						{points.length === 0 && (
							<Text
								className="text-sm text-center py-4"
								style={{ color: palette.muted.foreground }}
							>
								{t("profile.noData")}
							</Text>
						)}
					</View>
				</ScrollView>
			</BottomDrawer>

			<LogSingleMeasurementDrawer
				visible={showLogDrawer}
				onClose={() => setShowLogDrawer(false)}
				measurementKey={measurementKey}
				lastValue={latest?.value ?? null}
			/>
			<LogSingleMeasurementDrawer
				visible={editEntry != null}
				onClose={() => setEditEntry(null)}
				measurementKey={measurementKey}
				lastValue={editEntry?.value ?? null}
				editDate={editEntry?.date}
			/>
		</>
	);
}

// ── Helpers ──

function formatDate(dateStr: string): string {
	const [y, m, d] = dateStr.split("-").map(Number);
	const date = new Date(y, m - 1, d);
	return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// ── Chart (same SVG pattern as WeightChart) ──

const CHART_HEIGHT = 200;
const PAD = { top: 24, right: 20, bottom: 32, left: 44 };

const HIT_SLOP = 20;

function MeasurementChart({
	data,
	unit,
}: { data: { date: string; value: number }[]; unit: string }) {
	const [width, setWidth] = useState(0);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

	const chart = useMemo(() => {
		if (width === 0 || data.length === 0) return null;

		const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
		const firstMs = new Date(sorted[0].date).getTime();
		const points = sorted.map((d) => ({
			x: (new Date(d.date).getTime() - firstMs) / 86400000,
			y: d.value,
			date: d.date,
		}));

		const values = points.map((p) => p.y);
		const minV = Math.min(...values);
		const maxV = Math.max(...values);
		const padY = Math.max(1, (maxV - minV) * 0.25);
		const yMin = minV - padY;
		const yMax = maxV + padY;
		const xMax = points[points.length - 1].x || 1;

		const plotW = width - PAD.left - PAD.right;
		const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;

		const toX = (day: number) => PAD.left + (day / xMax) * plotW;
		const toY = (v: number) => PAD.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

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
	}, [data, width]);

	if (!chart) {
		return <View style={{ flex: 1 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} />;
	}

	const selected = selectedIndex != null ? chart.points[selectedIndex] : null;

	return (
		<Pressable
			style={{
				height: CHART_HEIGHT + PAD.top + PAD.bottom,
				backgroundColor: palette.card.DEFAULT,
				borderRadius: radius.lg,
				overflow: "hidden",
			}}
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
				{selected && (
					<Circle
						cx={chart.toX(selected.x)}
						cy={chart.toY(selected.y)}
						r={6}
						fill={palette.accent.DEFAULT}
						stroke={palette.background}
						strokeWidth={2}
					/>
				)}
			</Svg>

			{/* Hit targets */}
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
						{selected.y} {unit}
					</Text>
					<Text style={{ fontSize: 10, color: palette.muted.foreground }}>
						{formatDate(selected.date)}
					</Text>
				</View>
			)}
		</Pressable>
	);
}
