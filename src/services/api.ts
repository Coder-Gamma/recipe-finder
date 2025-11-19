import axios from "axios";
import type { Recipe } from "../types/Recipe";

const BASE_URL = "http://localhost:3001/api"; // MySQL API

// Set up axios interceptor to include auth token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Recipes
  getRecipes: async (params?: {
    cuisine?: string;
    category?: string;
    search?: string;
  }): Promise<Recipe[]> => {
    const response = await axios.get(`${BASE_URL}/recipes`, { params });
    return response.data.recipes;
  },

  getRecipeById: async (id: string): Promise<Recipe> => {
    const response = await axios.get(`${BASE_URL}/recipes/${id}`);
    return response.data;
  },

  getRecipeRecommendations: async (
    id: string,
    limit: number = 6
  ): Promise<{
    recommendations: Array<{
      recipe: Recipe;
      score: number;
      reasons: string[];
    }>;
  }> => {
    const response = await axios.get(
      `${BASE_URL}/recipes/${id}/recommendations`,
      {
        params: { limit },
      }
    );
    return response.data;
  },

  createRecipe: async (
    recipe: Recipe
  ): Promise<{ message: string; id: string }> => {
    const response = await axios.post(`${BASE_URL}/recipes`, recipe);
    return response.data;
  },

  updateRecipe: async (
    id: string,
    recipe: Partial<Recipe>
  ): Promise<{ message: string }> => {
    const response = await axios.put(`${BASE_URL}/recipes/${id}`, recipe);
    return response.data;
  },

  deleteRecipe: async (id: string): Promise<{ message: string }> => {
    const response = await axios.delete(`${BASE_URL}/recipes/${id}`);
    return response.data;
  },

  // Metadata
  getCuisines: async (): Promise<string[]> => {
    const response = await axios.get(`${BASE_URL}/cuisines`);
    return response.data;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await axios.get(`${BASE_URL}/categories`);
    return response.data;
  },

  // System
  healthCheck: async (): Promise<{
    status: string;
    database: string;
    timestamp: string;
  }> => {
    const response = await axios.get(`${BASE_URL}/health`);
    return response.data;
  },

  // Authentication (Future implementation)
  login: async (email: string, password: string) => {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password,
    });
    return response.data;
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    gender?: string;
    age?: number;
    address?: string;
  }) => {
    const response = await axios.post(`${BASE_URL}/auth/register`, userData);
    return response.data;
  },

  // User Management
  updateProfile: async (userData: {
    name: string;
    email: string;
    gender?: string;
    age?: number;
    address?: string;
  }) => {
    const response = await axios.put(`${BASE_URL}/auth/profile`, userData);
    return response.data;
  },

  updateUser: async (
    userId: number,
    userData: Partial<{
      name: string;
      email: string;
      gender: string;
      age: number;
      address: string;
    }>
  ) => {
    const response = await axios.put(`${BASE_URL}/users/${userId}`, userData);
    return response.data;
  },

  getUserProfile: async () => {
    const response = await axios.get(`${BASE_URL}/users/profile`);
    return response.data;
  },

  // Favorites
  getFavorites: async (): Promise<Recipe[]> => {
    const response = await axios.get(`${BASE_URL}/favorites`);
    return response.data;
  },

  addToFavorites: async (recipeId: string): Promise<void> => {
    await axios.post(`${BASE_URL}/favorites/${recipeId}`);
  },

  removeFromFavorites: async (recipeId: string): Promise<void> => {
    await axios.delete(`${BASE_URL}/favorites/${recipeId}`);
  },

  // Image upload
  uploadImage: async (file: File): Promise<{ imageUrl: string }> => {
    console.log("API: Starting image upload for file:", file.name);

    const formData = new FormData();
    formData.append("image", file);

    console.log(
      "API: FormData created, making request to:",
      `${BASE_URL}/upload/image`
    );

    try {
      const response = await axios.post(`${BASE_URL}/upload/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000, // 30 second timeout
      });

      console.log("API: Upload successful, response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API: Upload failed:", error);
      throw error;
    }
  },
};
