import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import pool, { testConnection } from "./src/config/database.js";
import {
  validateImage,
  optimizeImage,
} from "./src/utils/serverImageValidation.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public/uploads/recipes/"));
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "recipe-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Test database connection on startup
testConnection();

// Routes
// Root endpoint
app.get("/", (req, res) => {
  res.send("Recipe Finder API is running!");
});

// API root endpoint
app.get("/api", (req, res) => {
  res.send("Recipe Finder API root. See /api/recipes, /api/health, etc.");
});

// Image upload endpoint
app.post("/api/upload/image", upload.single("image"), async (req, res) => {
  console.log("Upload request received");
  console.log("File:", req.file);
  console.log("Body:", req.body);

  try {
    if (!req.file) {
      console.error("No file provided in request");
      return res.status(400).json({ error: "No image file provided" });
    }

    const originalFilePath = req.file.path;
    console.log("File uploaded to:", originalFilePath);

    // Validate the uploaded image
    const validationResult = await validateImage(originalFilePath);
    if (!validationResult.isValid) {
      // Remove the invalid file
      try {
        await import("fs/promises").then((fs) => fs.unlink(originalFilePath));
      } catch (cleanupError) {
        console.error("Failed to cleanup invalid file:", cleanupError);
      }

      return res.status(400).json({
        error: validationResult.error || "Invalid image file",
      });
    }

    // Optimize the image (resize if needed, compress)
    const optimizedFilePath = originalFilePath.replace(
      path.extname(originalFilePath),
      "_optimized.jpg"
    );

    try {
      await optimizeImage(originalFilePath, optimizedFilePath, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 85,
      });

      // Use the optimized file name for the response
      const optimizedFileName = path.basename(optimizedFilePath);
      const imageUrl = `/uploads/recipes/${optimizedFileName}`;

      console.log("Image processed successfully:", optimizedFileName);

      res.json({
        imageUrl: imageUrl,
        message: "Image uploaded and validated successfully",
        metadata: validationResult.metadata,
      });
    } catch (optimizationError) {
      console.error("Image optimization error:", optimizationError);

      // If optimization fails, use the original file
      const imageUrl = `/uploads/recipes/${req.file.filename}`;

      res.json({
        imageUrl: imageUrl,
        message: "Image uploaded successfully (optimization skipped)",
        metadata: validationResult.metadata,
        warning: "Image optimization failed but upload succeeded",
      });
    }
  } catch (error) {
    console.error("Image upload error:", error);

    // Cleanup file if it exists
    if (req.file && req.file.path) {
      try {
        await import("fs/promises").then((fs) => fs.unlink(req.file.path));
      } catch (cleanupError) {
        console.error("Failed to cleanup file after error:", cleanupError);
      }
    }

    res.status(500).json({ error: "Failed to process image upload" });
  }
});

// Handle multer errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File size too large. Maximum size is 5MB." });
    }
  }

  if (error.message === "Only image files are allowed!") {
    return res.status(400).json({ error: "Only image files are allowed!" });
  }

  next(error);
});

