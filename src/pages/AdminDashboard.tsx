import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Tooltip,
  Avatar,
  Divider,
  CssBaseline,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CardMedia,
  Pagination,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Dashboard as DashboardIcon,
  RestaurantMenu as RecipeIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  CloudUpload as UploadIcon,
} from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth.tsx";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import type { Recipe } from "../types/Recipe";
import { useImageValidation } from "../hooks/useImageValidation";
import {
  validateRecipeContent,
  getProfanityErrorMessage,
  checkForProfanity,
} from "../utils/profanityFilter";
import ImageValidationHelp from "../components/ImageValidationHelp";

const drawerWidth = 220;

// Component interfaces
interface FormData {
  name: string;
  ingredients: string;
  instructions: string;
  cuisine: string;
  category: string;
  image_url: string;
  youtube: string;
  source: string;
  tags: string;
}

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Image validation hook (only need validateImage and preloadModel)
  const { validateImage, preloadModel } = useImageValidation();

  // State for recipes
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 9;

  // Calculate pagination
  const totalPages = Math.ceil(recipes.length / recipesPerPage);
  const startIndex = (currentPage - 1) * recipesPerPage;
  const endIndex = startIndex + recipesPerPage;
  const currentRecipes = recipes.slice(startIndex, endIndex);

  // Adjust current page if it's beyond available pages
  React.useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Handle pagination change
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
  };

  // Navigation state - simplified to only dashboard
  const [currentView, setCurrentView] = useState<"dashboard">("dashboard");

  // State for dialog - this will be our single edit/create interface
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // State for form
  const [formData, setFormData] = useState<FormData>({
    name: "",
    ingredients: "",
    instructions: "",
    cuisine: "",
    category: "",
    image_url: "",
    youtube: "",
    source: "",
    tags: "",
  });

  // State for image upload
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Available options
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Image validation state
  const [imageValidationStatus, setImageValidationStatus] = useState<{
    hasImage: boolean;
    isValid: boolean;
    isValidating: boolean;
    error?: string;
  }>({
    hasImage: false,
    isValid: false,
    isValidating: false,
  });

  // Real-time validation function
  const validateField = (fieldName: string, value: string) => {
    const profanityCheck = checkForProfanity(value);
    if (!profanityCheck.isClean) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: "Inappropriate language detected",
      }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Check if user is authenticated and has admin role
  React.useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      // Only redirect to admin login if not in the process of logging out
      if (!isLoggingOut) {
        navigate("/admin/login");
      }
    }
  }, [isAuthenticated, user, navigate, isLoggingOut]);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      loadRecipes();
      loadMetadata();
    }
  }, [isAuthenticated, user]);

  // Preload AI model for image validation
  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      console.log("🔄 AdminDashboard: Preloading AI validation model...");
      preloadModel()
        .then(() => {
          console.log("✅ AdminDashboard: AI validation model preloaded");
        })
        .catch((error) => {
          console.error(
            "⚠️ AdminDashboard: Failed to preload AI model:",
            error
          );
        });
    }
  }, [isAuthenticated, user, preloadModel]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const recipesData = await api.getRecipes();
      setRecipes(recipesData);
      // Reset to first page when recipes are reloaded
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load recipes:", err);
      setError("Failed to load recipes");
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [cuisinesData, categoriesData] = await Promise.all([
        api.getCuisines(),
        api.getCategories(),
      ]);
      setCuisines(cuisinesData);
      setCategories(categoriesData);
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  };

  const handleOpenDialog = (
    mode: "create" | "edit" | "view",
    recipe?: Recipe
  ) => {
    setDialogMode(mode);
    setSelectedRecipe(recipe || null);

    if (recipe) {
      setFormData({
        name: recipe.name,
        ingredients: Array.isArray(recipe.ingredients)
          ? recipe.ingredients.join("\n")
          : recipe.ingredients,
        instructions: Array.isArray(recipe.instructions)
          ? recipe.instructions.join("\n")
          : recipe.instructions,
        cuisine: recipe.cuisine,
        category: recipe.category,
        image_url: recipe.image_url,
        youtube: recipe.youtube || "",
        source: recipe.source || "",
        tags: Array.isArray(recipe.tags) ? recipe.tags.join(", ") : recipe.tags,
      });
      // Set image preview if editing existing recipe
      if (recipe.image_url) {
        setImagePreview(recipe.image_url);
      }
    } else {
      setFormData({
        name: "",
        ingredients: "",
        instructions: "",
        cuisine: "",
        category: "",
        image_url: "",
        youtube: "",
        source: "",
        tags: "",
      });
      setImagePreview("");
      setSelectedImage(null);
    }

    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    // Clean up object URL to prevent memory leaks
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setDialogOpen(false);
    setSelectedRecipe(null);
    // Reset image states
    setSelectedImage(null);
    setImagePreview("");
    // Reset form data
    setFormData({
      name: "",
      ingredients: "",
      instructions: "",
      cuisine: "",
      category: "",
      image_url: "",
      youtube: "",
      source: "",
      tags: "",
    });
    // Clear validation errors
    setValidationErrors({});
  };

  const handleSaveRecipe = async () => {
    try {
      // Check image validation status before proceeding
      if (imageValidationStatus.hasImage) {
        if (!imageValidationStatus.isValid) {
          setError(
            imageValidationStatus.error ||
              "Please upload a valid food image before saving the recipe."
          );
          return;
        }

        if (imageValidationStatus.isValidating) {
          setError(
            "Please wait for image validation to complete before saving."
          );
          return;
        }
      }

      // Check if recipe requires an image (you can modify this logic as needed)
      if (!formData.image_url.trim()) {
        setError("Please upload an image for the recipe.");
        return;
      }

      setLoading(true);

      const recipeData: Recipe = {
        id:
          dialogMode === "create" ? `recipe_${Date.now()}` : selectedRecipe!.id,
        name: formData.name,
        ingredients: formData.ingredients.split("\n").filter((i) => i.trim()),
        instructions: formData.instructions.split("\n").filter((i) => i.trim()),
        cuisine: formData.cuisine,
        category: formData.category,
        image_url: formData.image_url,
        youtube: formData.youtube || undefined,
        source: formData.source || undefined,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
      };

      // Validate recipe content for profanity
      const profanityCheck = validateRecipeContent({
        name: recipeData.name,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        tags: recipeData.tags,
        source: recipeData.source,
      });

      if (!profanityCheck.isClean) {
        const errorMessage = getProfanityErrorMessage(
          profanityCheck.detectedWords
        );
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (dialogMode === "create") {
        await api.createRecipe(recipeData);
        setSuccess("Recipe created successfully!");
      } else if (dialogMode === "edit" && selectedRecipe) {
        await api.updateRecipe(selectedRecipe.id, recipeData);
        setSuccess("Recipe updated successfully!");
      }

      handleCloseDialog();
      loadRecipes();
    } catch (err) {
      console.error("Failed to save recipe:", err);
      setError("Failed to save recipe");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      try {
        setLoading(true);
        await api.deleteRecipe(id);
        setSuccess("Recipe deleted successfully!");
        loadRecipes();
      } catch (err) {
        console.error("Failed to delete recipe:", err);
        setError("Failed to delete recipe");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    logout();
    navigate("/");
  };

  // Image handling functions
  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      setSelectedImage(file);

      // Update image validation status - start validation
      setImageValidationStatus({
        hasImage: true,
        isValid: false,
        isValidating: true,
      });

      // Create object URL for immediate preview
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);

      try {
        setLoading(true);
        setLoadingMessage("Validating image with AI...");
        console.log(
          "🔍 AdminDashboard: Starting image validation for:",
          file.name,
          file.size,
          file.type
        );

        // First, validate the image using AI
        console.log("🔍 AdminDashboard: Validating image with AI...");
        const validationResult = await validateImage(file);
        console.log("🔍 AdminDashboard: Validation result:", validationResult);

        if (!validationResult.isValid) {
          console.log(
            "❌ AdminDashboard: Image validation failed:",
            validationResult.reason
          );
          const errorMessage = `Image validation failed: ${
            validationResult.reason ||
            "Image does not appear to contain food or cooking-related content."
          }`;

          setError(errorMessage);
          setImageValidationStatus({
            hasImage: true,
            isValid: false,
            isValidating: false,
            error: errorMessage,
          });

          setLoading(false);
          setLoadingMessage("");
          return;
        }

        console.log(
          "✅ AdminDashboard: Image validation passed, proceeding with upload..."
        );
        setLoadingMessage("Uploading image...");
        console.log("🔄 AdminDashboard: Uploading image to server...");

        // If validation passes, upload image to server
        const response = await api.uploadImage(file);
        console.log("✅ AdminDashboard: Upload response:", response);

        const imageUrl = `http://localhost:3001${response.imageUrl}`;
        console.log("✅ AdminDashboard: Final image URL:", imageUrl);

        setFormData({ ...formData, image_url: imageUrl });
        setImageValidationStatus({
          hasImage: true,
          isValid: true,
          isValidating: false,
        });
        setSuccess(
          `Image uploaded and validated successfully! AI detected: ${validationResult.predictions
            .slice(0, 2)
            .map((p) => `${p.className} (${(p.probability * 100).toFixed(1)}%)`)
            .join(", ")}`
        );
      } catch (error: unknown) {
        console.error(
          "❌ AdminDashboard: Failed to validate/upload image:",
          error
        );

        // More detailed error handling
        let errorMessage = "Failed to upload image. Please try again.";
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as {
            response?: { data?: { error?: string } };
          };
          if (axiosError.response?.data?.error) {
            errorMessage = axiosError.response.data.error;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        setError(errorMessage);
        setImageValidationStatus({
          hasImage: true,
          isValid: false,
          isValidating: false,
          error: errorMessage,
        });

        // Clean up on error
        URL.revokeObjectURL(objectUrl);
        setImagePreview("");
        setSelectedImage(null);
      } finally {
        setLoading(false);
        setLoadingMessage("");
      }
    }

    // Reset the input value to allow selecting the same file again
    event.target.value = "";
  };

  const handleRemoveImage = () => {
    // Clean up object URL to prevent memory leaks
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    console.log("Removing image:", selectedImage?.name || "none");
    setSelectedImage(null);
    setImagePreview("");
    setFormData({ ...formData, image_url: "" });
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  // Sidebar navigation items
  const navItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      view: "dashboard" as const,
      onClick: () => setCurrentView("dashboard"),
    },
    {
      text: "Users",
      icon: <UsersIcon />,
      view: "users" as const,
      onClick: () => {}, // Placeholder for future functionality
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      view: "settings" as const,
      onClick: () => {}, // Placeholder for future functionality
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
      }}
    >
      <CssBaseline />
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#1e293b",
            borderRight: 0,
            pt: 2,
            background: "linear-gradient(180deg, #1e293b 0%, #334155 100%)",
            color: "#fff",
            overflowX: "hidden",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            mb: 3,
            py: 2,
            borderRadius: 2,
            mx: 1,
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Avatar
            sx={{
              bgcolor: "linear-gradient(45deg, #3b82f6, #8b5cf6)",
              mr: 2,
              width: 40,
              height: 40,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            {user?.name?.[0]}
          </Avatar>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: "#fff" }}
            >
              {user?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              Administrator
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.12)" }} />
        <List sx={{ px: 1, overflow: "hidden" }}>
          {navItems.map((item) => (
            <ListItem
              key={item.text}
              onClick={item.onClick}
              sx={{
                borderRadius: 2,
                mb: 1,
                cursor: "pointer",
                mx: 1,
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                },
                ...(currentView === item.view && {
                  bgcolor: "rgba(59, 130, 246, 0.3)",
                  borderLeft: "3px solid #3b82f6",
                }),
              }}
            >
              <ListItemIcon sx={{ color: "#e2e8f0", minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  "& .MuiTypography-root": {
                    color: "#f1f5f9",
                    fontWeight: currentView === item.view ? 600 : 400,
                  },
                }}
              />
            </ListItem>
          ))}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.12)" }} />
        <List sx={{ px: 1, pb: 2, overflow: "hidden" }}>
          <ListItem
            sx={{
              borderRadius: 2,
              mt: 1,
              cursor: "pointer",
              mx: 1,
              transition: "all 0.3s ease",
              "&:hover": {
                bgcolor: "rgba(239, 68, 68, 0.2)",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
              },
            }}
            onClick={handleLogout}
          >
            <ListItemIcon sx={{ color: "#ef4444", minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              sx={{
                "& .MuiTypography-root": {
                  color: "#ef4444",
                  fontWeight: 500,
                },
              }}
            />
          </ListItem>
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          minHeight: "100vh",
        }}
      >
        {/* Header Bar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(0,0,0,0.05)",
            color: "#1e293b",
          }}
        >
          <Toolbar sx={{ py: 1 }}>
            <Typography
              variant="h4"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                background: "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Admin Dashboard
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Conditional Content Based on Current View */}
          {currentView === "dashboard" && (
            <>
              {/* Statistics Cards */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 3,
                  mb: 4,
                }}
              >
                <Card
                  sx={{
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                    color: "#fff",
                    boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)",
                    borderRadius: 3,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 15px 40px rgba(59, 130, 246, 0.4)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box
                        sx={{
                          bgcolor: "rgba(255, 255, 255, 0.2)",
                          borderRadius: 2,
                          p: 1.5,
                          mr: 2,
                        }}
                      >
                        <RecipeIcon sx={{ fontSize: 32 }} />
                      </Box>
                      <Box>
                        <Typography
                          variant="h3"
                          sx={{ fontWeight: 700, mb: 0.5 }}
                        >
                          {recipes.length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Total Recipes
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
                    color: "#fff",
                    boxShadow: "0 10px 30px rgba(99, 102, 241, 0.3)",
                    borderRadius: 3,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 15px 40px rgba(99, 102, 241, 0.4)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box
                        sx={{
                          bgcolor: "rgba(255, 255, 255, 0.2)",
                          borderRadius: 2,
                          p: 1.5,
                          mr: 2,
                        }}
                      >
                        <DashboardIcon sx={{ fontSize: 32 }} />
                      </Box>
                      <Box>
                        <Typography
                          variant="h3"
                          sx={{ fontWeight: 700, mb: 0.5 }}
                        >
                          {cuisines.length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Cuisines Available
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    background:
                      "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    color: "#fff",
                    boxShadow: "0 10px 30px rgba(139, 92, 246, 0.3)",
                    borderRadius: 3,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 15px 40px rgba(139, 92, 246, 0.4)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box
                        sx={{
                          bgcolor: "rgba(255, 255, 255, 0.2)",
                          borderRadius: 2,
                          p: 1.5,
                          mr: 2,
                        }}
                      >
                        <SettingsIcon sx={{ fontSize: 32 }} />
                      </Box>
                      <Box>
                        <Typography
                          variant="h3"
                          sx={{ fontWeight: 700, mb: 0.5 }}
                        >
                          {categories.length}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Categories
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* Recipes Table */}
              <Paper
                sx={{
                  width: "100%",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  borderRadius: 4,
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <Box
                  sx={{
                    p: 3,
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    color: "#fff",
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    📚 Recipe Management
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    Manage and organize all your recipes ({recipes.length}{" "}
                    total)
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenDialog("create")}
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.2)",
                        "&:hover": {
                          bgcolor: "rgba(255, 255, 255, 0.3)",
                        },
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      Add New Recipe
                    </Button>
                  </Box>
                </Box>
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            bgcolor: "#f8fafc",
                            fontWeight: 600,
                            borderBottom: "2px solid #e2e8f0",
                          }}
                        >
                          Image
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: "#f8fafc",
                            fontWeight: 600,
                            borderBottom: "2px solid #e2e8f0",
                          }}
                        >
                          Name
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: "#f8fafc",
                            fontWeight: 600,
                            borderBottom: "2px solid #e2e8f0",
                          }}
                        >
                          Cuisine
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: "#f8fafc",
                            fontWeight: 600,
                            borderBottom: "2px solid #e2e8f0",
                          }}
                        >
                          Category
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: "#f8fafc",
                            fontWeight: 600,
                            borderBottom: "2px solid #e2e8f0",
                          }}
                        >
                          Tags
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            bgcolor: "#f8fafc",
                            fontWeight: 600,
                            borderBottom: "2px solid #e2e8f0",
                          }}
                        >
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentRecipes.map((recipe) => (
                        <TableRow
                          key={recipe.id}
                          hover
                          sx={{
                            transition: "all 0.3s ease",
                            "&:hover": {
                              bgcolor: "rgba(59, 130, 246, 0.05)",
                              transform: "scale(1.01)",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            },
                          }}
                        >
                          <TableCell>
                            <Avatar
                              src={recipe.image_url}
                              alt={recipe.name}
                              variant="rounded"
                              sx={{
                                width: 60,
                                height: 45,
                                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                                border: "2px solid #fff",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 600, color: "#1e293b" }}
                            >
                              {recipe.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={recipe.cuisine}
                              size="small"
                              sx={{
                                background:
                                  "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                                color: "#fff",
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={recipe.category}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: "#3b82f6",
                                color: "#3b82f6",
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 0.5,
                                flexWrap: "wrap",
                              }}
                            >
                              {recipe.tags.slice(0, 2).map((tag, index) => (
                                <Chip
                                  key={index}
                                  label={tag}
                                  size="small"
                                  sx={{
                                    bgcolor: "#f1f5f9",
                                    color: "#475569",
                                    fontSize: "0.75rem",
                                  }}
                                />
                              ))}
                              {recipe.tags.length > 2 && (
                                <Chip
                                  label={`+${recipe.tags.length - 2}`}
                                  size="small"
                                  sx={{
                                    bgcolor: "#e2e8f0",
                                    color: "#64748b",
                                    fontSize: "0.75rem",
                                  }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: "flex",
                                gap: 0.5,
                                justifyContent: "center",
                              }}
                            >
                              <Tooltip title="View Recipe">
                                <IconButton
                                  onClick={() =>
                                    handleOpenDialog("view", recipe)
                                  }
                                  size="small"
                                  sx={{
                                    bgcolor: "#3b82f6",
                                    color: "#fff",
                                    "&:hover": {
                                      bgcolor: "#2563eb",
                                      transform: "scale(1.1)",
                                    },
                                    transition: "all 0.2s ease",
                                  }}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Recipe">
                                <IconButton
                                  onClick={() =>
                                    handleOpenDialog("edit", recipe)
                                  }
                                  size="small"
                                  sx={{
                                    bgcolor: "#6366f1",
                                    color: "#fff",
                                    "&:hover": {
                                      bgcolor: "#4338ca",
                                      transform: "scale(1.1)",
                                    },
                                    transition: "all 0.2s ease",
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Recipe">
                                <IconButton
                                  onClick={() => handleDeleteRecipe(recipe.id)}
                                  size="small"
                                  sx={{
                                    bgcolor: "#ef4444",
                                    color: "#fff",
                                    "&:hover": {
                                      bgcolor: "#dc2626",
                                      transform: "scale(1.1)",
                                    },
                                    transition: "all 0.2s ease",
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                      {loading && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                            <Box sx={{ textAlign: "center" }}>
                              <Typography
                                variant="h6"
                                sx={{ color: "#3b82f6", mb: 1 }}
                              >
                                Loading recipes...
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {loadingMessage || "Please wait"}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                      {recipes.length === 0 && !loading && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                            <Box sx={{ textAlign: "center" }}>
                              <RecipeIcon
                                sx={{ fontSize: 64, color: "#cbd5e1", mb: 2 }}
                              />
                              <Typography
                                variant="h6"
                                sx={{ color: "#64748b", mb: 1 }}
                              >
                                No recipes found ({recipes.length} recipes
                                loaded)
                              </Typography>
                              {error && (
                                <Typography
                                  variant="body2"
                                  color="error"
                                  sx={{ mt: 1 }}
                                >
                                  Error: {error}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      mt: 4,
                      mb: 2,
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
                          bgcolor: "#3b82f6",
                          color: "#fff",
                          "&:hover": {
                            bgcolor: "#2563eb",
                          },
                        },
                      }}
                    />
                  </Box>
                )}

                {/* Recipe count info */}
                <Box
                  sx={{
                    textAlign: "center",
                    mt: 2,
                    mb: 4,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Showing {Math.min(startIndex + 1, recipes.length)} to{" "}
                    {Math.min(endIndex, recipes.length)} of {recipes.length}{" "}
                    recipes
                  </Typography>
                </Box>
              </Paper>
            </>
          )}

          {/* Recipe Dialog - Single unified interface for create/edit/view */}
          <Dialog
            open={dialogOpen}
            onClose={handleCloseDialog}
            maxWidth="lg"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 4,
                boxShadow: "0 24px 48px rgba(0, 0, 0, 0.2)",
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                minHeight: "80vh",
                maxHeight: "90vh",
              },
            }}
          >
            <DialogTitle
              sx={{
                fontWeight: 700,
                fontSize: "1.75rem",
                background:
                  dialogMode === "create"
                    ? "linear-gradient(45deg, #059669, #10b981)"
                    : dialogMode === "edit"
                    ? "linear-gradient(45deg, #0ea5e9, #3b82f6)"
                    : "linear-gradient(45deg, #8b5cf6, #a855f7)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textAlign: "center",
                py: 3,
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              {dialogMode === "create" && "🍳 Add New Recipe"}
              {dialogMode === "edit" && "✏️ Edit Recipe"}
              {dialogMode === "view" && "👀 View Recipe"}
            </DialogTitle>

            <DialogContent sx={{ p: 4 }}>
              {(dialogMode === "create" || dialogMode === "edit") && (
                <ImageValidationHelp />
              )}

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  mt: 2,
                }}
              >
                {/* Recipe Basic Info Section */}
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background:
                      "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                    border: "1px solid #bae6fd",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 3, color: "#0c4a6e", fontWeight: 600 }}
                  >
                    📝 Basic Information
                  </Typography>

                  <TextField
                    label="Recipe Name"
                    value={formData.name}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setFormData({ ...formData, name: newValue });
                      validateField("name", newValue);
                    }}
                    fullWidth
                    disabled={dialogMode === "view"}
                    required
                    error={!!validationErrors.name}
                    helperText={validationErrors.name || ""}
                    sx={{
                      mb: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: "#ffffff",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        "&:hover": {
                          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        },
                      },
                    }}
                  />

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 3,
                    }}
                  >
                    <FormControl fullWidth>
                      <InputLabel>Cuisine Type</InputLabel>
                      <Select
                        value={formData.cuisine}
                        onChange={(e) =>
                          setFormData({ ...formData, cuisine: e.target.value })
                        }
                        disabled={dialogMode === "view"}
                        required
                        sx={{
                          borderRadius: 2,
                          bgcolor: "#ffffff",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          "&:hover": {
                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                          },
                        }}
                      >
                        {cuisines.map((cuisine) => (
                          <MenuItem key={cuisine} value={cuisine}>
                            {cuisine}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        disabled={dialogMode === "view"}
                        required
                        sx={{
                          borderRadius: 2,
                          bgcolor: "#ffffff",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          "&:hover": {
                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                          },
                        }}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                {/* Recipe Details Section */}
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background:
                      "linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)",
                    border: "1px solid #fde047",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 3, color: "#92400e", fontWeight: 600 }}
                  >
                    📋 Recipe Details
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 3,
                    }}
                  >
                    <TextField
                      label="🥄 Ingredients (one per line)"
                      value={formData.ingredients}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setFormData({
                          ...formData,
                          ingredients: newValue,
                        });
                        validateField("ingredients", newValue);
                      }}
                      multiline
                      rows={8}
                      fullWidth
                      disabled={dialogMode === "view"}
                      required
                      error={!!validationErrors.ingredients}
                      helperText={validationErrors.ingredients || ""}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "#ffffff",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          "&:hover": {
                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                          },
                        },
                      }}
                      placeholder="• 2 cups flour&#10;• 1 cup sugar&#10;• 3 eggs&#10;• 1 tsp vanilla"
                    />

                    <TextField
                      label="👨‍🍳 Instructions (one per line)"
                      value={formData.instructions}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setFormData({
                          ...formData,
                          instructions: newValue,
                        });
                        validateField("instructions", newValue);
                      }}
                      multiline
                      rows={8}
                      fullWidth
                      disabled={dialogMode === "view"}
                      required
                      error={!!validationErrors.instructions}
                      helperText={validationErrors.instructions || ""}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "#ffffff",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          "&:hover": {
                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                          },
                        },
                      }}
                      placeholder="1. Preheat oven to 350°F&#10;2. Mix dry ingredients&#10;3. Add wet ingredients&#10;4. Bake for 25 minutes"
                    />
                  </Box>
                </Box>

                {/* Media & Links Section */}
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background:
                      "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
                    border: "1px solid #c084fc",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 3, color: "#6b21a8", fontWeight: 600 }}
                  >
                    🖼️ Media & Links
                  </Typography>

                  {/* Image Upload Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="body1"
                      sx={{ mb: 2, fontWeight: 600, color: "#6b21a8" }}
                    >
                      📸 Recipe Image
                    </Typography>

                    {/* Image Preview */}
                    {(imagePreview || formData.image_url) && (
                      <Box sx={{ mb: 2, position: "relative" }}>
                        <Card
                          sx={{
                            maxWidth: 300,
                            mx: "auto",
                            borderRadius: 3,
                            overflow: "hidden",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          }}
                        >
                          <CardMedia
                            component="img"
                            height="200"
                            image={imagePreview || formData.image_url}
                            alt="Recipe preview"
                            sx={{ objectFit: "cover" }}
                          />
                          {dialogMode !== "view" && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                bgcolor: "rgba(0,0,0,0.7)",
                                borderRadius: "50%",
                                p: 1,
                              }}
                            >
                              <IconButton
                                onClick={handleRemoveImage}
                                size="small"
                                sx={{ color: "#fff" }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Card>
                      </Box>
                    )}

                    {/* Upload Button */}
                    {dialogMode !== "view" && (
                      <Box sx={{ textAlign: "center" }}>
                        <input
                          accept="image/*"
                          style={{ display: "none" }}
                          id="image-upload"
                          type="file"
                          onChange={handleImageSelect}
                        />
                        <label htmlFor="image-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<UploadIcon />}
                            sx={{
                              borderRadius: 2,
                              px: 4,
                              py: 1.5,
                              borderColor: "#6b21a8",
                              color: "#6b21a8",
                              "&:hover": {
                                borderColor: "#553c9a",
                                bgcolor: "rgba(107, 33, 168, 0.04)",
                              },
                            }}
                          >
                            {imagePreview || formData.image_url
                              ? "Change Image"
                              : "Upload Image"}
                          </Button>
                        </label>
                      </Box>
                    )}

                    {/* Fallback URL Input */}
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748b", mb: 1, display: "block" }}
                      >
                        Or enter image URL:
                      </Typography>
                      <TextField
                        label="Image URL (optional)"
                        value={formData.image_url}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            image_url: e.target.value,
                          })
                        }
                        fullWidth
                        disabled={dialogMode === "view"}
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            bgcolor: "#ffffff",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                            "&:hover": {
                              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                            },
                          },
                        }}
                        placeholder="https://example.com/recipe-image.jpg"
                      />
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 3,
                    }}
                  >
                    <TextField
                      label="📺 YouTube URL (optional)"
                      value={formData.youtube}
                      onChange={(e) =>
                        setFormData({ ...formData, youtube: e.target.value })
                      }
                      fullWidth
                      disabled={dialogMode === "view"}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "#ffffff",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          "&:hover": {
                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                          },
                        },
                      }}
                      placeholder="https://youtube.com/watch?v=..."
                    />

                    <TextField
                      label="📖 Source (optional)"
                      value={formData.source}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setFormData({ ...formData, source: newValue });
                        validateField("source", newValue);
                      }}
                      fullWidth
                      disabled={dialogMode === "view"}
                      error={!!validationErrors.source}
                      helperText={validationErrors.source || ""}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          bgcolor: "#ffffff",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          "&:hover": {
                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                          },
                        },
                      }}
                      placeholder="Food Network, Grandma's Recipe, etc."
                    />
                  </Box>
                </Box>

                {/* Tags Section */}
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background:
                      "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                    border: "1px solid #6ee7b7",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 3, color: "#065f46", fontWeight: 600 }}
                  >
                    🏷️ Tags & Labels
                  </Typography>

                  <TextField
                    label="Tags (comma separated)"
                    value={formData.tags}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setFormData({ ...formData, tags: newValue });
                      validateField("tags", newValue);
                    }}
                    fullWidth
                    disabled={dialogMode === "view"}
                    error={!!validationErrors.tags}
                    helperText={validationErrors.tags || ""}
                    placeholder="vegetarian, quick, healthy, family-friendly, gluten-free"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: "#ffffff",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        "&:hover": {
                          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        },
                      },
                    }}
                  />
                </Box>
              </Box>
            </DialogContent>

            {/* Validation Status Helper */}
            {dialogMode !== "view" &&
              (imageValidationStatus.isValidating ||
                (imageValidationStatus.hasImage &&
                  !imageValidationStatus.isValid)) && (
                <Box sx={{ px: 3, pb: 2 }}>
                  <Typography
                    variant="body2"
                    color={
                      imageValidationStatus.isValidating
                        ? "text.secondary"
                        : "error"
                    }
                    sx={{
                      fontSize: "0.875rem",
                      fontStyle: "italic",
                      textAlign: "center",
                    }}
                  >
                    {imageValidationStatus.isValidating
                      ? "🤖 Validating image... Please wait."
                      : imageValidationStatus.error ||
                        "❌ Invalid image detected. Please upload a food/ingredient image."}
                  </Typography>
                </Box>
              )}

            <DialogActions
              sx={{
                p: 4,
                borderTop: "1px solid #e2e8f0",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                gap: 2,
              }}
            >
              <Button
                onClick={handleCloseDialog}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  borderColor: "#94a3b8",
                  color: "#475569",
                  "&:hover": {
                    borderColor: "#64748b",
                    bgcolor: "#f8fafc",
                  },
                }}
              >
                {dialogMode === "view" ? "Close" : "Cancel"}
              </Button>
              {dialogMode !== "view" && (
                <Button
                  onClick={handleSaveRecipe}
                  variant="contained"
                  disabled={
                    loading ||
                    Object.keys(validationErrors).length > 0 ||
                    imageValidationStatus.isValidating ||
                    (imageValidationStatus.hasImage &&
                      !imageValidationStatus.isValid)
                  }
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    background:
                      dialogMode === "create"
                        ? "linear-gradient(45deg, #059669, #10b981)"
                        : "linear-gradient(45deg, #0ea5e9, #3b82f6)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    "&:hover": {
                      boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {loading
                    ? loadingMessage || "Saving..."
                    : imageValidationStatus.isValidating
                    ? "Validating Image..."
                    : dialogMode === "create"
                    ? "Create Recipe"
                    : "Update Recipe"}
                </Button>
              )}
            </DialogActions>
          </Dialog>

          {/* Snackbar for notifications */}
          <Snackbar
            open={!!success}
            autoHideDuration={6000}
            onClose={() => setSuccess("")}
          >
            <Alert onClose={() => setSuccess("")} severity="success">
              {success}
            </Alert>
          </Snackbar>

          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError("")}
          >
            <Alert onClose={() => setError("")} severity="error">
              {error}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
