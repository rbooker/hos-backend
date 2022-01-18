"use strict";

/** Routes for adding/modifying shows **/

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin, ensureDJ } = require("../middleware/auth");
const Show = require("../models/show");

const showNewSchema = require("../schemas/showNew.json");
const showUpdateSchema = require("../schemas/showUpdate.json");
//const companySearchSchema = require("../schemas/companySearch.json");

const router = new express.Router();

/** GET /{dayOfWeek}  =>  { all shows from that day of the week }
 *
 *  If day of week (where 0=Sun, 1=Mon, etc.) included as parameter, returns shows from that day
 *  If no parameter is provided, returns all shows, ordered by day (from 0-6) and time
 *
 * Authorization required: none
 */
router.get("/", async function (req, res, next) {
    const q = req.query;
  
    if (q.dayOfWeek !== undefined) q.dayOfWeek = +q.dayOfWeek;

    try {
      const shows = await Show.findAll(q.dayOfWeek);
      return res.json({ shows });
    } catch (err) {
      return next(err);
    }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

 router.get("/:show_id", async function (req, res, next) {
  try {
    const show = await Show.get(req.params.show_id);
    return res.json({ show });
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
 * Authorization required: admin
 */

 router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, showNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const show = await Show.create(req.body);
    return res.status(201).json({ show });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:show_id", ensureDJ, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, showUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const show = await Show.update(req.params.show_id, req.body);
    return res.json({ show });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: admin
 */

router.delete("/:show_id", ensureAdmin, async function (req, res, next) {
  try {
    await Show.remove(req.params.show_id);
    return res.json({ deleted: req.params.show_id });
  } catch (err) {
    return next(err);
  }
});
module.exports = router;