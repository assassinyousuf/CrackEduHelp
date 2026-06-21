import pg from "pg";
const { Client } = pg;

// Define database connection settings
// You can replace these placeholders with your actual Tailscale / Postgres credentials
const client = new Client({
  host: "100.86.90.14", // Tailscale IP
  port: 5432,
  user: "avenger",
  password: "DhruboXYousuf@2026",
  database: "dhon"
});

async function test() {
  console.log("Attempting to connect to PostgreSQL...");
  try {
    await client.connect();
    console.log("Connection successful!");

    const result = await client.query("SELECT NOW()");
    console.log("Database current timestamp:", result.rows);
  } catch (err) {
    console.error("Connection failed:", err.message || err);
  } finally {
    await client.end();
    console.log("Connection closed.");
  }
}

test();
