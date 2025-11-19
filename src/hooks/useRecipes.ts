import { useState, useCallback } from "react";
import type { Recipe } from "../types/Recipe";
import type { Category } from "../constants/categories";
import { api } from "../services/api";

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecipes = useCallback(async (category: Category, query = "") => {
    try {
      setLoading(true);
      setError(null);

      let recipes: Recipe[] = [];

      if (query.trim()) {
        // Use server-side search functionality
        recipes = await api.getRecipes({ search: query.trim() });
      } else if (category === "Popular") {
        // Get all recipes and show 9 random ones for variety
        const allRecipes = await api.getRecipes();
        const shuffled = [...allRecipes].sort(() => 0.5 - Math.random());
        recipes = shuffled.slice(0, 9);
      } else if (category === "All") {
        // Get all recipes
        recipes = await api.getRecipes();
      } else {
        // Filter by category using server-side filtering
        recipes = await api.getRecipes({ category });
      }

      setRecipes(recipes);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch recipes")
      );
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since api is imported and stable

  return {
    recipes,
    loading,
    error,
    fetchRecipes,
  };
}
