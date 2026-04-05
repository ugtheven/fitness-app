import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { palette } from "../lib/palette";
import { radius } from "../lib/tokens";

export type DayModules = {
	workout: boolean;
	diet: boolean;
	hydration: boolean;
	steps: boolean;
};

type CalendarProps = {
	onSelectDate: (date: string) => void;
	dayModules: Map<string, DayModules>;
	displayMonth: Date;
	onChangeMonth: (date: Date) => void;
};

// Dot config
const DOT_SIZE = 4;
const DOT_GAP = 3;
const DAY_CELL_HEIGHT = 48;
const DOT_COLORS = [
	palette.foreground,
	palette.green.DEFAULT,
	palette.blue.DEFAULT,
	palette.orange.DEFAULT,
] as const;

/** Format a Date as YYYY-MM-DD */
function toDateString(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

/** Get the day-of-week index where Monday = 0, Sunday = 6 */
function mondayIndex(date: Date): number {
	return (date.getDay() + 6) % 7;
}

function daysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

export function Calendar({ onSelectDate, dayModules, displayMonth, onChangeMonth }: CalendarProps) {
	const { t, i18n } = useTranslation();
	const locale = i18n.language;

	const year = displayMonth.getFullYear();
	const month = displayMonth.getMonth();

	const todayStr = toDateString(new Date());

	const monthLabel = useMemo(() => {
		const fmt = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
		const label = fmt.format(displayMonth);
		return label.charAt(0).toUpperCase() + label.slice(1);
	}, [locale, displayMonth]);

	const weekdayHeaders = useMemo(() => {
		const fmt = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(2024, 0, 1 + i);
			return fmt.format(d).toUpperCase();
		});
	}, [locale]);

	const cells = useMemo(() => {
		const totalDays = daysInMonth(year, month);
		const firstDay = new Date(year, month, 1);
		const startOffset = mondayIndex(firstDay);

		const grid: (number | null)[] = [];
		for (let i = 0; i < startOffset; i++) grid.push(null);
		for (let d = 1; d <= totalDays; d++) grid.push(d);
		while (grid.length % 7 !== 0) grid.push(null);
		return grid;
	}, [year, month]);

	function goToPreviousMonth() {
		onChangeMonth(new Date(year, month - 1, 1));
	}

	function goToNextMonth() {
		onChangeMonth(new Date(year, month + 1, 1));
	}

	function handleDayPress(day: number) {
		const dateStr = toDateString(new Date(year, month, day));
		onSelectDate(dateStr);
	}

	return (
		<View className="px-6 pt-4 pb-4">
			{/* Header */}
			<View className="mb-4 flex-row items-center justify-between">
				<Pressable
					onPress={goToPreviousMonth}
					hitSlop={12}
					accessibilityLabel="Previous month"
					className="items-center justify-center"
					style={{ width: 36, height: 36 }}
				>
					<Ionicons name="chevron-back" size={18} color={palette.muted.foreground} />
				</Pressable>

				<Text className="text-base font-bold text-foreground">{monthLabel}</Text>

				<Pressable
					onPress={goToNextMonth}
					hitSlop={12}
					accessibilityLabel="Next month"
					className="items-center justify-center"
					style={{ width: 36, height: 36 }}
				>
					<Ionicons name="chevron-forward" size={18} color={palette.muted.foreground} />
				</Pressable>
			</View>

			{/* Weekday labels */}
			<View className="mb-2 flex-row">
				{weekdayHeaders.map((label) => (
					<View key={label} className="flex-1 items-center">
						<Text className="text-xs font-medium" style={{ color: palette.muted.foreground }}>
							{label}
						</Text>
					</View>
				))}
			</View>

			{/* Day grid */}
			{Array.from({ length: cells.length / 7 }, (_, row) => {
				const rowKey = `r${row}`;
				return (
					<View key={rowKey} className="flex-row">
						{cells.slice(row * 7, row * 7 + 7).map((day, col) => {
							const cellKey = `${row}-${col}`;
							if (day === null) {
								return (
									<View
										key={cellKey}
										className="flex-1 items-center justify-center"
										style={{ height: DAY_CELL_HEIGHT }}
									/>
								);
							}

							const dateStr = toDateString(new Date(year, month, day));
							const isToday = dateStr === todayStr;
							const isPast = dateStr < todayStr;
							const modules = dayModules.get(dateStr);

							// Build active dots
							const dots: string[] = [];
							if (modules?.workout) dots.push(DOT_COLORS[0]);
							if (modules?.diet) dots.push(DOT_COLORS[1]);
							if (modules?.hydration) dots.push(DOT_COLORS[2]);
							if (modules?.steps) dots.push(DOT_COLORS[3]);

							return (
								<Pressable
									key={cellKey}
									onPress={() => handleDayPress(day)}
									className="flex-1 items-center justify-center"
									style={{ height: DAY_CELL_HEIGHT }}
									accessibilityLabel={`${day}`}
									accessibilityRole="button"
								>
									{/* Today background */}
									{isToday && (
										<View
											style={{
												position: "absolute",
												width: 32,
												height: 32,
												borderRadius: radius.sm,
												backgroundColor: palette.muted.DEFAULT,
											}}
										/>
									)}

									{/* Day number */}
									<Text
										style={{
											fontSize: 14,
											fontWeight: isToday || dots.length > 0 ? "600" : "400",
											color:
												isPast && dots.length === 0 ? palette.muted.foreground : palette.foreground,
										}}
									>
										{day}
									</Text>

									{/* Dots */}
									{dots.length > 0 && (
										<View
											style={{
												flexDirection: "row",
												gap: DOT_GAP,
												marginTop: 3,
											}}
										>
											{dots.map((color, i) => {
												const dotKey = `d${i}`;
												return (
													<View
														key={dotKey}
														style={{
															width: DOT_SIZE,
															height: DOT_SIZE,
															borderRadius: DOT_SIZE / 2,
															backgroundColor: color,
														}}
													/>
												);
											})}
										</View>
									)}
								</Pressable>
							);
						})}
					</View>
				);
			})}

			{/* Legend */}
			<View
				className="flex-row justify-center gap-4 mt-2 pt-2"
				style={{ borderTopWidth: 1, borderTopColor: palette.border }}
			>
				{(
					[
						{ color: DOT_COLORS[0], label: t("activity.legendWorkout") },
						{ color: DOT_COLORS[1], label: t("activity.legendDiet") },
						{ color: DOT_COLORS[2], label: t("activity.legendHydration") },
						{ color: DOT_COLORS[3], label: t("activity.legendSteps") },
					] as const
				).map(({ color, label }) => (
					<View key={label} className="flex-row items-center gap-1.5">
						<View
							style={{
								width: DOT_SIZE,
								height: DOT_SIZE,
								borderRadius: DOT_SIZE / 2,
								backgroundColor: color,
							}}
						/>
						<Text className="text-xs" style={{ color: palette.muted.foreground }}>
							{label}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}
