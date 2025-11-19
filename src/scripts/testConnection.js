import pool, { testConnection } from "../config/database.js";

const testDB = async () => {
  console.log("Testing MySQL database connection...");

  try {
    const isConnected = await testConnection();

    if (isConnected) {
      console.log("✅ Database connection successful!");

      // Test a simple query
      const [rows] = await pool.execute("SELECT 1 as test");
      console.log("✅ Database query test successful!");

      process.exit(0);
    } else {
      console.log("❌ Database connection failed!");
      console.log("Please check your .env file and MySQL server status.");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Database test failed:", error.message);
    console.log("\nPlease check:");
    console.log("1. MySQL server is running");
    console.log("2. Credentials in .env file are correct");
    console.log("3. Database permissions are set up properly");
    process.exit(1);
  }
};

testDB();
