// Dynamic imports to avoid module loading issues
// import * as mobilenet from "@tensorflow-models/mobilenet";

// Type definition for MobileNet model
type MobileNetModel = {
  classify: (
    image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageData
  ) => Promise<
    Array<{
      className: string;
      probability: number;
    }>
  >;
};

// Food-related classes from ImageNet that we consider valid
const FOOD_RELATED_CLASSES = [
  // Fruits
  "banana",
  "apple",
  "strawberry",
  "orange",
  "lemon",
  "pineapple",
  "coconut",
  "pomegranate",
  "fig",
  "bell pepper",
  "cucumber",
  "artichoke",
  "cardoon",

  // Vegetables
  "broccoli",
  "cauliflower",
  "zucchini",
  "spaghetti squash",
  "acorn squash",
  "butternut squash",
  "cucumber",
  "artichoke",
  "bell pepper",
  "hot pepper",
  "chili",
  "sweet potato",
  "head cabbage",
  "mushroom",

  // Prepared foods
  "pizza",
  "cheeseburger",
  "hotdog",
  "ice cream",
  "french loaf",
  "bagel",
  "pretzel",
  "burrito",
  "taco",
  "sushi",
  "chocolate sauce",
  "custard",
  "chocolate bar",
  "lollipop",
  "trifle",
  "muffin",
  "croissant",
  "meat loaf",
  "consomme",
  "guacamole",
  "carbonara",

  // Beverages and liquid foods
  "espresso",
  "cup",
  "coffee mug",
  "wine bottle",
  "cocktail shaker",
  "pitcher",
  "water bottle",
  "pop bottle",
  "beer bottle",

  // Cooking related items
  "ladle",
  "spatula",
  "whisk",
  "mixing bowl",
  "wooden spoon",
  "cutting board",
  "kitchen knife",
  "cleaver",
  "frying pan",
  "wok",
  "caldron",
  "stockpot",
  "dutch oven",
  "pressure cooker",
  "slow cooker",
  "microwave",
  "toaster",
  "espresso machine",
  "coffee maker",
  "blender",
  "food processor",

  // Grains and legumes
  "corn",
  "ear",
  "rapeseed",
  "buckeye",
  "chestnut",
  "acorn",

  // Seafood
  "lobster",
  "crab",
  "crayfish",
  "shrimp",
  "scallop",
  "sea urchin",

  // Meat and poultry (cooked)
  "meat loaf",
  "bacon",
  "sausage",

  // Dairy and eggs
  "egg",
  "custard",
  "eggnog",
  "ice cream",

  // Spices and condiments
  "pepper",
  "salt shaker",
  "saltshaker",
];

// Keywords that indicate food content in class names
const FOOD_KEYWORDS = [
  "food",
  "meal",
  "dish",
  "plate",
  "bowl",
  "cup",
  "mug",
  "bottle",
  "fruit",
  "vegetable",
  "meat",
  "fish",
  "bread",
  "cake",
  "cookie",
  "sandwich",
  "soup",
  "salad",
  "pasta",
  "rice",
  "noodle",
  "sauce",
  "spice",
  "herb",
  "ingredient",
  "cooking",
  "kitchen",
  "recipe",
  "drink",
  "beverage",
  "juice",
  "milk",
  "cheese",
  "yogurt",
  "cereal",
  "grain",
  "bean",
  "nut",
  "seed",
  "oil",
  "vinegar",
  "sugar",
  "honey",
  "syrup",
  "jam",
  "butter",
  "cream",
];

let model: MobileNetModel | null = null;

/**
 * Load the MobileNet model with enhanced error handling
 */
