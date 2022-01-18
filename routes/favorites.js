"use strict";

/** Routes for adding/modifying companies **/

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const Favorite = require("../models/favorite");

const favoriteNewSchema = require("../schemas/favoriteNew.json");
const favoriteDeleteSchema = require("../schemas/favoriteDelete.json");

const router = new express.Router();

// REMEMBER TO ADD A GET ROUTE THAT GETS ALL A MEMBER'S FAVORITES
/** GET /[playlistid]  =>  { playlist }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

 router.get("/:member_id", async function (req, res, next) {
  try {
    const memberFavorites = await Favorite.get(req.params.member_id);
    return res.json({ memberFavorites });
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

 router.post("/", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, favoriteNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const favorite = await Favorite.create(req.body);
    return res.status(201).json({ favorite });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: admin
 */

router.delete("/", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, favoriteDeleteSchema);
        if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          throw new BadRequestError(errs);
        }
    
        await Favorite.remove(req.body);
      } catch (err) {
        return next(err);
    }
});
module.exports = router;