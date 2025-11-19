import { api } from "../services/api";

// Static categories that are always available
export const STATIC_CATEGORIES = ["Popular", "All"] as const;

// Combined type for all categories
export type Category = (typeof STATIC_CATEGORIES)[number] | string;

// Function to get all categories (static + dynamic)
export const getCategories = async (): Promise<Category[]> => {
  try {
    // Fetch dynamic categories from API
    const apiCategories = await api.getCategories();

    // Combine static and dynamic categories
    return [...STATIC_CATEGORIES, ...apiCategories];
  } catch (error) {
    console.error("Error fetching categories:", error);
    // Return fallback categories if API fails
    return [
      ...STATIC_CATEGORIES,
      "Main Course",
      "Breakfast",
      "Snack",
      "Dessert",
      "Vegetarian",
      "Chicken",
      "Fast Food",
      "Salad",
    ];
  }
};

// Function to get cuisines from API
export const getCuisines = async (): Promise<string[]> => {
  try {
    return await api.getCuisines();
  } catch (error) {
    console.error("Error fetching cuisines:", error);
    return ["Nepali", "Indian", "American", "Italian", "Chinese"];
  }
};

// Export static categories for immediate use
export const CATEGORIES = [
  "Popular",
  "All",
  "Main Course",
  "Breakfast",
  "Snack",
  "Dessert",
  "Vegetarian",
  "Chicken",
  "Fast Food",
  "Salad",
] as const;