export const loadModel = async (): Promise<MobileNetModel> => {
  if (!model) {
    try {
      console.log("🤖 Loading MobileNet model...");

      // Load TensorFlow.js using the main bundle (more compatible)
      try {
        console.log("🔄 Loading TensorFlow.js main bundle...");
        await import("@tensorflow/tfjs");
        console.log("✅ TensorFlow.js loaded successfully");
      } catch (tfError) {
        console.error("❌ Failed to load TensorFlow.js:", tfError);
        throw new Error("Failed to initialize TensorFlow.js");
      }

      // Load the MobileNet model dynamically
      console.log("🔄 Loading MobileNet model...");
      const mobilenet = await import("@tensorflow-models/mobilenet");
      model = await mobilenet.load();
      console.log("✅ MobileNet model loaded successfully");

      return model;
    } catch (error) {
      console.error("❌ Failed to load MobileNet model:", error);

      // Provide more specific error information
      if (error instanceof Error) {
        if (
          error.message.includes("fetch") ||
          error.message.includes("network")
        ) {
          throw new Error(
            "Failed to download AI model. Please check your internet connection and try again."
          );
        } else if (
          error.message.includes("WebGL") ||
          error.message.includes("canvas")
        ) {
          throw new Error(
            "Your browser does not support the required graphics features. Please update your browser or try a different one."
          );
        } else if (
          error.message.includes("memory") ||
          error.message.includes("quota")
        ) {
          throw new Error(
            "Not enough memory to load the AI model. Please close other browser tabs and try again."
          );
        } else {
          throw new Error(`AI model loading failed: ${error.message}`);
        }
      }

      throw new Error(
        "Unknown error occurred while loading AI model. Please refresh the page and try again."
      );
    }
  }
  return model!; // Non-null assertion since model is assigned above
};

/**
 * Check if a prediction class name indicates food content
 */
const isFoodRelated = (className: string): boolean => {
  const lowerClassName = className.toLowerCase();

  // Check exact matches with food-related classes
  if (
    FOOD_RELATED_CLASSES.some((foodClass) =>
      lowerClassName.includes(foodClass.toLowerCase())
    )
  ) {
    return true;
  }

  // Check for food keywords
  if (
    FOOD_KEYWORDS.some((keyword) =>
      lowerClassName.includes(keyword.toLowerCase())
    )
  ) {
    return true;
  }

  return false;
};

/**
 * Validate if an image contains food or food-related items with enhanced error handling
 */
export const validateFoodImage = async (
  imageElement: HTMLImageElement
): Promise<{
  isValid: boolean;
  confidence: number;
  predictions: Array<{ className: string; probability: number }>;
  reason?: string;
}> => {
  try {
    console.log("🔍 Starting image validation...");

    // Validate image element
    if (!imageElement) {
      throw new Error("No image provided for validation");
    }

    if (!imageElement.complete) {
      throw new Error("Image has not finished loading");
    }

    if (imageElement.naturalWidth === 0 || imageElement.naturalHeight === 0) {
      throw new Error("Image failed to load or has invalid dimensions");
    }

    // Check for CORS issues
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = imageElement.naturalWidth;
        canvas.height = imageElement.naturalHeight;
        ctx.drawImage(imageElement, 0, 0);
        // This will throw if there are CORS issues
        canvas.toDataURL();
      }
    } catch {
      console.warn("⚠️ CORS issue detected, but continuing with validation");
      // Don't throw, just log the warning - TensorFlow might still work
    }

    console.log(
      `📐 Image dimensions: ${imageElement.naturalWidth}x${imageElement.naturalHeight}`
    );
    console.log(`🔗 Image source: ${imageElement.src}`);
    console.log(`📄 Image type: ${imageElement.tagName}`);

    // Load model if not already loaded
    console.log("🤖 Loading AI model...");
    const loadedModel = await loadModel();
    console.log("✅ AI model loaded successfully");

    console.log("🧠 Classifying image with AI...");

    // Convert image to tensor and classify
    let predictions;
    try {
      predictions = await loadedModel.classify(imageElement);
      console.log("📊 Raw predictions received:", predictions);

      if (!predictions || predictions.length === 0) {
        throw new Error("No predictions returned from AI model");
      }
    } catch (classifyError) {
      console.error("💥 Classification error:", classifyError);
      const errorMessage =
        classifyError instanceof Error
          ? classifyError.message
          : "Unknown classification error";
      throw new Error(`Image classification failed: ${errorMessage}`);
    }

    console.log("🔮 AI predictions:", predictions);

    // Analyze predictions
    let maxFoodConfidence = 0;
    let hasFood = false;
    const foodPredictions: string[] = [];

    for (const prediction of predictions) {
      if (isFoodRelated(prediction.className)) {
        hasFood = true;
        maxFoodConfidence = Math.max(maxFoodConfidence, prediction.probability);
        foodPredictions.push(
          `${prediction.className} (${(prediction.probability * 100).toFixed(
            1
          )}%)`
        );
      }
    }

    // Consider image valid if:
    // 1. At least one prediction is food-related
    // 2. The confidence is above 0.05 (5%) - lowered threshold for better detection
    const isValid = hasFood && maxFoodConfidence > 0.05;

    const result = {
      isValid,
      confidence: maxFoodConfidence,
      predictions: predictions.map(
        (p: { className: string; probability: number }) => ({
          className: p.className,
          probability: p.probability,
        })
      ),
      reason: isValid
        ? undefined
        : foodPredictions.length > 0
        ? `Low confidence food detection. AI detected: ${foodPredictions.join(
            ", "
          )}`
        : "Image does not appear to contain food or cooking-related items",
    };

    console.log("📊 Validation result:", result);
    return result;
  } catch (error) {
    console.error("💥 Error during image validation:", error);

    let errorMessage = "An error occurred during image validation";

    if (error instanceof Error) {
      if (
        error.message.includes("download") ||
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        errorMessage =
          "Failed to load AI model. Please check your internet connection.";
      } else if (
        error.message.includes("WebGL") ||
        error.message.includes("backend") ||
        error.message.includes("canvas")
      ) {
        errorMessage =
          "Your browser does not support the required features. Please update your browser.";
      } else if (
        error.message.includes("memory") ||
        error.message.includes("quota")
      ) {
        errorMessage =
          "Not enough memory. Please close other browser tabs and try again.";
      } else if (
        error.message.includes("image") ||
        error.message.includes("load")
      ) {
        // Show the actual error for debugging
        errorMessage = `Image processing error: ${error.message}`;
      } else {
        errorMessage = `Validation error: ${error.message}`;
      }
    }

    return {
      isValid: false,
      confidence: 0,
      predictions: [],
      reason: errorMessage,
    };
  }
};

