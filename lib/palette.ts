/**
 * Source unique des couleurs : importée par Tailwind (`tailwind.config.ts`) et par le code (styles natifs, etc.).
 */
export const palette = {
	background: "#000000",
	foreground: "#FFFFFF",
	primary: {
		DEFAULT: "#1DB954",
		foreground: "#000000",
	},
	muted: {
		DEFAULT: "#1A1A1A",
		foreground: "#A3A3A3",
	},
	border: "#2A2A2A",
	card: {
		DEFAULT: "#111111",
		foreground: "#FFFFFF",
	},
} as const;

export type Palette = typeof palette;
