-- Schema for user data. NOTE: the shipped API keeps neologisms in memory by default; this schema is what a Postgres-backed
-- repository would use (see README "Next steps").
CREATE TABLE IF NOT EXISTS users (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','moderator','admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS saved_words (
  user_id   BIGINT REFERENCES users(id) ON DELETE CASCADE,
  kind      TEXT NOT NULL CHECK (kind IN ('word','name')),
  headword  TEXT NOT NULL,
  note      TEXT,
  saved_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, headword)
);
CREATE TABLE IF NOT EXISTS quiz_progress (
  user_id   BIGINT REFERENCES users(id) ON DELETE CASCADE,
  headword  TEXT NOT NULL,
  box       SMALLINT NOT NULL DEFAULT 0 CHECK (box BETWEEN 0 AND 4),
  due_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, headword)
);
CREATE TABLE IF NOT EXISTS neologisms (
  id          BIGSERIAL PRIMARY KEY,
  word        TEXT NOT NULL,
  definition  TEXT NOT NULL,
  example     TEXT,
  author_id   BIGINT REFERENCES users(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','rejected','published')),
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS neologism_votes (
  neologism_id BIGINT REFERENCES neologisms(id) ON DELETE CASCADE,
  voter_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (neologism_id, voter_id)
);
CREATE INDEX IF NOT EXISTS neologisms_status_idx ON neologisms(status);
