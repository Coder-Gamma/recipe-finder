import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const testConnection = async () => {
  console.log("Testing MySQL server connection...");

  try {
    // First test connection to MySQL server (without database)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      port: parseInt(process.env.DB_PORT) || 3306,
    });

    console.log("✅ MySQL server connection successful!");

    // Test a simple query
    const [rows] = await connection.execute("SELECT 1 as test");
    console.log("✅ MySQL server query test successful!");

    // Check if database exists
    const dbName = process.env.DB_NAME || "recipe_finder";
    const [databases] = await connection.execute(
      `SHOW DATABASES LIKE '${dbName}'`
    );

    if (databases.length > 0) {
      console.log(`✅ Database "${dbName}" exists`);
    } else {
      console.log(
        `ℹ️  Database "${dbName}" does not exist yet (will be created during import)`
      );
    }

    await connection.end();
    console.log("\n🚀 Ready to run: npm run init-db");
    process.exit(0);
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    console.log("\nPlease check:");
    console.log("1. MySQL server is running");
    console.log("2. Credentials in .env file are correct");
    console.log("3. MySQL service is started");

    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("4. Username and password are correct");
    }

    process.exit(1);
  }
};

testConnection();
