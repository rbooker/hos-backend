"use strict";

/** Routes for adding/modifying companies **/

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin, ensureDJ } = require("../middleware/auth");
const Song = require("../models/song");

const songNewSchema = require("../schemas/songNew.json");
const songUpdateSchema = require("../schemas/songUpdate.json");
const songDeleteSchema = require("../schemas/songDelete.json");

const router = new express.Router();

/** POST / { song } =>  { song }
 *
 * song should be {  }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: DJ or admin
 */

 router.post("/", ensureDJ, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, songNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const songAdded = await Song.create(req.body);
    return res.status(201).json({ songAdded });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:song_id", ensureDJ, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, songUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const songUpdated = await Song.update(req.params.song_id, req.body);
    return res.json({ songUpdated });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /  =>  { deleted: songID }
 *
 * Authorization: admin
 */

router.delete("/", ensureDJ, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, songDeleteSchema);
        if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          throw new BadRequestError(errs);
        }
    
        await Song.remove(req.body);
        return res.json({deletedSongInfo: { deletedsongID: req.body.songID, playlistDeletedFromID: req.body.playlistID }});
      } catch (err) {
        return next(err);
    }
});
module.exports = router;