import { useState, useEffect } from "react";
import { Container, Typography, Box, CircularProgress } from "@mui/material";
import type { Recipe } from "../types/Recipe";
import RecipeCard from "./RecipeCard";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth.tsx";

const Favorites = () => {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);

        if (!isAuthenticated) {
          setFavoriteRecipes([]);
          setLoading(false);
          return;
        }

        // Fetch user's favorite recipes from API
        const favoriteRecipesList = await api.getFavorites();
        setFavoriteRecipes(favoriteRecipesList);

        // Also update the local favoriteIds for consistency
        const favoriteIdsList = favoriteRecipesList.map((recipe) => recipe.id);
        setFavoriteIds(favoriteIdsList);
      } catch (error) {
        console.error("Error fetching favorites:", error);
        setFavoriteRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [isAuthenticated]);

  const handleRemoveFromFavorites = async (recipe: Recipe) => {
    try {
      // Update local state immediately for better UX
      setFavoriteRecipes((prev) => prev.filter((fav) => fav.id !== recipe.id));
      const recipeId = recipe.id;
      const updatedFavoriteIds = favoriteIds.filter((id) => id !== recipeId);
      setFavoriteIds(updatedFavoriteIds);

      // Call API to remove from database
      await api.removeFromFavorites(recipe.id);
    } catch (error) {
      console.error("Error removing from favorites:", error);
      // Revert the change if API call failed
      setFavoriteRecipes((prev) => [...prev, recipe]);
      setFavoriteIds((prev) => [...prev, recipe.id]);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Your Favorite Recipes
        </Typography>
        <Typography variant="body1" align="center">
          Please log in to view your favorite recipes.
        </Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Your Favorite Recipes
      </Typography>
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      ) : favoriteRecipes.length === 0 ? (
        <Typography variant="body1" align="center">
          You haven't added any recipes to your favorites yet.
        </Typography>
      ) : (
        <Box sx={{ flexGrow: 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {favoriteRecipes.map((recipe) => (
              <div key={recipe.id}>
                <RecipeCard
                  recipe={recipe}
                  isFavorite={true}
                  onToggleFavorite={() => handleRemoveFromFavorites(recipe)}
                />
              </div>
            ))}
          </div>
        </Box>
      )}
    </Container>
  );
};

export default Favorites;
