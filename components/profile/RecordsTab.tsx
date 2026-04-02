import { Ionicons } from "@expo/vector-icons";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { EXERCISE_BASES_BY_ID } from "../../lib/exerciseBases";
import type { Equipment } from "../../lib/exerciseTypes";
import { EXERCISE_VARIANTS_BY_ID } from "../../lib/exerciseVariants";
import { palette } from "../../lib/palette";
import { getAllExercisePRsQuery } from "../../lib/profileQueries";
import { useUnits } from "../../lib/units";

function equipmentIcon(equipment: Equipment): keyof typeof Ionicons.glyphMap {
	switch (equipment) {
		case "bodyweight":
			return "person-outline";
		case "dumbbell":
		case "barbell":
			return "barbell-outline";
		case "machine":
		case "cable":
			return "hardware-chip-outline";
	}
}

export function RecordsTab() {
	const { t } = useTranslation();
	const { displayWeight, weightUnit } = useUnits();
	const { data: prs = [] } = useLiveQuery(getAllExercisePRsQuery());

	const grouped = useMemo(() => {
		const groups = new Map<string, { exerciseVariantId: string; name: string; equipment: Equipment; maxWeight: number }[]>();

		for (const pr of prs) {
			const variant = EXERCISE_VARIANTS_BY_ID[pr.exerciseVariantId];
			if (!variant) continue;
			const base = EXERCISE_BASES_BY_ID[variant.baseId];
			if (!base) continue;

			const muscle = base.muscles[0];
			const list = groups.get(muscle) ?? [];
			list.push({
				exerciseVariantId: pr.exerciseVariantId,
				name: variant.id,
				equipment: variant.equipment,
				maxWeight: pr.maxWeight,
			});
			groups.set(muscle, list);
		}

		// Sort exercises within each group by weight descending
		for (const list of groups.values()) {
			list.sort((a, b) => b.maxWeight - a.maxWeight);
		}

		return groups;
	}, [prs]);

	if (prs.length === 0) {
		return (
			<View className="flex-1 items-center justify-center">
				<Text style={{ color: palette.muted.foreground }}>{t("profile.noRecords")}</Text>
			</View>
		);
	}

	return (
		<ScrollView
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{ paddingTop: 16, paddingBottom: 100, gap: 16 }}
		>
			{Array.from(grouped.entries()).map(([muscle, exercises]) => (
				<View key={muscle} style={{ gap: 8 }}>
					{/* Section header */}
					<Text
						className="text-xs font-semibold uppercase tracking-widest"
						style={{ color: palette.muted.foreground }}
					>
						{t(`exercises.muscleGroups.${muscle}`)}
					</Text>

					{/* Exercise cards */}
					{exercises.map((ex) => (
						<View
							key={ex.exerciseVariantId}
							className="flex-row items-center gap-3 rounded-2xl px-4 py-3"
							style={{ backgroundColor: palette.card.DEFAULT }}
						>
							<View
								className="w-9 h-9 rounded-full items-center justify-center"
								style={{ backgroundColor: palette.muted.DEFAULT }}
							>
								<Ionicons name={equipmentIcon(ex.equipment)} size={18} color={palette.muted.foreground} />
							</View>
							<View className="flex-1">
								<Text className="text-base font-semibold text-foreground" numberOfLines={1}>
									{t(`exercises.names.${ex.name}`)}
								</Text>
								<Text className="text-xs mt-0.5" style={{ color: palette.muted.foreground }}>
									{t(`exercises.muscleGroups.${muscle}`)}
								</Text>
							</View>
							<View className="items-end">
								<View className="flex-row items-baseline">
									<Text className="text-xl font-bold text-foreground">
										{displayWeight(ex.maxWeight)}
									</Text>
									<Text className="text-xs ml-1" style={{ color: palette.muted.foreground }}>{weightUnit}</Text>
								</View>
								<View className="flex-row items-center gap-1 mt-0.5">
									<Ionicons name="flash" size={10} color={palette.primary.DEFAULT} />
									<Text className="text-xs font-semibold" style={{ color: palette.primary.DEFAULT }}>
										PR
									</Text>
								</View>
							</View>
						</View>
					))}
				</View>
			))}
		</ScrollView>
	);
}
