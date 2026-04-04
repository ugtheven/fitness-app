// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from "./0000_full_schema.sql";
import m0001 from "./0001_profile_tables.sql";
import m0002 from "./0002_goals.sql";
import m0003 from "./0003_add_indexes.sql";
import m0004 from "./0004_add_prescribed_rest_time.sql";
import m0005 from "./0005_hydration_tracking.sql";
import m0006 from "./0006_xp_level_system.sql";
import m0007 from "./0007_healthkit_uuid.sql";
import m0008 from "./0008_schema_hardening.sql";
import journal from "./meta/_journal.json";

export default {
	journal,
	migrations: {
		m0000,
		m0001,
		m0002,
		m0003,
		m0004,
		m0005,
		m0006,
		m0007,
		m0008,
	},
};
