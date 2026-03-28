const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Allow .wasm files to be resolved as assets (for expo-sqlite web)
config.resolver.assetExts.push("wasm");

config.server = {
	...config.server,
	enhanceMiddleware: (middleware) => (req, res, next) => {
		// Required for SharedArrayBuffer (expo-sqlite web worker sync ops)
		res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
		res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

		// Serve WASM with correct MIME type for streaming compilation
		if (req.url?.endsWith(".wasm")) {
			res.setHeader("Content-Type", "application/wasm");
		}

		// expo-sqlite web creates a Worker via new URL('./worker', window.location.href)
		// which resolves to /worker — redirect to the actual bundle
		if (req.url === "/worker" || req.url?.startsWith("/worker?")) {
			req.url =
				"/node_modules/expo-sqlite/web/worker.bundle?platform=web&dev=true&hot=false";
		}

		return middleware(req, res, next);
	},
};

module.exports = withNativeWind(config, { input: "./global.css" });
