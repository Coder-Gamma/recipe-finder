import { Box, Container, Typography, Paper } from "@mui/material";

const About = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          About Recipe Finder
        </Typography>
        <Box sx={{ my: 3 }}>
          <Typography variant="body1" paragraph>
            Recipe Finder is your go-to destination for discovering delicious
            recipes from around the world. Our platform makes it easy to find,
            save, and organize your favorite recipes all in one place.
          </Typography>
          <Typography variant="body1" paragraph>
            Whether you're an experienced chef or just starting your culinary
            journey, Recipe Finder provides you with a vast collection of
            recipes to explore and experiment with.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Key Features:
          </Typography>
          <Typography component="ul" sx={{ pl: 2 }}>
            <li>Search through thousands of recipes</li>
            <li>Save your favorite recipes</li>
            <li>Easy-to-follow cooking instructions</li>
            <li>Detailed ingredient lists</li>
            <li>Beautiful food photography</li>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default About;
