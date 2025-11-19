import React from "react";
import {
  Box,
  Typography,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";

/**
 * Help component explaining the image validation system
 */
const ImageValidationHelp: React.FC = () => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        🤖 AI Image Validation Help
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Our AI system automatically validates uploaded images to ensure they
        contain food or cooking-related content.
      </Alert>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            ✅ What Images Are Accepted
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Food dishes and meals"
                secondary="Pizza, burgers, salads, soups, etc."
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Individual ingredients"
                secondary="Fruits, vegetables, spices, herbs"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Cooking utensils and tools"
                secondary="Pans, knives, mixing bowls, spatulas"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Kitchen appliances"
                secondary="Ovens, blenders, food processors"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Beverages"
                secondary="Coffee, tea, juices, cocktails"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            ❌ What Images Are Rejected
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            <ListItem>
              <ListItemText
                primary="People or portraits"
                secondary="Faces, body shots, group photos"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Landscapes and nature"
                secondary="Mountains, beaches, forests, etc."
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Animals"
                secondary="Pets, wildlife, livestock"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Vehicles"
                secondary="Cars, planes, boats, bikes"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Non-food objects"
                secondary="Electronics, furniture, clothing"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            🔧 Technical Specifications
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              File Requirements:
            </Typography>
            <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label="Max 5MB" size="small" />
              <Chip label="JPEG/PNG/WebP" size="small" />
              <Chip label="Min 100×100px" size="small" />
              <Chip label="Max 4000×4000px" size="small" />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Images are automatically optimized (resized to max 1200px and
              compressed to 85% quality) for better web performance.
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">⚡ How It Works</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            <ListItem>
              <ListItemText
                primary="1. Client-side AI Analysis"
                secondary="TensorFlow.js with MobileNet model analyzes image content in your browser"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="2. Food Detection"
                secondary="AI identifies objects in the image and determines if they're food-related"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="3. Server-side Validation"
                secondary="Additional checks for file format, size, dimensions, and technical requirements"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="4. Image Optimization"
                secondary="Automatic resizing and compression for optimal web performance"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Alert severity="warning" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Note:</strong> The AI model loads when the page first opens.
          Initial validation may take a few seconds while the model downloads
          (~2.5MB).
        </Typography>
      </Alert>
    </Paper>
  );
};

export default ImageValidationHelp;
