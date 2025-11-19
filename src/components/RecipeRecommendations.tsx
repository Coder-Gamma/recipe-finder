import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Recipe } from "../types/Recipe";
import { RecommendationScore } from "../utils/recommendationEngine";
import { api } from "../services/api";

interface RecipeRecommendationsProps {
  currentRecipe: Recipe;
}

const RecipeRecommendations: React.FC<RecipeRecommendationsProps> = ({
  currentRecipe,
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the server-side recommendation API for better performance
        const response = await api.getRecipeRecommendations(
          currentRecipe.id,
          6
        );
        setRecommendations(response.recommendations);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load recommendations"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentRecipe]);

  const handleViewRecipe = (recipeId: string) => {
    navigate(`/recipe/${recipeId}`);
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Finding similar recipes...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No similar recipes found at the moment.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        You Might Also Like
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Recipes similar to {currentRecipe.name}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 3,
        }}
      >
        {recommendations.map((recommendation) => (
          <Card
            key={recommendation.recipe.id}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              transition:
                "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 4,
              },
            }}
          >
            <CardMedia
              component="img"
              height="200"
              image={recommendation.recipe.image_url}
              alt={recommendation.recipe.name}
              sx={{ objectFit: "cover" }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                {recommendation.recipe.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {recommendation.recipe.cuisine} •{" "}
                {recommendation.recipe.category}
              </Typography>

              {/* Show recommendation reasons */}
              <Box sx={{ mt: 1, mb: 2 }}>
                {recommendation.reasons.slice(0, 2).map((reason, index) => (
                  <Chip
                    key={index}
                    label={reason}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ mr: 0.5, mb: 0.5, fontSize: "0.75rem" }}
                  />
                ))}
              </Box>

              {/* Similarity score for debugging (you can remove this in production) */}
              <Typography variant="caption" color="text.secondary">
                Match: {Math.round(recommendation.score * 100)}%
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                variant="outlined"
                fullWidth
                onClick={() => handleViewRecipe(recommendation.recipe.id)}
              >
                View Recipe
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default RecipeRecommendations;
