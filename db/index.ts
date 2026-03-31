import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";

const expo = SQLite.openDatabaseSync("db.db", { enableChangeListener: true });
expo.execSync("PRAGMA foreign_keys = ON");

export const db = drizzle(expo, { schema });

export type Database = typeof db;
