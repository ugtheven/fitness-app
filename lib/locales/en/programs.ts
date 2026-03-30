export default {
	programs: {
		title: "Programs",
		empty: "No programs yet.",
		emptyHint: 'Tap "New" to create one.',
		newProgram: "New program",
		namePlaceholder: "Program name",
		sessionCount_one: "{{count}} session",
		sessionCount_other: "{{count}} sessions",
		deleteTitle: "Delete program",
		deleteMessage: 'Delete "{{name}}"? This action is irreversible.',
	},
	sessions: {
		newSession: "New session",
		namePlaceholder: "Session name",
		empty: "No sessions yet.",
		emptyHint: 'Tap "New" to add one.',
		exerciseCount_one: "{{count}} exercise",
		exerciseCount_other: "{{count}} exercises",
		deleteTitle: "Delete session",
		deleteMessage: 'Delete "{{name}}"? This action is irreversible.',
	},
} as const;
