import { useState, useCallback } from "react";
import { validateImageFile, preloadModel } from "../utils/imageValidation";

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  predictions: Array<{ className: string; probability: number }>;
  reason?: string;
}

interface UseImageValidationReturn {
  isValidating: boolean;
  lastValidationResult: ValidationResult | null;
  validateImage: (file: File) => Promise<ValidationResult>;
  preloadModel: () => Promise<void>;
}

/**
 * Hook for validating food images using TensorFlow.js and MobileNet
 */
export const useImageValidation = (): UseImageValidationReturn => {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidationResult, setLastValidationResult] =
    useState<ValidationResult | null>(null);

  const validateImage = useCallback(
    async (file: File): Promise<ValidationResult> => {
      setIsValidating(true);
      try {
        const result = await validateImageFile(file);
        setLastValidationResult(result);
        return result;
      } catch (error) {
        console.error("Image validation error:", error);
        const errorResult: ValidationResult = {
          isValid: false,
          confidence: 0,
          predictions: [],
          reason: "An error occurred during image validation",
        };
        setLastValidationResult(errorResult);
        return errorResult;
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  const handlePreloadModel = useCallback(async (): Promise<void> => {
    try {
      await preloadModel();
    } catch (error) {
      console.warn("Failed to preload model:", error);
    }
  }, []);

  return {
    isValidating,
    lastValidationResult,
    validateImage,
    preloadModel: handlePreloadModel,
  };
};
