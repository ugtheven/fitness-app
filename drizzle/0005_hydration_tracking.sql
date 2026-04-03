CREATE TABLE hydration_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  volume_ml REAL NOT NULL,
  goal_ml REAL NOT NULL,
  created_at TEXT
);
CREATE UNIQUE INDEX hydration_logs_date_idx ON hydration_logs(date);