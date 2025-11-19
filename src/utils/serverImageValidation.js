import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

/**
 * Server-side image validation utilities
 * This provides additional validation beyond the client-side TensorFlow validation
 */

const ALLOWED_FORMATS = ["jpeg", "jpg", "png", "webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_DIMENSIONS = { width: 100, height: 100 };
const MAX_DIMENSIONS = { width: 4000, height: 4000 };

/**
 * Validate image format, size, and dimensions
 * @param {string} filePath - Path to the image file
 * @returns {Promise<{isValid: boolean, error?: string, metadata?: object}>}
 */
export const validateImage = async (filePath) => {
  try {
    // Check if file exists
    const stats = await fs.stat(filePath);

    // Check file size
    if (stats.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size (${(stats.size / (1024 * 1024)).toFixed(
          2
        )}MB) exceeds maximum allowed size (${
          MAX_FILE_SIZE / (1024 * 1024)
        }MB)`,
      };
    }

    // Get image metadata using Sharp
    const metadata = await sharp(filePath).metadata();

    // Check format
    if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format)) {
      return {
        isValid: false,
        error: `Invalid image format. Allowed formats: ${ALLOWED_FORMATS.join(
          ", "
        )}`,
      };
    }

    // Check dimensions
    if (!metadata.width || !metadata.height) {
      return {
        isValid: false,
        error: "Unable to determine image dimensions",
      };
    }

    if (
      metadata.width < MIN_DIMENSIONS.width ||
      metadata.height < MIN_DIMENSIONS.height
    ) {
      return {
        isValid: false,
        error: `Image dimensions (${metadata.width}x${metadata.height}) are too small. Minimum: ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height}`,
      };
    }

    if (
      metadata.width > MAX_DIMENSIONS.width ||
      metadata.height > MAX_DIMENSIONS.height
    ) {
      return {
        isValid: false,
        error: `Image dimensions (${metadata.width}x${metadata.height}) are too large. Maximum: ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height}`,
      };
    }

    // Check if image has suspicious characteristics that might indicate non-food content
    const aspectRatio = metadata.width / metadata.height;
    if (aspectRatio > 10 || aspectRatio < 0.1) {
      return {
        isValid: false,
        error:
          "Image has unusual aspect ratio that may not be suitable for food photography",
      };
    }

    return {
      isValid: true,
      metadata: {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: stats.size,
      },
    };
  } catch (error) {
    console.error("Image validation error:", error);
    return {
      isValid: false,
      error: "Failed to process image. Please ensure it is a valid image file.",
    };
  }
};

/**
 * Optimize image for web (resize if too large, compress)
 * @param {string} inputPath - Input image path
 * @param {string} outputPath - Output image path
 * @param {object} options - Optimization options
 */
export const optimizeImage = async (inputPath, outputPath, options = {}) => {
  const { maxWidth = 1200, maxHeight = 1200, quality = 85 } = options;

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    let pipeline = image;

    // Resize if image is too large
    if (
      metadata.width &&
      metadata.height &&
      (metadata.width > maxWidth || metadata.height > maxHeight)
    ) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Convert to JPEG with quality compression
    pipeline = pipeline.jpeg({ quality });

    await pipeline.toFile(outputPath);

    // Remove original if it's different from output
    if (inputPath !== outputPath) {
      await fs.unlink(inputPath);
    }
  } catch (error) {
    console.error("Image optimization error:", error);
    throw new Error("Failed to optimize image");
  }
};

/**
 * Generate thumbnail for image
 * @param {string} inputPath - Input image path
 * @param {string} outputPath - Output image path
 * @param {number} size - Thumbnail size (default 200)
 */
export const generateThumbnail = async (inputPath, outputPath, size = 200) => {
  try {
    await sharp(inputPath)
      .resize(size, size, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
  } catch (error) {
    console.error("Thumbnail generation error:", error);
    throw new Error("Failed to generate thumbnail");
  }
};
