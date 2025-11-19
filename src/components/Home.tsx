import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Pagination,
} from "@mui/material";
import RecipeCard from "./RecipeCard";
import Footer from "./Footer";
import SearchBar from "./SearchBar";
import { useRecipes } from "../hooks/useRecipes";
import { CATEGORIES, type Category } from "../constants/categories";
import { useAuth } from "../hooks/useAuth.tsx";
import { api } from "../services/api";
import type { Recipe } from "../types/Recipe";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("Popular");
  const [favorites, setFavorites] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 12;

  const { recipes, loading, fetchRecipes } = useRecipes();
  const { isAuthenticated } = useAuth();

  // Calculate pagination only for "All" category
  const shouldShowPagination =
    selectedCategory === "All" && recipes.length > recipesPerPage;
  const totalPages = Math.ceil(recipes.length / recipesPerPage);
  const startIndex = (currentPage - 1) * recipesPerPage;
  const endIndex = startIndex + recipesPerPage;
  const displayedRecipes =
    selectedCategory === "All" ? recipes.slice(startIndex, endIndex) : recipes;

  // Handle pagination change
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Load favorites from API on component mount
  useEffect(() => {
    const loadFavorites = async () => {
      if (isAuthenticated) {
        try {
          const favoriteRecipes = await api.getFavorites();
          const favIds = favoriteRecipes.map((recipe) => recipe.id);
          setFavorites(favIds);
        } catch (error) {
          console.error("Error loading favorites:", error);
          setFavorites([]);
        }
      }
    };

    loadFavorites();
  }, [isAuthenticated]);

  // Function to reload favorites from server
  const reloadFavorites = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const favoriteRecipes = await api.getFavorites();
        const favIds = favoriteRecipes.map((recipe) => recipe.id);
        setFavorites(favIds);
      } catch (error) {
        console.error("Error reloading favorites:", error);
      }
    }
  }, [isAuthenticated]);

  const searchRecipes = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      setCurrentPage(1); // Reset to first page when searching
      await fetchRecipes(selectedCategory, query);
    },
    [selectedCategory, fetchRecipes]
  );

  const handleCategoryChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newCategory: Category | null) => {
      if (newCategory) {
        setSelectedCategory(newCategory);
        setSearchQuery("");
      }
    },
    []
  );

  const handleToggleFavorite = useCallback(
    async (recipe: Recipe) => {
      if (!isAuthenticated) {
        alert("Please log in to add recipes to favorites");
        return;
      }

      const recipeId = recipe.id;
      const isCurrentlyFavorite = favorites.includes(recipeId);

      try {
        if (isCurrentlyFavorite) {
          // Call API to remove from database first
          await api.removeFromFavorites(recipe.id);

          // Reload favorites from server to ensure consistency
          await reloadFavorites();
        } else {
          // Call API to add to database first
          await api.addToFavorites(recipe.id);

          // Reload favorites from server to ensure consistency
          await reloadFavorites();
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
        if (axios.isAxiosError(error)) {
          console.error(
            "Axios error details:",
            error.response?.data || error.message
          );
        } else {
          console.error("Error details:", (error as Error).message);
        }
        alert("Error updating favorites. Please try again.");
      }
    },
    [favorites, isAuthenticated, reloadFavorites]
  );

  // Initial load
  useEffect(() => {
    fetchRecipes(selectedCategory, "");
    // Reset pagination when category changes
    setCurrentPage(1);
  }, [selectedCategory, fetchRecipes]);

  // Adjust current page if it's beyond available pages
  useEffect(() => {
    if (
      selectedCategory === "All" &&
      totalPages > 0 &&
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage, selectedCategory]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Find Your Perfect Recipe
        </Typography>
        {selectedCategory === "All" && recipes.length > 0 && !loading && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            Explore all {recipes.length} recipes in our collection
          </Typography>
        )}
        <SearchBar
          onSearch={searchRecipes}
          placeholder="Search recipes by name, ingredients, or tags..."
          initialValue={searchQuery}
        />
      </Box>

      <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
        <ToggleButtonGroup
          value={selectedCategory}
          exclusive
          onChange={handleCategoryChange}
          aria-label="recipe categories"
          sx={{
            flexWrap: "wrap",
            "& .MuiToggleButton-root": {
              m: 0.5,
            },
          }}
        >
          {CATEGORIES.map((category) => (
            <ToggleButton key={category} value={category} aria-label={category}>
              {category}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 3,
              mb: 4,
            }}
          >
            {displayedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isFavorite={favorites.includes(recipe.id)}
                onToggleFavorite={() => handleToggleFavorite(recipe)}
              />
            ))}
          </Box>

          {/* Pagination - only show for "All" category */}
          {shouldShowPagination && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mt: 4,
                mb: 4,
              }}
            >
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
                sx={{
                  "& .MuiPaginationItem-root": {
                    borderRadius: 2,
                    fontWeight: 600,
                    mx: 0.5,
                  },
                  "& .MuiPaginationItem-root.Mui-selected": {
                    bgcolor: "#ff5722",
                    color: "#fff",
                    "&:hover": {
                      bgcolor: "#e64a19",
                    },
                  },
                }}
              />
            </Box>
          )}

          {/* Recipe count info for "All" category */}
          {selectedCategory === "All" && recipes.length > recipesPerPage && (
            <Box
              sx={{
                textAlign: "center",
                mb: 4,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Showing {Math.min(startIndex + 1, recipes.length)} to{" "}
                {Math.min(endIndex, recipes.length)} of {recipes.length} recipes
              </Typography>
            </Box>
          )}

          {displayedRecipes.length === 0 && (
            <Typography variant="h6" textAlign="center" color="text.secondary">
              No recipes found. Try a different search or category.
            </Typography>
          )}
        </>
      )}
      <Footer />
    </Container>
  );
};

export default Home;
