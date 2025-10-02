import { createTheme } from "@mui/material/styles";

const serifFont = '"Merriweather", serif';

const theme = createTheme({
  typography: {
    fontFamily: serifFont, // Default font for all text
    h1: {
      fontWeight: 600,
      fontSize: "3rem",
      "@media (max-width:900px)": {
        fontSize: "2.5rem",
      },
      "@media (max-width:600px)": {
        fontSize: "2rem",
      },
    },
    h2: {
      fontWeight: 500,
      fontSize: "2.25rem",
      "@media (max-width:900px)": {
        fontSize: "1.75rem",
      },
      "@media (max-width:600px)": {
        fontSize: "1.5rem",
      },
    },
    h3: {
      fontWeight: 500,
      fontSize: "1.75rem",
      "@media (max-width:900px)": {
        fontSize: "1.5rem",
      },
      "@media (max-width:600px)": {
        fontSize: "1.25rem",
      },
    },
    h4: {
      fontWeight: 500,
      fontSize: "1.5rem",
      "@media (max-width:900px)": {
        fontSize: "1.25rem",
      },
      "@media (max-width:600px)": {
        fontSize: "1rem",
      },
    },
    body1: {
      color: "#2a2a2a",
    },
  },
  palette: {
    primary: {
      main: "#1976d2",      // Medium blue (MUI default blue)
      dark: "#1565c0",      // Darker blue
      light: "#42a5f5",     // Lighter blue
      custom: "#e3f2fd",    // Very light blue background
    },
    secondary: {
      main: "#3b3b3b",
      light: "#646464",
      dark: "#2a2a2a",
      darker: "#212121",
    },
    background: {
      default: "#fff",      // Default background color
      paper: "#fff",        // Default for MUI Paper components
      custom: "#f5f9ff",    // Custom light blue background
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        outlined: {
          borderColor: "currentColor",
          "&:hover": {
            borderColor: "currentColor",
            backgroundColor: "#1976d2",
            color: "#fff",
          },
        },
      },
    },
  },
});

export default theme;