"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for favoriting playlists. */

class Favorite {
    /** 
     * Create a favorite
     * */
  
    static async create({memberID, showID}) {

      //Check if member exists, throw error if it doesn't
      const memberQuery = await db.query(
        `SELECT id
         FROM members where id = $1`,
      [memberID]);

      if (!memberQuery.rows[0])
        throw new BadRequestError(`No member exists w/ ID: ${memberID}`);

    //Check if show exists, throw error if it doesn't
    const showQuery = await db.query(
        `SELECT id
         FROM shows where id = $1`,
      [showID]);

      if (!showQuery.rows[0])
        throw new BadRequestError(`No show exists w/ ID: ${memberID}`);
      
     //Check to see if the show has already been favorited by the member
      const favoriteDuplicateCheck = await db.query(
            `SELECT id 
             FROM member_favorites  
             WHERE member_id = $1 AND show_id = $2`,
          [memberID, showID]);
  
        if (favoriteDuplicateCheck.rows[0])
            throw new BadRequestError(`Show w/ID: ${showID} already favorited by member w/ID ${memberID}`);

     //If a duplicate doesn't exist, create a new entry in the song db for the song data provided
        const addFavorite = await db.query(
            `INSERT INTO member_favorites
            (member_id, show_id)
             VALUES ($1, $2)
             RETURNING id AS "favoriteID", member_id AS "memberID", show_id AS "showID"`,
            [memberID, showID],
        );
        const favoriteInfo = addFavorite.rows[0];
      
      return favoriteInfo;
    }
  
  
    static async get(memberID) {
      const favoriteRes = await db.query(
          `SELECT show_id AS "showID"
            FROM member_favorites
            WHERE member_id = $1`,
          [memberID]);
  
      const memberFavorites = favoriteRes.rows;
  
      return memberFavorites;
    }
    
    /** Delete given song from a given playlist; returns undefined.
     *
     * Doesn't actually delete a song - just removes it from a playlist
     * 
     * Throws NotFoundError if song or playlist not found.
     **/
  
    static async remove({memberID, showID}) {
      const favoriteDelete = await db.query(
            `DELETE
             FROM member_favorites
             WHERE member_id = $1 AND show_id = $2
             RETURNING id`,
          [memberID, showID]);
      const deletedFavorite = favoriteDelete.rows[0];
  
      if (!deletedFavorite) throw new NotFoundError(`No member/show combo w/ IDs: ${memberID}/${showID}`);

      return deletedFavorite;
    }
  }
  
  
  module.exports = Favorite;