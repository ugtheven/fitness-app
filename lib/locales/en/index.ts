import common from "./common";
import exercises from "./exercises";
import programs from "./programs";
import settings from "./settings";

export default {
	...common,
	...exercises,
	...programs,
	...settings,
} as const;
