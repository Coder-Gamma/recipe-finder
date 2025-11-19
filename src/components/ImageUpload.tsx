import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Stack,
  IconButton,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useImageValidation } from "../hooks/useImageValidation";
import axios from "axios";

interface ImageUploadProps {
  value: string;
  onChange: (imageUrl: string) => void;
  label?: string;
  onValidationChange?: (
    isValid: boolean,
    isValidating: boolean,
    hasImage: boolean
  ) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = "Recipe Image",
  onValidationChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");

  const { isValidating, lastValidationResult, validateImage, preloadModel } =
    useImageValidation();

  // Preload the model on component mount for better performance
  useEffect(() => {
    preloadModel();
  }, [preloadModel]);

  // Update preview when value changes
  useEffect(() => {
    if (value && !previewUrl) {
      setPreviewUrl(
        value.startsWith("http") ? value : `http://localhost:3001${value}`
      );
    }
  }, [value, previewUrl]);

  // Notify parent component about validation state changes
  useEffect(() => {
    if (onValidationChange) {
      const hasImage = !!(value || previewUrl);
      const isValid =
        lastValidationResult?.isValid === true && !validationError;
      console.log(
        "📡 ImageUpload: Notifying parent of validation state change:",
        {
          hasImage,
          isValid,
          isValidating,
          lastValidationResult,
          validationError,
        }
      );
      onValidationChange(isValid, isValidating, hasImage);
    }
  }, [
    onValidationChange,
    value,
    previewUrl,
    lastValidationResult,
    validationError,
    isValidating,
  ]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setUploadError("");
    setValidationError("");
    setSelectedFile(file);

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    // Start validation
    handleValidateAndUpload(file);
  };

  const handleValidateAndUpload = async (file: File) => {
    console.log("🔍 ImageUpload: Starting validation for file:", file.name);
    try {
      // First validate the image
      console.log("🔍 ImageUpload: Calling validateImage...");
      const validationResult = await validateImage(file);
      console.log("🔍 ImageUpload: Validation result:", validationResult);

      if (!validationResult.isValid) {
        console.log(
          "❌ ImageUpload: Validation failed:",
          validationResult.reason
        );
        setValidationError(
          validationResult.reason || "Image is not food-related"
        );
        return;
      }

      console.log("✅ ImageUpload: Validation passed, uploading image...");
      // If validation passes, upload the image
      await uploadImage(file);
    } catch (error) {
      console.error("Validation/upload error:", error);
      setValidationError("Failed to validate image");
    }
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(
        "http://localhost:3001/api/upload/image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.imageUrl) {
        onChange(response.data.imageUrl);
        setUploadError("");
      } else {
        throw new Error("No image URL returned from server");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to upload image"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    onChange("");
    setUploadError("");
    setValidationError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRetryValidation = () => {
    if (selectedFile) {
      setValidationError("");
      handleValidateAndUpload(selectedFile);
    }
  };

  const handleManualUrlChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const url = event.target.value;
    onChange(url);
    if (!url) {
      handleRemoveImage();
    } else {
      setPreviewUrl(
        url.startsWith("http") ? url : `http://localhost:3001${url}`
      );
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {label}
      </Typography>

      <Stack spacing={2}>
        {/* File Upload Button */}
        <Box>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadIcon />}
            disabled={isValidating || isUploading}
            fullWidth
          >
            Upload Food Image
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileSelect}
            />
          </Button>
        </Box>

        {/* Manual URL Input */}
        <TextField
          fullWidth
          label="Or enter image URL"
          value={value}
          onChange={handleManualUrlChange}
          variant="outlined"
          size="small"
        />

        {/* Loading States */}
        {(isValidating || isUploading) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              {isValidating
                ? "Validating image content..."
                : "Uploading image..."}
            </Typography>
          </Box>
        )}

        {/* Validation Results */}
        {lastValidationResult && !isValidating && (
          <Box>
            {lastValidationResult.isValid ? (
              <Alert severity="success" sx={{ mb: 1 }}>
                ✅ Image validated successfully! (Confidence:{" "}
                {(lastValidationResult.confidence * 100).toFixed(1)}%)
              </Alert>
            ) : (
              <Alert
                severity="error"
                sx={{ mb: 1 }}
                action={
                  <IconButton
                    color="inherit"
                    size="small"
                    onClick={handleRetryValidation}
                    disabled={!selectedFile}
                  >
                    <RefreshIcon />
                  </IconButton>
                }
              >
                ❌ {lastValidationResult.reason}
              </Alert>
            )}

            {/* Show top predictions */}
            {lastValidationResult.predictions.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                >
                  AI detected:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                  {lastValidationResult.predictions
                    .slice(0, 3)
                    .map(
                      (
                        pred: { className: string; probability: number },
                        index: number
                      ) => (
                        <Chip
                          key={index}
                          label={`${pred.className} (${(
                            pred.probability * 100
                          ).toFixed(1)}%)`}
                          size="small"
                          variant="outlined"
                          color={
                            lastValidationResult.isValid ? "success" : "default"
                          }
                        />
                      )
                    )}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Errors */}
        {validationError && (
          <Alert
            severity="error"
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={handleRetryValidation}
                disabled={!selectedFile}
              >
                <RefreshIcon />
              </IconButton>
            }
          >
            {validationError}
          </Alert>
        )}

        {uploadError && <Alert severity="error">{uploadError}</Alert>}

        {/* Image Preview */}
        {previewUrl && (
          <Box sx={{ position: "relative" }}>
            <Box
              component="img"
              src={previewUrl}
              alt="Recipe preview"
              sx={{
                width: "100%",
                maxHeight: 200,
                objectFit: "contain",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
              }}
              onError={() => {
                console.error("Failed to load image preview");
                setPreviewUrl("");
              }}
            />
            <IconButton
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                bgcolor: "rgba(255, 255, 255, 0.8)",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.9)",
                },
              }}
              size="small"
              onClick={handleRemoveImage}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        )}

        {/* Help Text */}
        <Typography variant="caption" color="text.secondary">
          Upload an image showing food, ingredients, or cooking-related items.
          The AI will automatically validate that your image is food-related
          before uploading.
        </Typography>
      </Stack>
    </Paper>
  );
};

export default ImageUpload;