// Get all recipes
app.get("/api/recipes", async (req, res) => {
  try {
    const { cuisine, category, search } = req.query;
    let query = "SELECT * FROM recipes WHERE 1=1";
    const params = [];

    if (cuisine) {
      query += " AND cuisine = ?";
      params.push(cuisine);
    }

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    if (search) {
      query += " AND (name LIKE ? OR tags LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY name";

    const [rows] = await pool.execute(query, params);

    // Convert comma-separated text to arrays
    const recipes = rows.map((recipe) => {
      return {
        ...recipe,
        instructions: recipe.instructions
          ? recipe.instructions
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item)
          : [],
        ingredients: recipe.ingredients
          ? recipe.ingredients
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item)
          : [],
        tags: recipe.tags
          ? recipe.tags
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item)
          : [],
      };
    });

    res.json({ recipes });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get recipe recommendations based on a specific recipe
app.get("/api/recipes/:id/recommendations", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 6 } = req.query;

    // First get the target recipe
    const [targetRows] = await pool.execute(
      "SELECT * FROM recipes WHERE id = ?",
      [id]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const targetRecipe = targetRows[0];

    // Get all other recipes for comparison
    const [allRows] = await pool.execute(
      "SELECT * FROM recipes WHERE id != ? ORDER BY name",
      [id]
    );

    // Convert comma-separated strings to arrays for better comparison
    const processRecipe = (recipe) => ({
      ...recipe,
      instructions: recipe.instructions
        ? recipe.instructions
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item)
        : [],
      ingredients: recipe.ingredients
        ? recipe.ingredients
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item)
        : [],
      tags: recipe.tags
        ? recipe.tags
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item)
        : [],
    });

    const processedTarget = processRecipe(targetRecipe);
    const candidateRecipes = allRows.map(processRecipe);

    // Calculate similarity scores
    const recommendations = candidateRecipes
      .map((candidate) => {
        let score = 0;
        const reasons = [];

        // Same cuisine (40% weight)
        if (processedTarget.cuisine === candidate.cuisine) {
          score += 0.4;
          reasons.push(`Same cuisine (${candidate.cuisine})`);
        }

        // Same category (30% weight)
        if (processedTarget.category === candidate.category) {
          score += 0.3;
          reasons.push(`Same category (${candidate.category})`);
        }

        // Similar tags (20% weight)
        const targetTags = new Set(
          processedTarget.tags.map((tag) => tag.toLowerCase())
        );
        const candidateTags = new Set(
          candidate.tags.map((tag) => tag.toLowerCase())
        );
        const tagIntersection = new Set(
          [...targetTags].filter((tag) => candidateTags.has(tag))
        );
        const tagUnion = new Set([...targetTags, ...candidateTags]);

        if (tagUnion.size > 0) {
          const tagSimilarity = tagIntersection.size / tagUnion.size;
          score += tagSimilarity * 0.2;

          if (tagIntersection.size > 0) {
            const commonTags = [...tagIntersection].slice(0, 3);
            reasons.push(`Similar tags: ${commonTags.join(", ")}`);
          }
        }

        // Similar ingredients (10% weight)
        const targetIngredients = new Set(
          processedTarget.ingredients.map((ing) => ing.toLowerCase())
        );
        const candidateIngredients = new Set(
          candidate.ingredients.map((ing) => ing.toLowerCase())
        );
        const ingredientIntersection = new Set(
          [...targetIngredients].filter((ing) => candidateIngredients.has(ing))
        );
        const ingredientUnion = new Set([
          ...targetIngredients,
          ...candidateIngredients,
        ]);

        if (ingredientUnion.size > 0) {
          const ingredientSimilarity =
            ingredientIntersection.size / ingredientUnion.size;
          score += ingredientSimilarity * 0.1;

          if (ingredientIntersection.size > 0) {
            const commonIngredients = [...ingredientIntersection].slice(0, 2);
            reasons.push(
              `Similar ingredients: ${commonIngredients.join(", ")}`
            );
          }
        }

        return {
          recipe: candidate,
          score,
          reasons: reasons.length > 0 ? reasons : ["Similar recipe"],
        };
      })
      .filter((rec) => rec.score > 0.1) // Only include recipes with some similarity
      .sort((a, b) => b.score - a.score) // Sort by score (highest first)
      .slice(0, parseInt(limit)); // Limit results

    res.json({ recommendations });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get recipe by ID
app.get("/api/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute("SELECT * FROM recipes WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const recipe = {
      ...rows[0],
      instructions: rows[0].instructions
        ? rows[0].instructions
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item)
        : [],
      ingredients: rows[0].ingredients
        ? rows[0].ingredients
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item)
        : [],
      tags: rows[0].tags
        ? rows[0].tags
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item)
        : [],
    };

    res.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all cuisines
