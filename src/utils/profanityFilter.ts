// Simple profanity filter for text validation
const PROFANITY_WORDS = [
  // Common inappropriate words (keeping this list basic and appropriate)
  "damn",
  "hell",
  "crap",
  "shit",
  "fuck",
  "ass",
  "bitch",
  "bastard",
  "piss",
  "cock",
  "dick",
  "pussy",
  "whore",
  "slut",
  "retard",
  "idiot",
  "stupid",
  "dumb",
  "moron",
  "hate",
  "kill",
  "die",
  "death",
  "murder",
  // Add more words as needed
].map((word) => word.toLowerCase());

export interface ProfanityCheckResult {
  isClean: boolean;
  detectedWords: string[];
  cleanedText?: string;
}

/**
 * Checks if text contains profanity/inappropriate words
 */
export const checkForProfanity = (text: string): ProfanityCheckResult => {
  if (!text || typeof text !== "string") {
    return { isClean: true, detectedWords: [] };
  }

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Replace punctuation with spaces
    .split(/\s+/)
    .filter((word) => word.length > 0);

  const detectedWords: string[] = [];

  words.forEach((word) => {
    if (PROFANITY_WORDS.includes(word)) {
      detectedWords.push(word);
    }
  });

  return {
    isClean: detectedWords.length === 0,
    detectedWords: [...new Set(detectedWords)], // Remove duplicates
  };
};

/**
 * Validates recipe text fields for profanity
 */
export const validateRecipeContent = (recipe: {
  name: string;
  ingredients: string[] | string;
  instructions: string[] | string;
  tags?: string[] | string;
  source?: string;
}): ProfanityCheckResult => {
  const textsToCheck: string[] = [];

  // Add recipe name
  if (recipe.name) {
    textsToCheck.push(recipe.name);
  }

  // Add ingredients
  if (recipe.ingredients) {
    if (Array.isArray(recipe.ingredients)) {
      textsToCheck.push(...recipe.ingredients);
    } else {
      textsToCheck.push(recipe.ingredients);
    }
  }

  // Add instructions
  if (recipe.instructions) {
    if (Array.isArray(recipe.instructions)) {
      textsToCheck.push(...recipe.instructions);
    } else {
      textsToCheck.push(recipe.instructions);
    }
  }

  // Add tags
  if (recipe.tags) {
    if (Array.isArray(recipe.tags)) {
      textsToCheck.push(...recipe.tags);
    } else {
      textsToCheck.push(recipe.tags);
    }
  }

  // Add source
  if (recipe.source) {
    textsToCheck.push(recipe.source);
  }

  const allDetectedWords: string[] = [];

  for (const text of textsToCheck) {
    const result = checkForProfanity(text);
    if (!result.isClean) {
      allDetectedWords.push(...result.detectedWords);
    }
  }

  return {
    isClean: allDetectedWords.length === 0,
    detectedWords: [...new Set(allDetectedWords)], // Remove duplicates
  };
};

/**
 * Gets a user-friendly error message for profanity detection
 */
export const getProfanityErrorMessage = (detectedWords: string[]): string => {
  if (detectedWords.length === 0) {
    return "";
  }

  if (detectedWords.length === 1) {
    return `Inappropriate content detected. Please remove or replace inappropriate language and try again.`;
  }

  return `Inappropriate content detected. Please review your content and remove any inappropriate language before submitting.`;
};
