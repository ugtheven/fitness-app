/**
 * Source unique des couleurs : importée par Tailwind (`tailwind.config.ts`) et par le code (styles natifs, etc.).
 *
 * Direction : minimaliste iOS dark.
 * - primary (blanc) : boutons, CTA — fort contraste sur fond noir
 * - accent (bleu iOS) : icônes interactives, progress, badges PR, états actifs
 * - le reste repose sur le contraste blanc/gris
 */
export const palette = {
	background: "#000000",
	foreground: "#F5F5F5",
	primary: {
		DEFAULT: "#F5F5F5",
		foreground: "#000000",
		muted: "#F5F5F520",
		border: "#F5F5F540",
	},
	accent: {
		DEFAULT: "#F5F5F5",
		foreground: "#000000",
		muted: "#F5F5F520",
		border: "#F5F5F540",
	},
	secondary: {
		DEFAULT: "#8E8E93",
		foreground: "#FFFFFF",
		muted: "#8E8E9320",
	},
	destructive: {
		DEFAULT: "#FF3B30",
		foreground: "#FFFFFF",
	},
	muted: {
		DEFAULT: "#1C1C1E",
		foreground: "#8E8E93",
	},
	border: "#2C2C2E",
	card: {
		DEFAULT: "#1C1C1E",
		foreground: "#F5F5F5",
	},
	separator: "#38383A",
	shadow: "#000000",
	blue: {
		DEFAULT: "#5AC8FA",
		muted: "#5AC8FA50",
	},
	green: {
		DEFAULT: "#30D158",
		muted: "#30D15850",
	},
	orange: {
		DEFAULT: "#FF9500",
		muted: "#FF950050",
	},
} as const;

export type Palette = typeof palette;
