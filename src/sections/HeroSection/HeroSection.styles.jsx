import { styled } from "@mui/material/styles";
import { Box, Button, Container, Typography } from "@mui/material";

// Background image with overlay styling
export const HeroSectionContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  backgroundImage: `
  linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.60),
    rgba(0, 0, 0, 0.70)
  ),
  url('/images/background.jpg')
`,

  backgroundSize: "cover",
  backgroundPosition: "center",
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",

  [theme.breakpoints.down("md")]: {
    height: "75vh",
  },
}));

// Styled container for text content to ensure proper z-index
export const ContentContainer = styled(Container)(() => ({
  position: "relative",
  zIndex: 2,
  textAlign: "center",
}));

// Styled buttons - UPDATED TO USE THEME COLORS
export const HeroButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  padding: theme.spacing(1, 4),
  border: `2px solid ${theme.palette.primary.main}`,
  fontWeight: 700,
  color: "#fff",
  backgroundColor: theme.palette.primary.main,

  "&:hover": {
    backgroundColor: "transparent",
    borderColor: "#fff",
    color: "#fff",
  },

  "&.MuiButton-outlined": {
    color: theme.palette.primary.main,
    borderColor: "#fff",
    backgroundColor: "#fff",

    "&:hover": {
      backgroundColor: "transparent",
      borderColor: "#fff",
      color: "#fff",
    },
  },
}));

export const MainTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const SubTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));