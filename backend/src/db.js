const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool
  .connect()
  .then((client) => {
    console.log("PostgreSQL database connected successfully");
    client.release();
  })
  .catch((error) => {
    console.error("PostgreSQL connection error:", error.message);
  });

module.exports = pool;