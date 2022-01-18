"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

let db;

if (process.env.NODE_ENV === "production") {
  db = new Client({
    connectionString: getDatabaseUri(),
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  db = new Client({
    host: 'localhost',
    user: 'ryanb',
    password: 'yamahacs5',
    database: getDatabaseUri()
  });
}

db.connect();

module.exports = db;