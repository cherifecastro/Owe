CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_debts_created_at ON debts(created_at DESC);
