import common from "./common";
import exercises from "./exercises";
import gamification from "./gamification";
import profile from "./profile";
import programs from "./programs";
import settings from "./settings";

export default {
	...common,
	...exercises,
	...gamification,
	...profile,
	...programs,
	...settings,
} as const;
