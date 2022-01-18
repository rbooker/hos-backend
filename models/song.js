"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for songs. */

class Song {
    /** Create a song (from data), update db, return new song data.
     *
     *  song data is {playlistID, artist, title, album}
     * 
     *  the album art and link are retrieved (if they exist) from discogs.org
     * 
     *  A song can't be "loose", i.e. not associated with a playlist, so a playlist ID is required,
     *  along with the song info
     * 
     *  The song is added to the song db, and an entry is added to the playlist_song db that creates
     *  the association between the playlist whose ID is provided and the song
     *
     * Returns { playlistID, artist, title, album, albumLink, albumImage  }
     *
     * Throws BadRequestError if playlist doesn't exist.
     * */
  
    static async create({playlistID, artist, title, album }) {
     
      //The variables that store the song info
      let songInfo;
      let songOrder;

      //Check if playlist exists, throw error if it doesn't
      const playlistQuery = await db.query(
        `SELECT id
         FROM playlists where id = $1`,
      [playlistID]);

      if (!playlistQuery.rows[0])
        throw new BadRequestError(`No playlist exists w/ ID: ${playlistID}`);
      
    //Check for a duplicate of the song being added - if one exists, it gets added to the playlist, instead
      const songDuplicateCheck = await db.query(
            `SELECT id AS "songID", artist, title, album, album_link AS "albumLink", album_image AS "albumImage" 
             FROM songs  
             WHERE artist = $1 AND title = $2 AND album = $3;`,
          [artist, title, album]);
  
     //If a duplicate doesn't exist, create a new entry in the song db for the song data provided
      if (!songDuplicateCheck.rows[0]){
        const songInsert = await db.query(
            `INSERT INTO songs
            (artist, title, album)
             VALUES ($1, $2, $3)
             RETURNING id AS "songID", artist, title, album, album_link AS "albumLink", album_image AS "albumImage"`,
            [artist, title, album],
        );
        songInfo = songInsert.rows[0];
      }
      else
        songInfo = songDuplicateCheck.rows[0];

      //Figure out the value of of songOrder - songs always go at the end of a playlist when they're inserted
      //(the idea is DJs are entering songs into the playlist as they get played), so the value is one more than
      //the value of the current max value for the variable "song_order"
      const numOfSongsQuery = await db.query(
          `SELECT id, song_order
           FROM playlist_songs
           WHERE playlist_id = $1
           ORDER BY song_order DESC`,
           [playlistID]
      );

      //If the playlist doesn't contain any songs, then the new song's order is 1
      if(!numOfSongsQuery.rows[0])
        songOrder = 1;
     //Otherwise it's one more than the greatest value of song_order
      else
        songOrder = numOfSongsQuery.rows[0].song_order + 1;

      const songPlaylistInsert = await db.query(
        `INSERT INTO playlist_songs
        (playlist_id, song_id, song_order)
         VALUES ($1, $2, $3)
         RETURNING playlist_id as "playlistID", song_id as "songID", song_order as "songOrder"`,
      [playlistID, songInfo.songID, songOrder],
    );

      songInfo.playlistInsertedInto = songPlaylistInsert.rows[0];
      
      return songInfo;
    }
  
  
    /** Update song data with `data`.
     *
     *  It's important to note that this changes data for the song on every playlist it's on
     *  Which is fine, really - if something is wrong about the song data, it should get changed
     *  on every playlist it's on. But this should be noted, in case a DJ notices that a song on their
     *  playlist is suddenly spelled differently (i.e. probably correctly - music people sometimes have...
     *  shall we say, issues with words)
     * 
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {artist, title, album}
     *
     * Returns {songID, artist, title, album}
     *
     * Throws NotFoundError if not found.
     * 
     */
  
    static async update(songID, data) {
  
      const { setCols, values } = sqlForPartialUpdate(
          data,
          {
            description: "description"
          });
      const songIDVarIdx = "$" + (values.length + 1);
  
      const querySql = `UPDATE songs 
                        SET ${setCols} 
                        WHERE id = ${songIDVarIdx} 
                        RETURNING id AS "songID", 
                                  artist, 
                                  title,
                                  album`;
      const result = await db.query(querySql, [...values, songID]);
      const song = result.rows[0];
  
      if (!song) throw new NotFoundError(`No song with ID: ${songID}`);
  
      return song;
    }
  
    /** Delete given song from a given playlist; returns undefined.
     *
     * Doesn't actually delete a song - just removes it from a playlist
     * 
     * Throws NotFoundError if song or playlist not found.
     **/
  
    static async remove({playlistID, songID, songOrder}) {
      
      const songDelete = await db.query(
            `DELETE
             FROM playlist_songs
             WHERE song_id = $1 AND playlist_id = $2 AND song_order = $3
             RETURNING id`,
          [songID, playlistID, songOrder]);
      const deletedSong = songDelete.rows[0];
  
      if (!deletedSong) throw new NotFoundError(`No song/playlist combo w/ IDs: ${songID}/${playlistID}`);
    }
  }
  
  
  module.exports = Song;