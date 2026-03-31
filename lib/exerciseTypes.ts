export type MuscleGroup =
	| "chest"
	| "triceps"
	| "biceps"
	| "abs"
	| "forearms"
	| "back"
	| "shoulders"
	| "quads"
	| "glutes"
	| "hamstrings"
	| "calves"
	| "adductors"
	| "abductors";

export type Equipment =
	| "dumbbell"
	| "barbell"
	| "machine"
	| "cable"
	| "bodyweight";

export type ExerciseBase = {
	id: string;
	nameKey: string;
	muscles: MuscleGroup[];
	supportsUnilateral?: boolean;
};

export type ExerciseVariant = {
	id: string;
	baseId: string;
	nameKey: string;
	equipment: Equipment;
};
