import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
	if (!db) {
		db = SQLite.openDatabaseSync("fitness.db");
	}
	return db;
}

export async function initDatabase() {
	if (Platform.OS === "web") {
		// expo-sqlite web requires the worker to be ready before any sync operations.
		// Use openDatabaseAsync on web to avoid blocking the main thread.
		const webDb = await SQLite.openDatabaseAsync("fitness.db");
		await webDb.execAsync(`
      CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        sets INTEGER,
        reps INTEGER,
        weight REAL,
        FOREIGN KEY (workout_id) REFERENCES workouts(id)
      );
    `);
		return;
	}

	await getDb().execAsync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sets INTEGER,
      reps INTEGER,
      weight REAL,
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    );
  `);
}

export { getDb as db };
