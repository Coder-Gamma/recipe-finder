import {
  Box,
  Container,
  Typography,
  Link,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Facebook,
  Twitter,
  Instagram,
  YouTube,
  Email,
  Phone,
} from "@mui/icons-material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "white",
        py: 6,
        mt: "auto",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 4,
          }}
        >
          {/* About Section */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Recipe Finder
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, maxWidth: 300 }}
            >
              Discover delicious recipes from around the world. Our mission is
              to make cooking accessible and enjoyable for everyone.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <IconButton
                component={Link}
                href="#"
                color="primary"
                aria-label="Facebook"
              >
                <Facebook />
              </IconButton>
              <IconButton
                component={Link}
                href="#"
                color="primary"
                aria-label="Twitter"
              >
                <Twitter />
              </IconButton>
              <IconButton
                component={Link}
                href="#"
                color="primary"
                aria-label="Instagram"
              >
                <Instagram />
              </IconButton>
              <IconButton
                component={Link}
                href="#"
                color="primary"
                aria-label="YouTube"
              >
                <YouTube />
              </IconButton>
            </Box>
          </Box>

          {/* Quick Links */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Quick Links
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Link href="#" underline="hover" color="text.secondary">
                Popular Recipes
              </Link>
              <Link href="#" underline="hover" color="text.secondary">
                Categories
              </Link>
              <Link href="#" underline="hover" color="text.secondary">
                About Us
              </Link>
              <Link href="#" underline="hover" color="text.secondary">
                Contact
              </Link>
            </Box>
          </Box>

          {/* Contact Info */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Contact Us
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Email color="primary" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  support@recipefinder.com
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Phone color="primary" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  +977 9844363037
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Bottom Footer */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Recipe Finder. All rights reserved.
          </Typography>
          <Box sx={{ display: "flex", gap: 3 }}>
            <Link
              href="#"
              underline="hover"
              color="text.secondary"
              variant="body2"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              underline="hover"
              color="text.secondary"
              variant="body2"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              underline="hover"
              color="text.secondary"
              variant="body2"
            >
              Cookie Policy
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
