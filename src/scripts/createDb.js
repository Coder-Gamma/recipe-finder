import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const createDatabaseOnly = async () => {
  let connection;
  try {
    // Connect without specifying database first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      port: parseInt(process.env.DB_PORT) || 3306,
    });

    console.log("Connected to MySQL server");

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || "recipe_finder";
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database "${dbName}" created successfully`);

    // Use the database
    await connection.query(`USE ${dbName}`);

    // Create recipes table with TEXT columns (not JSON)
    const createRecipesTable = `
      CREATE TABLE IF NOT EXISTS recipes (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cuisine VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        instructions TEXT NOT NULL,
        ingredients TEXT NOT NULL,
        image_url VARCHAR(500),
        youtube VARCHAR(500),
        source VARCHAR(500),
        tags TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await connection.query(createRecipesTable);
    console.log("✅ Recipes table created successfully");

    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        gender VARCHAR(20),
        age INT,
        address TEXT,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await connection.query(createUsersTable);
    console.log("✅ Users table created successfully");

    console.log("✅ Database setup completed!");
  } catch (error) {
    console.error("❌ Error creating database:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

createDatabaseOnly()
  .then(() => {
    console.log("Database creation completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Database creation failed:", error);
    process.exit(1);
  });
