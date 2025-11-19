import { Recipe } from "../types/Recipe";

export interface RecommendationScore {
  recipe: Recipe;
  score: number;
  reasons: string[];
}

/**
 * Content-based recommendation engine that recommends recipes based on similarity
 * to the current recipe being viewed
 */
export class RecipeRecommendationEngine {
  /**
   * Calculate similarity score between two recipes based on various factors
   */
  private calculateSimilarity(
    targetRecipe: Recipe,
    candidateRecipe: Recipe
  ): number {
    let score = 0;

    // Same cuisine gets high weight (40% of total score)
    if (targetRecipe.cuisine === candidateRecipe.cuisine) {
      score += 0.4;
    }

    // Same category gets medium weight (30% of total score)
    if (targetRecipe.category === candidateRecipe.category) {
      score += 0.3;
    }

    // Similar tags get weight based on overlap (20% of total score)
    const targetTags = new Set(
      targetRecipe.tags.map((tag) => tag.toLowerCase())
    );
    const candidateTags = new Set(
      candidateRecipe.tags.map((tag) => tag.toLowerCase())
    );
    const tagIntersection = new Set(
      [...targetTags].filter((tag) => candidateTags.has(tag))
    );
    const tagUnion = new Set([...targetTags, ...candidateTags]);

    if (tagUnion.size > 0) {
      const tagSimilarity = tagIntersection.size / tagUnion.size;
      score += tagSimilarity * 0.2;
    }

    // Similar ingredients get weight based on overlap (10% of total score)
    const targetIngredients = new Set(
      targetRecipe.ingredients.map((ing) => ing.toLowerCase())
    );
    const candidateIngredients = new Set(
      candidateRecipe.ingredients.map((ing) => ing.toLowerCase())
    );
    const ingredientIntersection = new Set(
      [...targetIngredients].filter((ing) => candidateIngredients.has(ing))
    );
    const ingredientUnion = new Set([
      ...targetIngredients,
      ...candidateIngredients,
    ]);

    if (ingredientUnion.size > 0) {
      const ingredientSimilarity =
        ingredientIntersection.size / ingredientUnion.size;
      score += ingredientSimilarity * 0.1;
    }

    return score;
  }

  /**
   * Get recommendations for a given recipe
   */
  public getRecommendations(
    targetRecipe: Recipe,
    allRecipes: Recipe[],
    maxRecommendations: number = 6
  ): RecommendationScore[] {
    const recommendations: RecommendationScore[] = [];

    // Filter out the target recipe itself
    const candidateRecipes = allRecipes.filter(
      (recipe) => recipe.id !== targetRecipe.id
    );

    // Calculate similarity scores for all candidate recipes
    candidateRecipes.forEach((candidateRecipe) => {
      const score = this.calculateSimilarity(targetRecipe, candidateRecipe);

      // Only include recipes with some similarity (score > 0.1)
      if (score > 0.1) {
        const reasons = this.generateReasons(targetRecipe, candidateRecipe);
        recommendations.push({
          recipe: candidateRecipe,
          score,
          reasons,
        });
      }
    });

    // Sort by score (highest first) and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations);
  }

  /**
   * Generate human-readable reasons for the recommendation
   */
  private generateReasons(
    targetRecipe: Recipe,
    candidateRecipe: Recipe
  ): string[] {
    const reasons: string[] = [];

    if (targetRecipe.cuisine === candidateRecipe.cuisine) {
      reasons.push(`Same cuisine (${targetRecipe.cuisine})`);
    }

    if (targetRecipe.category === candidateRecipe.category) {
      reasons.push(`Same category (${targetRecipe.category})`);
    }

    const targetTags = new Set(
      targetRecipe.tags.map((tag) => tag.toLowerCase())
    );
    const candidateTags = new Set(
      candidateRecipe.tags.map((tag) => tag.toLowerCase())
    );
    const commonTags = [...targetTags].filter((tag) => candidateTags.has(tag));

    if (commonTags.length > 0) {
      reasons.push(`Similar tags: ${commonTags.slice(0, 3).join(", ")}`);
    }

    const targetIngredients = new Set(
      targetRecipe.ingredients.map((ing) => ing.toLowerCase())
    );
    const candidateIngredients = new Set(
      candidateRecipe.ingredients.map((ing) => ing.toLowerCase())
    );
    const commonIngredients = [...targetIngredients].filter((ing) =>
      candidateIngredients.has(ing)
    );

    if (commonIngredients.length > 0) {
      reasons.push(
        `Similar ingredients: ${commonIngredients.slice(0, 2).join(", ")}`
      );
    }

    return reasons.length > 0 ? reasons : ["Similar recipe"];
  }
}

// Export a singleton instance
export const recommendationEngine = new RecipeRecommendationEngine();
