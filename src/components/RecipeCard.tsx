import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  IconButton,
} from "@mui/material";
import { Recipe } from "../types/Recipe";
import {
  Restaurant,
  LocalDining,
  Favorite,
  FavoriteBorder,
} from "@mui/icons-material";

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (recipe: Recipe) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isFavorite,
  onToggleFavorite,
}) => {
  return (
    <Card
      sx={{
        maxWidth: 345,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s",
        "&:hover": {
          transform: "scale(1.02)",
        },
        position: "relative",
      }}
    >
      <IconButton
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.9)",
          },
        }}
        onClick={(e) => {
          e.preventDefault();
          onToggleFavorite(recipe);
        }}
      >
        {isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
      </IconButton>
      <Link
        to={`/recipe/${recipe.id}`}
        style={{ textDecoration: "none", color: "inherit", flex: 1 }}
      >
        <CardMedia
          component="img"
          height="200"
          image={recipe.image_url}
          alt={recipe.name}
          sx={{ objectFit: "cover" }}
        />
        <CardContent sx={{ flex: 1 }}>
          <Typography gutterBottom variant="h6" component="div" noWrap>
            {recipe.name}
          </Typography>

          <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
            <Chip
              size="small"
              label={recipe.cuisine}
              icon={<Restaurant />}
              color="primary"
            />
            <Chip
              size="small"
              label={recipe.category}
              icon={<LocalDining />}
              color="secondary"
            />
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mb: 1,
            }}
          >
            {recipe.ingredients.slice(0, 3).join(", ")}
            {recipe.ingredients.length > 3 ? ", ..." : ""}
          </Typography>

          {recipe.tags.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {recipe.tags.slice(0, 2).map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem" }}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Link>
    </Card>
  );
};

export default RecipeCard;
