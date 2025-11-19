import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Paper,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  CircularProgress,
} from "@mui/material";
import { Recipe } from "../types/Recipe";
import { YouTube, Language } from "@mui/icons-material";
import { api } from "../services/api";
import RecipeRecommendations from "./RecipeRecommendations";

const RecipeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRecipeDetails = async () => {
      if (!id) {
        setError("Recipe ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const recipeData = await api.getRecipeById(id);

        if (!isMounted) return;

        setRecipe(recipeData);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "An error occurred");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRecipeDetails();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Container>
    );
  }

  if (!recipe) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="h6">Recipe not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
          }}
        >
          {/* Image Section */}
          <Box sx={{ flex: 1, maxWidth: { xs: "100%", md: "50%" } }}>
            <Box
              sx={{
                width: "100%",
                height: "300px",
                position: "relative",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              }}
            >
              <img
                src={recipe.image_url}
                alt={recipe.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "8px",
                  display: "block",
                }}
              />
            </Box>
            <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {recipe.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>

          {/* Details Section */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {recipe.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {recipe.cuisine} • {recipe.category}
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ingredients
              </Typography>
              <List>
                {recipe.ingredients.map((ingredient, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemText primary={ingredient} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        </Box>

        {/* Instructions Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Instructions
          </Typography>
          <List>
            {recipe.instructions.map((step, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={`Step ${index + 1}`}
                    secondary={step}
                  />
                </ListItem>
                {index < recipe.instructions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>

        {/* External Links */}
        <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
          {recipe.youtube && (
            <Button
              variant="contained"
              color="error"
              startIcon={<YouTube />}
              href={recipe.youtube}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch Video
            </Button>
          )}
          {recipe.source && (
            <Button
              variant="outlined"
              startIcon={<Language />}
              href={recipe.source}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Source
            </Button>
          )}
        </Box>
      </Paper>

      {/* Recipe Recommendations */}
      <RecipeRecommendations currentRecipe={recipe} />
    </Container>
  );
};

export default RecipeDetails;