/**
 * Validate image from file input with enhanced error handling
 */
export const validateImageFile = (
  file: File
): Promise<{
  isValid: boolean;
  confidence: number;
  predictions: Array<{ className: string; probability: number }>;
  reason?: string;
}> => {
  return new Promise((resolve) => {
    try {
      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        resolve({
          isValid: false,
          confidence: 0,
          predictions: [],
          reason: "File is not an image",
        });
        return;
      }

      // Check file size (max 10MB for processing)
      if (file.size > 10 * 1024 * 1024) {
        resolve({
          isValid: false,
          confidence: 0,
          predictions: [],
          reason: "Image file is too large (max 10MB)",
        });
        return;
      }

      console.log(
        `📁 Processing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(
          2
        )}MB)`
      );

      // Create image element and load file
      const img = new Image();
      const url = URL.createObjectURL(file);

      // Set up timeout for image loading
      const loadTimeout = setTimeout(() => {
        URL.revokeObjectURL(url);
        console.error("Image loading timeout");
        resolve({
          isValid: false,
          confidence: 0,
          predictions: [],
          reason: "Image loading timeout. Please try a smaller image.",
        });
      }, 30000); // 30 second timeout

      img.onload = async () => {
        clearTimeout(loadTimeout);
        URL.revokeObjectURL(url); // Clean up
        try {
          const result = await validateFoodImage(img);
          resolve(result);
        } catch (error) {
          console.error("Error validating loaded image:", error);
          resolve({
            isValid: false,
            confidence: 0,
            predictions: [],
            reason:
              error instanceof Error
                ? error.message
                : "Failed to validate image",
          });
        }
      };

      img.onerror = () => {
        clearTimeout(loadTimeout);
        URL.revokeObjectURL(url); // Clean up
        console.error("Failed to load image file");
        resolve({
          isValid: false,
          confidence: 0,
          predictions: [],
          reason:
            "Failed to load image file. Please check if the file is a valid image.",
        });
      };

      // Enable CORS for external images
      img.crossOrigin = "anonymous";
      img.src = url;
    } catch (error) {
      console.error("Error in validateImageFile:", error);
      resolve({
        isValid: false,
        confidence: 0,
        predictions: [],
        reason: "Failed to process image file",
      });
    }
  });
};

/**
 * Preload the model for better performance
 */
export const preloadModel = async (): Promise<void> => {
  try {
    console.log("🚀 Preloading AI model...");
    await loadModel();
    console.log("✅ AI model preloaded successfully");
  } catch (error) {
    console.warn("⚠️  Failed to preload AI model:", error);
    // Don't throw error here as preloading is optional
  }
};
