/** XP rewards per source */
export const XP_REWARDS = {
	workout: 50,
	hydration: 20,
	steps5k: 15,
	steps10k: 30,
} as const;

/**
 * Total XP required to reach a given level.
 * Level 1 = 0 XP, Level 2 = 100 XP, Level n = 100 * n²
 */
export function xpForLevel(level: number): number {
	if (level <= 1) return 0;
	return 100 * level * level;
}

/** Derive the current level from total XP. */
export function levelForXp(totalXp: number): number {
	if (totalXp <= 0) return 1;
	const level = Math.floor(Math.sqrt(totalXp / 100));
	return Math.max(1, level);
}

/**
 * Progress within the current level as a fraction [0, 1).
 * Returns { current, needed, progress }.
 */
export function xpProgressInLevel(totalXp: number) {
	const level = levelForXp(totalXp);
	const currentLevelXp = xpForLevel(level);
	const nextLevelXp = xpForLevel(level + 1);
	const needed = nextLevelXp - currentLevelXp;
	const current = totalXp - currentLevelXp;
	return {
		current,
		needed,
		progress: needed > 0 ? current / needed : 0,
	};
}
