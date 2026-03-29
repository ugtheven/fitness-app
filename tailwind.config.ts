import type { Config } from "tailwindcss";
import { palette } from "./lib/palette";

export default {
	content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors: palette,
		},
	},
	plugins: [],
} satisfies Config;
