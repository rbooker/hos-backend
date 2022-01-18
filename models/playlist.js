"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for playlists. */

class Playlist {
    /** Create a playlist (from data), update db, return new company data.
     *
     *  One of the requirements is the DJ id, which isn't stored in the playlist db, but is
     *  necessary to create an entry in the linking db show_playlists
     * 
     * data should be { showID, date, description }
     *
     * Returns { playlistID, date, description, showID }
     *
     * Throws BadRequestError if playlist doesn't exist.
     * */
  
    static async create({ date, description, memberID}) {
      
      const djID = memberID;

      //Check for duplicate playlist (unlikely, but... may as well)
      const duplicateCheck = await db.query(
            `SELECT playlists.date 
             FROM members 
             RIGHT JOIN shows ON members.id = shows.dj_id 
             RIGHT JOIN show_playlists ON shows.id = show_playlists.show_id 
             RIGHT JOIN playlists ON show_playlists.playlist_id = playlists.id 
             WHERE members.id = $1 AND playlists.date = $2`,
          [djID, date]);
  
      if (duplicateCheck.rows[0])
        throw new BadRequestError(`Duplicate playlist for date: ${date}`);
  
      //Get show ID, throw error if one doesn't exist
      const showQuery = await db.query(
        `SELECT id
         FROM shows where dj_id = $1`,
      [djID]);

      if (!showQuery.rows[0])
        throw new BadRequestError(`No show exists for DJ w/ ID: ${djID}`);
        
      const showID = showQuery.rows[0].id;
      
      const playlistInsert = await db.query(
            `INSERT INTO playlists
            (date, description)
             VALUES ($1, $2)
             RETURNING id AS "playlistID", date, description`,
          [date, description],
      );
      const newPlaylist = playlistInsert.rows[0];

      const showPlaylistInsert = await db.query(
        `INSERT INTO show_playlists
        (show_id, playlist_id)
         VALUES ($1, $2)`,
      [showID, newPlaylist.playlistID],
    );

        return newPlaylist;
    }
  
    /**Get all playlists */
    static async get_all() {
        
        const playlistInfoRes = await db.query(
          `SELECT playlists.id AS "playlistID", playlists.date, playlists.description, shows.id AS "showID", shows.show_name 
           FROM playlists 
           RIGHT JOIN show_playlists ON playlists.id = show_playlists.playlist_id 
           RIGHT JOIN shows ON show_playlists.show_id = shows.id;`);
        
        if (!playlistInfoRes.rows[0]) throw new NotFoundError(`No playlists found`);

        return playlistInfoRes.rows;
    }

    /** Given a playlist id, return info about it and all songs on it.
     *
     * Returns { id, dj_id, dj_name, show_name, day_of_week, show_time, img_url, description }
     * where playlists is [{ id, date, description }, ...]
     * Throws NotFoundError if not found.
     **/
  
    static async get(playlistID) {
        
          const playlistInfoRes = await db.query(
            `SELECT date,
                    description
             FROM playlists
             WHERE id = $1`,
             [playlistID]);

          if (!playlistInfoRes.rows[0]) throw new NotFoundError(`No playlist with ID: ${playlistID}`);
      
          const playlist = playlistInfoRes.rows[0];

          const playlistRes = await db.query(
          `SELECT songs.id AS "songID",
                  songs.title AS "title", 
                  songs.artist AS "artist", 
                  songs.album AS "album", 
                  songs.album_link AS "albumLink", 
                  songs.album_image AS "albumImage", 
                  playlist_songs.song_order AS "songOrder" 
          FROM playlists 
          RIGHT JOIN playlist_songs ON playlists.id = playlist_songs.playlist_id 
          RIGHT JOIN songs ON playlist_songs.song_id = songs.id 
          WHERE playlists.id = $1 
          ORDER BY playlist_songs.song_order`,
          [playlistID]);
  
        playlist.songs = playlistRes.rows;
        
        return playlist;
    }
  
    /** Update playlist with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {djName, showName, dayOfWeek, showTime, imgURL, description}
     *
     * Returns {djName, showName, dayOfWeek, showTime, imgURL, description}
     *
     * Throws NotFoundError if not found.
     * 
     * Throws BadRequestError if trying to change the show name to one that already exists,
     * or if trying to change the date/time to the same date/time of another show.
     */
  
    static async update(playlistID, data) {
  
      const { setCols, values } = sqlForPartialUpdate(
          data,
          {
            description: "description"
          });
      const playlistIDVarIdx = "$" + (values.length + 1);
  
      const querySql = `UPDATE playlists 
                        SET ${setCols} 
                        WHERE id = ${playlistIDVarIdx} 
                        RETURNING id AS "playlistID", 
                                  date, 
                                  description`;
      const result = await db.query(querySql, [...values, playlistID]);
      const playlist = result.rows[0];
  
      if (!playlist) throw new NotFoundError(`No playlist with ID: ${playlistID}`);
  
      return playlist;
    }
  
    /** Delete given playlist from database; returns undefined.
     *
     * Throws NotFoundError if company not found.
     **/
  
    static async remove(playlistID) {
      const playlistDelete = await db.query(
            `DELETE
             FROM playlists
             WHERE id = $1
             RETURNING id`,
          [playlistID]);
      const deletedPlaylist = playlistDelete.rows[0];
  
      if (!deletedPlaylist) throw new NotFoundError(`No playlist w/ ID: ${playlistID}`);
    }
  }
  
  
  module.exports = Playlist;