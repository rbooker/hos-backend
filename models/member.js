"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class Member {
  /** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email, is_dj, is_admin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
          `SELECT username,
                  password,
                  firstname AS "firstName",
                  lastname AS "lastName",
                  email,
                  is_dj AS "isDJ",
                  is_admin AS "isAdmin",
                  donated
           FROM members
           WHERE username = $1`,
        [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isDJ, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
      { username, password, firstName, lastName, email, isDJ, isAdmin, donated}) {
    const duplicateCheck = await db.query(
          `SELECT username
           FROM members
           WHERE username = $1`,
        [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
          `INSERT INTO members
           (username,
            password,
            firstname,
            lastname,
            email,
            is_dj,
            is_admin,
            donated)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING username, firstname AS "firstName", lastname AS "lastName", email, is_dj AS "isDJ", is_admin AS "isAdmin", donated`,
        [
          username,
          hashedPassword,
          firstName,
          lastName,
          email,
          isDJ,
          isAdmin,
          donated
        ],
    );

    const member = result.rows[0];

    return member;
  }

  /** Find all users.
   *
   * Returns [{ username, first_name, last_name, email, is_admin }, ...]
   **/

  static async findAll() {
    const result = await db.query(
          `SELECT id,
                  username,
                  firstname AS "firstName",
                  lastname AS "lastName",
                  email,
                  is_dj AS "isDJ",
                  is_admin AS "isAdmin",
                  donated
           FROM members
           ORDER BY username`,
    );

    return result.rows;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, is_admin, jobs }
   *   where jobs is { id, title, company_handle, company_name, state }
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
          `SELECT id,
                  username,
                  firstname AS "firstName",
                  lastname AS "lastName",
                  email,
                  is_dj AS "isDJ",
                  is_admin AS "isAdmin",
                  donated
           FROM members
           WHERE username = $1`,
        [username],
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    const showRes = await db.query(
      `SELECT id
       FROM shows
       WHERE dj_id = $1`,
       [user.id],
    );

    if(showRes.rows[0])
      user.showID = showRes.rows[0].id;
    else
      user.showID = null;
    
    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin }
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          firstName: "firstname",
          lastName: "lastname",
          email: "email",
          password: "password",
          isDJ: "is_dj",
          isAdmin: "is_admin",
          donated: "donated"
        });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE members 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                firstname AS "firstName",
                                lastname AS "lastName",
                                email,
                                is_dj AS "isDJ",
                                is_admin AS "isAdmin",
                                donated`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
          `DELETE
           FROM members
           WHERE username = $1
           RETURNING username`,
        [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }
}


module.exports = Member;