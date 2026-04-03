import type { Config } from "tailwindcss";
import { palette } from "./lib/palette";
import { radius } from "./lib/tokens";

export default {
	content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors: palette,
			borderRadius: {
				sm: `${radius.sm}px`,
				md: `${radius.md}px`,
				lg: `${radius.lg}px`,
				xl: `${radius.xl}px`,
			},
		},
	},
	plugins: [],
} satisfies Config;
