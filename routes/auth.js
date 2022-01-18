"use strict";

/** Routes for authentication. */

const jsonschema = require("jsonschema");

const Member = require("../models/member");
const express = require("express");
const router = new express.Router();
const { createToken } = require("../helpers/tokens");
const memberAuthSchema = require("../schemas/memberAuth.json");
const memberRegisterSchema = require("../schemas/memberRegister.json");
const { BadRequestError } = require("../expressError");

/** POST /auth/token:  { username, password } => { token }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/token", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, memberAuthSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const { username, password } = req.body;
    const member = await Member.authenticate(username, password);
    const token = createToken(member);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});


/** POST /auth/register:   { user } => { token }
 *
 * user must include { username, password, firstName, lastName, email }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/register", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, memberRegisterSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const newMember = await Member.register({ ...req.body, isDJ: false, isAdmin: false, donated: false });
    const token = createToken(newMember);
    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
