// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_full_schema.sql';
import m0001 from './0001_profile_tables.sql';
import m0002 from './0002_goals.sql';
import m0003 from './0003_add_indexes.sql';
import m0004 from './0004_add_prescribed_rest_time.sql';

  export default {
    journal,
    migrations: {
      m0000,
      m0001,
      m0002,
      m0003,
      m0004
    }
  }
