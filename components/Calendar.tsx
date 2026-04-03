import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { palette } from "../lib/palette";
import { borders, radius } from "../lib/tokens";

type CalendarProps = {
	selectedDate: string | null;
	onSelectDate: (date: string | null) => void;
	workoutDates: Set<string>;
	displayMonth: Date;
	onChangeMonth: (date: Date) => void;
};

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

export function Calendar({ selectedDate, onSelectDate, workoutDates, displayMonth, onChangeMonth }: CalendarProps) {
	const { i18n } = useTranslation();
	const locale = i18n.language;

	const year = displayMonth.getFullYear();
	const month = displayMonth.getMonth();

	const todayStr = toDateString(new Date());

	// Month label via Intl
	const monthLabel = useMemo(() => {
		const fmt = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
		const label = fmt.format(displayMonth);
		return label.charAt(0).toUpperCase() + label.slice(1);
	}, [locale, year, month]);

	// Weekday headers (narrow, starting Monday)
	const weekdayHeaders = useMemo(() => {
		const fmt = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
		// Generate Mon–Sun labels
		return Array.from({ length: 7 }, (_, i) => {
			// 2024-01-01 is a Monday
			const d = new Date(2024, 0, 1 + i);
			return fmt.format(d).toUpperCase();
		});
	}, [locale]);

	// Build grid cells
	const cells = useMemo(() => {
		const totalDays = daysInMonth(year, month);
		const firstDay = new Date(year, month, 1);
		const startOffset = mondayIndex(firstDay);

		const grid: (number | null)[] = [];
		for (let i = 0; i < startOffset; i++) grid.push(null);
		for (let d = 1; d <= totalDays; d++) grid.push(d);
		// Pad to fill last row
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
		<View className="px-4 pt-4 pb-4">
			{/* Header */}
			<View className="mb-4 flex-row items-center justify-between">
				<Pressable
					onPress={goToPreviousMonth}
					hitSlop={12}
					accessibilityLabel="Previous month"
					className="items-center justify-center"
					style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: palette.muted.DEFAULT }}
				>
					<Ionicons name="chevron-back" size={18} color={palette.foreground} />
				</Pressable>

				<Pressable onPress={() => onSelectDate(null)} hitSlop={8}>
					<Text className="text-base font-bold text-foreground">{monthLabel}</Text>
				</Pressable>

				<Pressable
					onPress={goToNextMonth}
					hitSlop={12}
					accessibilityLabel="Next month"
					className="items-center justify-center"
					style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: palette.muted.DEFAULT }}
				>
					<Ionicons name="chevron-forward" size={18} color={palette.foreground} />
				</Pressable>
			</View>

			{/* Weekday labels */}
			<View className="mb-2 flex-row">
				{weekdayHeaders.map((label, i) => (
					<View key={i} className="flex-1 items-center">
						<Text className="text-xs font-medium" style={{ color: palette.muted.foreground }}>{label}</Text>
					</View>
				))}
			</View>

			{/* Day grid */}
			{Array.from({ length: cells.length / 7 }, (_, row) => (
				<View key={row} className="flex-row">
					{cells.slice(row * 7, row * 7 + 7).map((day, col) => {
						if (day === null) {
							return <View key={col} className="flex-1 items-center py-1" style={{ height: 48 }} />;
						}

						const dateStr = toDateString(new Date(year, month, day));
						const isSelected = dateStr === selectedDate;
						const isToday = dateStr === todayStr;
						const hasWorkout = workoutDates.has(dateStr);
						const isPast = dateStr > todayStr;

						return (
							<Pressable
								key={col}
								onPress={() => handleDayPress(day)}
								className="flex-1 items-center py-1"
								style={{ height: 48 }}
								accessibilityLabel={`${day}`}
								accessibilityRole="button"
							>
								<View
									className="items-center justify-center"
									style={[
										{ width: 34, height: 34, borderRadius: radius.sm },
										isSelected && { backgroundColor: palette.muted.DEFAULT },
										isToday && !isSelected && {
											borderWidth: borders.emphasis,
											borderColor: palette.accent.DEFAULT,
										},
									]}
								>
									<Text
										style={[
											{ fontSize: 14 },
											hasWorkout && !isPast
												? { fontWeight: "700", color: palette.foreground }
												: isPast
													? { fontWeight: "400", color: palette.muted.foreground }
													: { fontWeight: "400", color: palette.foreground },
											isSelected && { fontWeight: "700" },
										]}
									>
										{day}
									</Text>
								</View>

								{/* Workout dot */}
								{hasWorkout && (
									<View
										style={{
											width: 5,
											height: 5,
											borderRadius: 2.5,
											backgroundColor: palette.accent.DEFAULT,
											marginTop: 2,
										}}
									/>
								)}
							</Pressable>
						);
					})}
				</View>
			))}
		</View>
	);
}
