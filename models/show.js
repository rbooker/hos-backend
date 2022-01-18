"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for shows. */

class Show {
  /** Create a show (from data), update db, return new company data.
   *
   * data should be { djID, djName, showName, dayOfWeek, showTime, imgURL, description }
   *
   * Returns { id, djID, djName, showName, dayOfWeek, showTime, imgURL, description }
   *
   * Throws BadRequestError if show name or a show with the same date/time already in database.
   * */

  static async create({ djID, djName, showName, dayOfWeek, showTime, imgURL, description}) {
    //Check for duplicate name (unlikely, but... may as well)
    const duplicateCheck = await db.query(
          `SELECT show_name
           FROM shows
           WHERE show_name = $1`,
        [showName]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${showName}`);

    //Check for same day/time
    const sameDayandTime = await db.query(
      `SELECT show_name
       FROM shows where day_of_week = $1 
       AND show_time = $2`,
    [dayOfWeek, showTime]);

    if (sameDayandTime.rows[0])
      throw new BadRequestError(`Duplicate date/time: ${dayOfWeek}/${showTime}`);
      
      
    const result = await db.query(
          `INSERT INTO shows
          (dj_id, dj_name, show_name, day_of_week, show_time, img_url, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, dj_id AS "djID", dj_name AS "djName", show_name AS "showName",
           day_of_week AS "dayOfWeek", show_time AS "showTime", img_url AS "imgURL", description`,
        [
          djID,
          djName,
          showName,
          dayOfWeek,
          showTime,
          imgURL,
          description
        ],
    );
    const newShow = result.rows[0];

    return newShow;
  }

  /** Find all shows (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - day of the week
   *
   * Returns [{ id, dj_id, dj_name, show_name, day_of_week, show_time, img_url, description }, ...]
   * */

  static async findAll(searchQuery) {
    let query = `SELECT id,
                        dj_id AS "djID",
                        dj_name AS "djName",
                        show_name AS "showName",
                        day_of_week AS "dayOfWeek",
                        show_time AS "showTime",
                        img_url AS "imgURL",
                        description
                 FROM shows`;
    let queryValues = [];

    if (searchQuery !== undefined){
    //const { dayOfWeek } = searchFilters;

    if ([0,1,2,3,4,5,6].includes(searchQuery)){
            queryValues.push(searchQuery);
            query += " WHERE day_of_week = $1";
    }

    else {
            throw new BadRequestError("dayOfWeek must be an integer from 0-6; 0 = Sun, 1 = Mon, etc.");
    }
  }

    query += " ORDER BY day_of_week, show_time DESC";
    console.log(query);
    const showsRes = await db.query(query, queryValues);
    return showsRes.rows;
  }

  /** Given a show id, return data about show, and all its playlists.
   *
   * Returns { id, dj_id, dj_name, show_name, day_of_week, show_time, img_url, description }
   * where playlists is [{ id, date, description }, ...]
   * Throws NotFoundError if not found.
   **/

  static async get(showID) {
    const showRes = await db.query(
        `SELECT id,
          dj_id AS "djID",
          dj_name AS "djName",
          show_name AS "showName",
          day_of_week AS "dayOfWeek",
          show_time AS "showTime",
          img_url AS "imgURL",
          description
          FROM shows
          WHERE id = $1`,
        [showID]);

    const show = showRes.rows[0];

    if (!show) throw new NotFoundError(`No show with ID: ${showID}`);

    const playlistsRes = await db.query(
        `SELECT playlists.id, playlists.date, playlists.description 
          FROM shows 
          RIGHT JOIN show_playlists ON shows.id = show_playlists.show_id 
          RIGHT JOIN playlists ON show_playlists.playlist_id = playlists.id 
          WHERE shows.id = $1 
          ORDER BY playlists.date DESC`,
        [showID],
    );

    show.playlists = playlistsRes.rows;

    return show;
  }

  /** Update show data with `data`.
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

  static async update(showID, data) {
    //Duplicate checking-----------------------------------------
    //Check for duplicate name (unlikely, but... may as well)

    //Check for same day/time
    const sameDayandTime = await db.query(
     `SELECT show_name
      FROM shows where day_of_week = $1 
      AND show_time = $2`,
      [data.dayOfWeek, data.showTime]);
    
    if (sameDayandTime.rows[0])
      throw new BadRequestError(`Duplicate date/time: ${data.dayOfWeek}/${data.showTime}`);
    //End duplcate checking ---------------------------------------

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          djName: "dj_name",
          showName: "show_name",
          dayOfWeek: "day_of_week",
          showTime: "show_time",
          imgURL: "img_url",
          description: "description"
        });
    const showIDVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE shows 
                      SET ${setCols} 
                      WHERE id = ${showIDVarIdx} 
                      RETURNING id, 
                                dj_name AS "djName",
                                show_name AS "showName",
                                day_of_week AS "dayOfWeek",
                                show_time AS "showTime",
                                img_url AS "imgURL", 
                                description`;
    const result = await db.query(querySql, [...values, showID]);
    const show = result.rows[0];

    if (!show) throw new NotFoundError(`No company with ID: ${showID}`);

    return show;
  }

  /** Delete given show from database; returns undefined.
   *
   * Throws NotFoundError if show not found.
   **/

  static async remove(showID) {
    const showDelete = await db.query(
          `DELETE
           FROM shows
           WHERE id = $1
           RETURNING id`,
        [showID]);
    const deletedShow = showDelete.rows[0];

    if (!deletedShow) throw new NotFoundError(`No show w/ ID: ${showID}`);
  }
}


module.exports = Show;