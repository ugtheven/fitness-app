/**
 * Design tokens — source unique pour radius, typographie, spacing, ombres, borders et glass.
 * Aligné avec Apple HIG dark mode.
 */

// ── Border Radius ──

export const radius = {
	sm: 10,
	md: 12,
	lg: 16,
	xl: 24,
	pill: 9999,
} as const;

// ── Typography (inline styles pour les tailles que Tailwind ne couvre pas) ──

export const typography = {
	displayLg: { fontSize: 64, lineHeight: 72 },
	displayMd: { fontSize: 52, lineHeight: 60 },
	displaySm: { fontSize: 48, lineHeight: 56 },
	statLg: { fontSize: 28, lineHeight: 34 },
	statMd: { fontSize: 18, lineHeight: 24 },
} as const;

// ── Spacing ──

export const spacing = {
	screenPx: 24,
	cardPx: 20,
	cardPy: 16,
	inputHeight: 52,
	navbarClearance: 100,
} as const;

// ── Shadows ──

export const shadows = {
	elevated: {
		shadowColor: "#000000",
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.35,
		shadowRadius: 16,
		elevation: 16,
	},
	drag: {
		shadowColor: "#000000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 12,
		elevation: 12,
	},
	glow: {
		shadowColor: "#FFFFFF",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.15,
		shadowRadius: 16,
		elevation: 0,
	},
} as const;

// ── Borders ──

export const borders = {
	hairline: 0.5,
	thin: 1,
	emphasis: 1.5,
} as const;

// ── Glass recipe ──

export const glass = {
	blur: 20,
	overlay: "rgba(255,255,255,0.12)",
	border: "rgba(255,255,255,0.15)",
	blurModal: 80,
} as const;
