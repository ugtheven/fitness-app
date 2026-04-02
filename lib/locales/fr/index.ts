import common from "./common";
import exercises from "./exercises";
import profile from "./profile";
import programs from "./programs";
import settings from "./settings";

export default {
	...common,
	...exercises,
	...profile,
	...programs,
	...settings,
} as const;
