import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "c0der_Gama*",
  database: process.env.DB_NAME || "recipe_finder",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: "utf8mb4",
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection function
export const testConnection = async () => {
  try {
    // Test the pool connection
    const connection = await pool.getConnection();
    console.log("✅ Database connection pool established successfully");

    // Test a simple query
    const [rows] = await connection.execute("SELECT 1 as test");
    console.log("✅ Database query test successful");

    // Release connection back to pool
    connection.release();

    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("1. Ensure MySQL server is running");
    console.log("2. Check your .env file configuration");
    console.log("3. Verify database credentials");
    console.log("4. Ensure database 'recipe_finder' exists");
    console.log("5. Check if MySQL service is started");

    return false;
  }
};

// Graceful shutdown function
export const closePool = async () => {
  try {
    await pool.end();
    console.log("✅ Database connection pool closed successfully");
  } catch (error) {
    console.error("❌ Error closing database pool:", error.message);
  }
};

// Handle process termination
process.on("SIGINT", async () => {
  console.log(
    "\n🔄 Received SIGINT, gracefully shutting down database connections..."
  );
  await closePool();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log(
    "\n🔄 Received SIGTERM, gracefully shutting down database connections..."
  );
  await closePool();
  process.exit(0);
});

// Export the pool as default
export default pool;
