export default {
	programs: {
		title: "Programmes",
		empty: "Aucun programme.",
		emptyHint: 'Appuyez sur "Nouveau" pour en créer un.',
		newProgram: "Nouveau programme",
		namePlaceholder: "Nom du programme",
		sessionCount_one: "{{count}} séance",
		sessionCount_other: "{{count}} séances",
		deleteTitle: "Supprimer le programme",
		deleteMessage: 'Supprimer "{{name}}" ? Cette action est irréversible.',
	},
	sessions: {
		newSession: "Nouvelle séance",
		namePlaceholder: "Nom de la séance",
		empty: "Aucune séance.",
		emptyHint: 'Appuyez sur "Nouveau" pour en ajouter une.',
		exerciseCount_one: "{{count}} exercice",
		exerciseCount_other: "{{count}} exercices",
		deleteTitle: "Supprimer la séance",
		deleteMessage: 'Supprimer "{{name}}" ? Cette action est irréversible.',
	},
} as const;
