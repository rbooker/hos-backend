"use strict";

/** Routes for adding/modifying playlists **/

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin, ensureDJ } = require("../middleware/auth");
const Playlist = require("../models/playlist");

const playlistNewSchema = require("../schemas/playlistNew.json");
const playlistUpdateSchema = require("../schemas/playlistUpdate.json");

const router = new express.Router();

/** GET /  =>  { all playlists }
 *
 * Authorization required: none
 */

 router.get("/", async function (req, res, next) {
  try {
    const playlists = await Playlist.get_all();
    return res.json({ playlists });
  } catch (err) {
    return next(err);
  }
});

/** GET /[playlistid]  =>  { playlist }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

 router.get("/:playlist_id", async function (req, res, next) {
  try {
    const playlist = await Playlist.get(req.params.playlist_id);
    return res.json({ playlist });
  } catch (err) {
    return next(err);
  }
});

/** POST / { show } =>  { show }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: DJ or admin
 */

 router.post("/", ensureDJ, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, playlistNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const playlist = await Playlist.create(req.body);
    return res.status(201).json({ playlist });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:playlist_id", ensureDJ, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, playlistUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const playlist = await Playlist.update(req.params.playlist_id, req.body);
    return res.json({ playlist });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: admin
 */

router.delete("/:playlist_id", ensureAdmin, async function (req, res, next) {
  try {
    await Playlist.remove(req.params.playlist_id);
    return res.json({ deleted: req.params.playlist_id });
  } catch (err) {
    return next(err);
  }
});
module.exports = router;