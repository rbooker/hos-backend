CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  is_dj BOOLEAN NOT NULL,
  is_admin BOOLEAN NOT NULL,
  donated BOOLEAN NOT NULL
);

CREATE TABLE shows (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES members ON DELETE CASCADE,
  dj_name TEXT NOT NULL,
  show_name TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  show_time TIME NOT NULL,
  img_url TEXT,
  description TEXT NOT NULL
);

CREATE TABLE member_favorites (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members ON DELETE CASCADE,
  show_id INTEGER NOT NULL REFERENCES shows ON DELETE CASCADE
);

CREATE TABLE playlists (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE show_playlists (
  id SERIAL PRIMARY KEY,
  show_id INTEGER NOT NULL REFERENCES shows ON DELETE CASCADE,
  playlist_id INTEGER NOT NULL REFERENCES playlists ON DELETE CASCADE
);

CREATE TABLE songs (
  id SERIAL PRIMARY KEY,
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  album TEXT NOT NULL,
  album_link TEXT,
  album_image TEXT
);

CREATE TABLE playlist_songs (
 id SERIAL PRIMARY KEY,
 playlist_id INTEGER NOT NULL REFERENCES playlists ON DELETE CASCADE,
 song_id INTEGER NOT NULL REFERENCES songs ON DELETE CASCADE,
 song_order INTEGER NOT NULL
);




