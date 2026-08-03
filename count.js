require("dotenv").config({ path: "./backend/.env" });
const pool = require("./backend/src/db");
async function run() {
  try {
    const tables = ['kpis', 'alerts', 'notification_logs', 'incidents', 'prediction_history', 'users', 'chat_messages'];
    for (const t of tables) {
      try {
        const res = await pool.query(`SELECT COUNT(*) FROM ${t}`);
        console.log(`${t}: ${res.rows[0].count}`);
      } catch(e) {
        console.log(`${t}: Error - ${e.message}`);
      }
    }
  } finally {
    pool.end();
  }
}
run();