app.get("/api/cuisines", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT DISTINCT cuisine FROM recipes ORDER BY cuisine"
    );
    const cuisines = rows.map((row) => row.cuisine);
    res.json(cuisines);
  } catch (error) {
    console.error("Error fetching cuisines:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT DISTINCT category FROM recipes ORDER BY category"
    );
    const categories = rows.map((row) => row.category);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a new recipe
app.post("/api/recipes", async (req, res) => {
  try {
    const {
      id,
      name,
      cuisine,
      category,
      instructions,
      ingredients,
      image_url,
      youtube,
      source,
      tags,
    } = req.body;

    if (
      !id ||
      !name ||
      !cuisine ||
      !category ||
      !instructions ||
      !ingredients
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const insertQuery = `
      INSERT INTO recipes (id, name, cuisine, category, instructions, ingredients, image_url, youtube, source, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(insertQuery, [
      id,
      name,
      cuisine,
      category,
      Array.isArray(instructions) ? instructions.join(", ") : instructions,
      Array.isArray(ingredients) ? ingredients.join(", ") : ingredients,
      image_url || null,
      youtube || null,
      source || null,
      Array.isArray(tags) ? tags.join(", ") : tags || "",
    ]);

    res.status(201).json({ message: "Recipe created successfully", id });
  } catch (error) {
    console.error("Error creating recipe:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(409).json({ error: "Recipe with this ID already exists" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Update a recipe
app.put("/api/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      cuisine,
      category,
      instructions,
      ingredients,
      image_url,
      youtube,
      source,
      tags,
    } = req.body;

    // Validate required fields
    if (!name || !cuisine || !category || !instructions || !ingredients) {
      return res.status(400).json({
        error:
          "Missing required fields: name, cuisine, category, instructions, ingredients",
      });
    }

    // Ensure arrays
    const instructionsArray = Array.isArray(instructions)
      ? instructions
      : [instructions];
    const ingredientsArray = Array.isArray(ingredients)
      ? ingredients
      : [ingredients];
    const tagsArray = Array.isArray(tags) ? tags : tags ? [tags] : [];

    const updateQuery = `
      UPDATE recipes 
      SET name = ?, cuisine = ?, category = ?, instructions = ?, ingredients = ?, 
          image_url = ?, youtube = ?, source = ?, tags = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute(updateQuery, [
      name,
      cuisine,
      category,
      Array.isArray(instructionsArray)
        ? instructionsArray.join(", ")
        : instructionsArray,
      Array.isArray(ingredientsArray)
        ? ingredientsArray.join(", ")
        : ingredientsArray,
      image_url || null,
      youtube || null,
      source || null,
      Array.isArray(tagsArray) ? tagsArray.join(", ") : tagsArray || "",
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.json({ message: "Recipe updated successfully" });
  } catch (error) {
    console.error("Error updating recipe:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a recipe
app.delete("/api/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute("DELETE FROM recipes WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const isConnected = await testConnection();
    res.json({
      status: "ok",
      database: isConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

// Authentication Routes

// Register new user
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, gender, age, address } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // In a real app, you would hash the password here
    const insertQuery = `
      INSERT INTO users (name, email, password, gender, age, address, username, password_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(insertQuery, [
      name,
      email,
      password, // Note: In production, hash this password
      gender || null,
      age || null,
      address || null,
      email, // Use email as username for compatibility
      password, // Duplicate password for password_hash compatibility
    ]);

    // Create mock token (in production, use JWT)
    const token = `mock_token_${result.insertId}_${Date.now()}`;

    const user = {
      id: result.insertId,
      name,
      email,
      gender: gender || null,
      age: age || null,
      address: address || null,
      role: "user",
      created_at: new Date().toISOString(),
    };

    res.status(201).json({
      message: "User registered successfully",
      user,
      token,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login user
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];

    // In a real app, you would compare hashed passwords
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create mock token (in production, use JWT)
    const token = `mock_token_${user.id}_${Date.now()}`;

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      gender: user.gender,
      address: user.address,
      created_at: user.created_at,
    };

    res.json({
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile (authenticated endpoint)
app.put("/api/auth/profile", async (req, res) => {
  try {
    const { name, email, gender, age, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // In a real app, you would extract user ID from JWT token
    // For now, we'll use the email to identify the user
    const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    const updateQuery = `
      UPDATE users 
      SET name = ?, gender = ?, age = ?, address = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await pool.execute(updateQuery, [
      name,
      gender || null,
      age || null,
      address || null,
      user.id,
    ]);

    // Return updated user data
    const [updatedUsers] = await pool.execute(
      "SELECT * FROM users WHERE id = ?",
      [user.id]
    );
    const updatedUser = updatedUsers[0];

    const userResponse = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      gender: updatedUser.gender,
      age: updatedUser.age,
      address: updatedUser.address,
      role: updatedUser.role || "user",
    };

    res.json({
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User Management Routes

// Update user profile
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, gender, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const updateQuery = `
      UPDATE users 
      SET name = ?, email = ?, gender = ?, address = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await pool.execute(updateQuery, [
      name,
      email,
      gender || null,
      address || null,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User profile updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user profile
app.get("/api/users/profile", async (req, res) => {
  try {
    // In a real app, you would get user ID from JWT token
    // For now, this is a placeholder
    res.json({ message: "User profile endpoint" });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Simple authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // For now, extract user ID from mock token (in production, decode JWT)
    const tokenParts = token.split("_");
    if (
      tokenParts.length < 3 ||
      tokenParts[0] !== "mock" ||
      tokenParts[1] !== "token"
    ) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = tokenParts[2];

    // Verify user exists
    const [users] = await pool.execute(
      "SELECT id, name, email FROM users WHERE id = ?",
      [userId]
    );
    if (users.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

// Get user's favorite recipes
app.get("/api/favorites", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's favorite recipe IDs
    const [users] = await pool.execute(
      "SELECT favorite_recipes FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.json([]);
    }

    const favoriteRecipeIds = users[0].favorite_recipes;
    if (!favoriteRecipeIds) {
      return res.json([]);
    }

    // Parse the comma-separated list of recipe IDs
    const recipeIds = favoriteRecipeIds
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id);

    if (recipeIds.length === 0) {
      return res.json([]);
    }

    // Get the actual recipe data
    const placeholders = recipeIds.map(() => "?").join(",");
    const query = `SELECT * FROM recipes WHERE id IN (${placeholders})`;
    const [recipes] = await pool.execute(query, recipeIds);

    // Convert comma-separated text to arrays (same as in get recipes endpoint)
    const formattedRecipes = recipes.map((recipe) => {
      return {
        ...recipe,
        instructions: recipe.instructions
          ? recipe.instructions
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item)
          : [],
        ingredients: recipe.ingredients
          ? recipe.ingredients
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item)
          : [],
        tags: recipe.tags
          ? recipe.tags
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item)
          : [],
      };
    });

    res.json(formattedRecipes);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add recipe to favorites
app.post("/api/favorites/:recipeId", authenticateUser, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.user.id;

    // Verify recipe exists
    const [recipes] = await pool.execute(
      "SELECT id FROM recipes WHERE id = ?",
      [recipeId]
    );
    if (recipes.length === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    // Get current favorites
    const [users] = await pool.execute(
      "SELECT favorite_recipes FROM users WHERE id = ?",
      [userId]
    );

    let currentFavorites = [];
    if (users[0].favorite_recipes) {
      currentFavorites = users[0].favorite_recipes
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);
    }

    // Check if already favorited
    if (currentFavorites.includes(recipeId)) {
      return res.json({ message: "Recipe already in favorites" });
    }

    // Add to favorites
    currentFavorites.push(recipeId);
    const updatedFavorites = currentFavorites.join(",");

    await pool.execute("UPDATE users SET favorite_recipes = ? WHERE id = ?", [
      updatedFavorites,
      userId,
    ]);

    res.json({ message: `Recipe ${recipeId} added to favorites` });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove recipe from favorites
app.delete("/api/favorites/:recipeId", authenticateUser, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.user.id;

    // Get current favorites
    const [users] = await pool.execute(
      "SELECT favorite_recipes FROM users WHERE id = ?",
      [userId]
    );

    let currentFavorites = [];
    if (users[0].favorite_recipes) {
      currentFavorites = users[0].favorite_recipes
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);
    }

    // Remove from favorites
    const updatedFavorites = currentFavorites.filter((id) => id !== recipeId);
    const favoritesString =
      updatedFavorites.length > 0 ? updatedFavorites.join(",") : null;

    await pool.execute("UPDATE users SET favorite_recipes = ? WHERE id = ?", [
      favoritesString,
      userId,
    ]);

    res.json({ message: `Recipe ${recipeId} removed from favorites` });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

export default app;
